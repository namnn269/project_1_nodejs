const TourModel = require('./../models/TourModel');
const AppError = require('./../utils/appError');
const APIFeature = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.getAllTours = catchAsync(async (req, res, next) => {
  const apiFeatures = new APIFeature(req, TourModel.find());
  const tours = await apiFeatures.find().sort().selectFields().paginate()
    .queryDb;

  res
    .status(200)
    .json({ status: 'Successfully', size: tours.length, data: tours });
});

exports.getById = catchAsync(async (req, res, next) => {
  const tour = await TourModel.findById(req.params.id);
  if (!tour)
    throw new AppError(
      `Tour with id (${req.params.id}) not found`,
      404,
      'Unsuccessfully'
    );
  res.status(200).json({ status: 'Successfully', data: tour });
});

exports.post = catchAsync(async (req, res, next) => {
  const tour = await TourModel.create(req.body);
  if (!tour) throw new Error('Can not create tour');
  res.status(201).json({ status: 'Successfully', data: tour });
});

exports.updateById = catchAsync(async (req, res, next) => {
  const tour = await TourModel.findByIdAndUpdate(req.body.id, req.body, {
    runValidators: true,
    new: true,
  });
  if (!tour) throw new AppError('Update fail', 400, 'fail');
  res.status(202).json({ status: 'Successfully', data: tour });
});

exports.deleteById = catchAsync(async (req, res, next) => {
  const tour = await TourModel.findByIdAndDelete(req.params.id);
  if (!tour)
    throw new AppError(
      `Delete tour with id ${req.params.id} fail, tour not found`,
      404,
      'fail'
    );
  res
    .status(200)
    .json({ status: 'Successfully', message: 'Delete successfully' });
});

exports.aggregate = catchAsync(async (req, res, next) => {
  const statistics = await TourModel.aggregate([
    { $unwind: '$startDates' },
    { $match: { duration: { $gte: 0 } } },
    {
      $group: {
        _id: { $month: '$startDates' },
        maxDuration: { $max: '$duration' },
        minDuration: { $min: '$duration' },
        avgDuration: { $avg: '$duration' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
        sumPrice: { $sum: '$price' },
        countTour: { $sum: 1 },
      },
    },
    { $addFields: { startMonth: '$_id' } },
    { $sort: { startMonth: 1 } },
    { $project: { _id: 0 } },
  ]);

  res.status(200).json({
    status: 'Successfully',
    size: statistics.length,
    data: statistics,
  });
});
