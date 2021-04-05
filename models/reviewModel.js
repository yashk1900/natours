const mongoose = require('mongoose');
const Tour = require('./tourModel');
//review /rating /createdAt / ref to tour/ ref to user

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cant be empty'],
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'min rating you can give is 1'],
      max: [5, 'max rating you can give is 5'],
    },
    CreatedAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tourReference',
  //   select: 'name',
  // });
  // this.populate({
  //   path: 'userReference',
  //   select: 'name',
  // });

  // this.populate({
  //   path: 'tourReference',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId);
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$Rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  //this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

//------------------------------------------------------
//NOTE HOW WE PASSED THE DATA FROM THE PRE MIDDLEWARE TO POST MIDDLEWARE
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //this.r = await this.findOne(); cant be done here as query already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
//-----------------------------------------------------------
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
