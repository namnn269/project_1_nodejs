// @ts-nocheck
const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name of tour should not be empty'],
      trim: [true],
      unique: true,
      minlength: [5, 'Name of tour should be more than 5'],
      maxlength: [10, 'Name of tour should be less than 10'],
    },
    startDates: { type: [Date] },
    difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty of tour is either: easy, medium, difficult',
      },
      required: [true, 'A tour should have a difficulty'],
    },
    duration: { type: Number, default: 1 },
    ratingsAverage: {
      type: Number,
      max: [5.0, 'Rating must be below 5.0'],
      min: [1.0, 'Rating must be above 1.0'],
      default: 4.5,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour should be have a price'],
      min: [0, 'Price ({VALUE}) should be greater than 0'],
    },
    priceDiscount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          // @ts-ignore
          return this.price > val;
        },
        message: `Discount of tour ({VALUE}) should be less than price of tour`,
      },
      min: [0, 'Discount should be greater than 0'],
    },
    createdAt: { type: Date, default: Date.now(), select: false },
    secretTour: { type: Boolean, default: false },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.virtual('priceAfterDiscount').get(function () {
  return this.price - this.priceDiscount;
});

tourSchema.pre(/^find/, function (next) {
  // this.find({ secretTour: { $ne: true } });
  // this.select('-__v -secretTour');
  next();
});

tourSchema.pre('save', function (next) {
  console.log('in pre save');
  this.name = slugify(this.name, { replacement: ' ' });
  next();
});

const TourModel = mongoose.model('tours', tourSchema);

module.exports = TourModel;
