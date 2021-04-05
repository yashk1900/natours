const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('./../utils/apiFeatures');
var mongoose = require('mongoose');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No doc found with ${req.params.id} id`, 404));
    }

    res.status(204).json({
      status: 'success',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No doc found with ${req.params.id} id`, 404));
    }

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status('201').json({
      status: 'success',
      data: doc,
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    //let _id = mongoose.Types.ObjectId.createFromHexString(req.params.id);

    console.log(req.params.id);
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    console.log(doc);
    //Tours.findOnde({_id = req.params.id})

    if (!doc) {
      return next(
        new AppError(`No document found with ${req.params.id} id`, 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params);
    let filter = {};
    if (req.params.tourId != null) {
      filter = { tour: req.params.tourId };
    }

    // Executing a query
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();
    //const doc = await features.query.explain(); //this is where the function gets called and returns a promise
    const doc = await features.query;

    //sending a query
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        //requestedAt: req.Time,
        doc,
      },
    });
  });
