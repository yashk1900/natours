const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const authController = require('../controllers/authController');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res) => {
  //1) GET TOUR DATA

  const tours = await Tour.find();

  //2) BUILD THE TEMPELATE

  //3) RENDER THE TEMPELATE USING TOUR DATA

  res.status(200).render('overview', {
    Title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1) GET THE DATA FOR THE REQUESTED TOUR(INCLUDING GUIDES AND REVIEWS)

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review Rating user ',
  });
  // console.log(tour);

  if (!tour) {
    return next(new AppError('There is no tour with that name'));
  }

  //2)BUILD TEMPLATE

  //3)RENDER TEMPLATE USING DATA FROM 1)

  // .set(
  //   'Content-Security-Policy',
  //   "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  // )

  res.status(200).render('tour', {
    Title: tour.name,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
});

exports.getSignupForm = catchAsync(async (req, res) => {
  console.log('IN the get signup');
  res.status(200).render('signup', {
    title: 'SignUp for a new account',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1)FIND ALL BOOKINGS
  const bookings = await Booking.find({ user: req.user.id });

  //2)FIND TOURS WITH RETURNED IDS
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name, //name and email are the values given to the name field of these 2 inputs in html form
      email: req.body.email,
    },
    {
      new: true,
      runValidator: true,
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
