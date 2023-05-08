const catchAsync = require('../utils/catchAsync');
const UserModel = require('./../models/UserModel');
const APIFeature = require('./../utils/apiFeatures');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  console.log(req.query);
  const apiFeature = new APIFeature(req, UserModel.find());
  const users = await apiFeature.find().selectFields().sort().paginate()
    .queryDb;
  res.status(200).json({ status: 'Successfully', data: users });
});
