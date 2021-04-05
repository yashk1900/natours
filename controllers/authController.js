const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    //here id is in our payload
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  //to not display password in the field
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  //WE WONT USE THE ABOVE CODE AS ITS TAKING THE WHOLE REQUEST BODY AND REGISTERING IT
  //IN THIS WAY SOMEONE CAN JUST PUT A FEILD "admin":"true" TO AVOID THIS
  //WE WILL ONLY MENTION THE FIELDS WE WANT

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    //passwordChangedAt: req.body.passwordChangedAt,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  console.log(email, password);

  //1) CHECK IF EMAIL AND PASSWORD EXIST

  if (!email || !password) {
    return next(new AppError(' Password or Email is not entered ', 400));
  }

  //2) CHECK IF THE USER EXISTS AND PASSWORD IS CORRECT

  //we do .select as when we normally get user password doesnt come with it because we have set select:false
  const user = await User.findOne({ email: email }).select('+password');

  console.log('user is ', user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password', 401));
  }
  //3) SEND A TOKEN TO USER
  createSendToken(user, 200, res);
});

exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expiresIn: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) GETTING THE TOKEN AND CHECKING IF ITS THERE
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in, Please log in!', 401));
  }

  // 2) VERIFYING THE TOKEN

  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) CHECKING IF USER STILL EXISTS

  //this is where we have used the callback function(here findById())  which was supposed to be in verify
  const freshUser = await User.findById(decodedPayload.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4) CHECKING IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED

  if (freshUser.changedPasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError('User recently changed password, Please login again', 401)
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE

  //every other middleware which will be called after this will have the logged in user details in req.user
  req.user = freshUser;
  res.locals.user = freshUser;
  next();
});

//ONLY FOR RENDERED PAGES, NO ERROR
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1)Verifies the token
      const decodedPayload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 3) CHECKING IF USER STILL EXISTS

      //this is where we have used the callback function(here findById())  which was supposed to be in verify
      const freshUser = await User.findById(decodedPayload.id);
      if (!freshUser) {
        return next();
      }

      // 4) CHECKING IF USER CHANGED PASSWORD AFTER THE TOKEN WAS ISSUED

      if (freshUser.changedPasswordAfter(decodedPayload.iat)) {
        return next();
      }

      //GRANT ACCESS TO PROTECTED ROUTE

      //There is a logged in user
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles= ['admin','guide']

    //this works because earlier we passed the value of user we got in protect middleware to req.user, thats why we can use req.user.role
    //as if the user logs in we just have access to email and password in req.body, req.role is only specified while signing up.
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user with the given email address', 404));
  }

  //GENERATE A RANDOM TOKEN
  const resetToken = user.createPasswordResetToken(); //this just modified the document, we need to save the changes we made
  await user.save({ validateBeforeSave: false });

  //SEND IT TO USERS EMAIL

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset email(valid for 10 mins',
    //   message,
    // });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error in sending the email.Try again later!'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) GET USER BASED ON A TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpire: { $gt: Date.now() },
  });

  // 2) IF TOKEN HAS NOT EXPIRED, AND THERE IS A USER, SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpire = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  // 3) UPDATE CHANGEDPASSWORDAT PROPERTY
  // 4) LOG IN USER AND SEND JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1)GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  // 2)CHECK IF POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('The password dosent match with the existing password', 401)
    );
  }

  // 3)UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //USER.FINDBYIDANDUPDATE WILL NOT WORK AS ALL THE MIDDLEWARE WORKS ON SAVE AND NOT UPDATE

  // 4)LOGIN USER,SEND JWT
  createSendToken(user, 200, res);
});
