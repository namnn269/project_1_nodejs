const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator').default;
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'User name is required'] },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please provide a valid email'],
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'admin'],
    default: 'user',
  },
  photo: { type: String },
  password: {
    type: String,
    select: false,
    minlength: [8, 'Password length should be greater than 8'],
    required: [true, 'Please provide a password'],
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a confirm password'],
    validate: {
      validator: function (val) {
        // @ts-ignore
        return this.password === val;
      },
      message: 'Confirm password should equal to password',
    },
  },
  isActive: { type: Boolean, default: true },
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.methods.checkPassword = async function (reqPassword) {
  return await bcrypt.compare(reqPassword, this.password);
};

userSchema.methods.checkPasswordChangedAfterCreatedToken = function (
  createdTokenTime
) {
  if (!this.passwordChangedAt) return false;
  const passwordChangedTime = this.passwordChangedAt.getTime() / 1000;
  return passwordChangedTime > createdTokenTime;
};

userSchema.methods.createResetToken = function () {
  const token = crypto.randomBytes(12).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.resetPasswordExpire =
    // @ts-ignore
    Date.now() + process.env.RESET_PASSWORD_EXPIRES * 1000;
  return token;
};

// @ts-ignore
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  console.log('in create new and update password');
  this.password = await bcrypt.hash(this.password, 12);
  // @ts-ignore
  this.passwordConfirm = undefined;
  next();
});

// @ts-ignore
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  console.log('in only in update password');
  this.passwordChangedAt = new Date();
  next();
});

userSchema.post('save', function (doc, next) {
  doc.set('password', undefined);
  next();
});

userSchema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isActive: { $ne: false } });
  next();
});

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
