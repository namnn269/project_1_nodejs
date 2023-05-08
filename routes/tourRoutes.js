const express = require('express');
const tourController = require('./../controller/tourController');
const authController = require('../controller/authController');

const router = express.Router();

router.route('/aggregate').get(tourController.aggregate);

router
  .route('/:id')
  .get(tourController.getById)
  .delete(
    authController.authenticate,
    authController.authorize(['admin', 'guide']),
    tourController.deleteById
  );

router
  .route('/')
  .get(authController.authenticate, tourController.getAllTours)
  .post(tourController.post)
  .patch(tourController.updateById);

module.exports = router;
