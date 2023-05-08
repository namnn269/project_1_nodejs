const express = require('express');
const authController = require('./../controller/authController');
const userController = require('./../controller/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.patch('/forgot-password', authController.forgotPassword);
router.patch('/reset-password', authController.resetPassword);
router.delete(
  '/delete-me',
  authController.authenticate,
  authController.deleteMe
);
router.patch(
  '/change-password',
  authController.authenticate,
  authController.changePassword
);
router.patch(
  '/update-me',
  authController.authenticate,
  authController.updateMe
);

router.route('/').get(userController.getAllUsers).post().patch();

router.route('/:id').get().delete();

module.exports = router;
