const { promisify } = require('util');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');
const nodeMailer = require('nodemailer');

const UserModel = require('./../models/UserModel');
const AppError = require('../utils/appError');
const sendMail = require('../utils/mailService');
const catchAsync = require('./../utils/catchAsync');

const responseAuth = (res, user, data) => {
  const accessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'secret_key',
    {
      expiresIn: process.env.JWT_EXPIRATION,
      algorithm: 'HS256',
    }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: false,
    // @ts-ignore
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 1000),
  };

  if (process.env.NODE_ENV === 'prod') cookieOptions.secure = true;

  res.cookie('jwt', accessToken, cookieOptions);

  res.status(201).json({ status: 'Successfully', accessToken, data: data });
};

exports.authenticate = catchAsync(async (req, res, next) => {
  const jwtBearer = req.headers.authorization;
  if (!jwtBearer || !jwtBearer.startsWith('Bearer'))
    throw new AppError('Please login', 401);
  const token = jwtBearer.replace('Bearer ', '').trim();

  const jwtVerifyAsync = promisify(jwt.verify);
  // @ts-ignore
  const { id, iat, exp } = await jwtVerifyAsync(token, process.env.JWT_SECRET);

  const currentUser = await UserModel.findById(id);
  if (!currentUser) throw new AppError('User not found', 404);

  // @ts-ignore
  if (currentUser.checkPasswordChangedAfterCreatedToken(iat))
    throw new AppError(
      'Password had changed after this token was generated, please login again',
      401
    );

  req.user = currentUser;
  next();
});

exports.authorize = (roles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!roles.includes(userRole))
      throw new AppError('You are not permitted to access this resource', 403);
    next();
  };
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await UserModel.create(req.body);
  if (!newUser) throw new AppError('Error on signing up new user', 400, 'Fail');
  responseAuth(res, newUser, newUser);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new AppError('Please provide email and password', 400);
  const user = await UserModel.findOne({ email }).select('+password');
  // @ts-ignore
  if (!user || !(await user.checkPassword(password)))
    throw new AppError('Account information is invalid', 401);
  responseAuth(res, user, user);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  if (!email) throw new AppError('Please provide your email', 400);
  const user = await UserModel.findOne({ email });
  if (!user) throw new AppError(`User not found with email ${email}`, 404);

  // @ts-ignore
  const resetPasswordToken = user.createResetToken();

  const url = `click link to reset password: ${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password?token=${resetPasswordToken}`;

  try {
    await sendMail({
      to: 'to22@example.com',
      subject: 'Test subject',
      text: 'this is content',
      html: '<h2>This is html h2 tag</h2>',
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    throw error;
  } finally {
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    status: 'Success',
    url,
    resetPasswordToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const token = req.query.token;
  if (!token) throw new AppError('Token is require to reset password');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserModel.findOne({
    hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError('Invalid or expired token', 400);

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save();

  res.status(200).json({
    status: 'Success',
    message: 'Password has reset successfully',
    user,
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, password, confirmPassword } = req.body;
  if (!oldPassword || !password || !confirmPassword)
    throw new AppError('Please provide full information to change password');

  const user = await UserModel.findById(req.user.id).select('+password');

  // @ts-ignore
  if (!user || !(await user.checkPassword(oldPassword)))
    throw new AppError('Password you provided is incorrect', 401);

  user.password = password;
  user.passwordConfirm = confirmPassword;
  await user.save();
  res
    .status(200)
    .json({ status: 'Success', message: 'Changed password successfully' });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword)
    throw new AppError('This route is not for update password', 400);
  const allowedFields = ['name', 'email'];
  const updateInfo = {};
  allowedFields.forEach(
    (field) => req.body[field] && (updateInfo[field] = req.body[field])
  );

  const user = await UserModel.findByIdAndUpdate(req.user.id, updateInfo, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'Success', data: user });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  console.log('in delete password');
  const user = req.user;
  user.isActive = false;
  const newUser = await UserModel.findByIdAndUpdate(user._id, user, {
    new: true,
    runValidators: true,
  });
  res
    .status(200)
    .json({ status: 'Success', message: 'Delete successfully', newUser });
});
