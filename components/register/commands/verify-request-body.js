const { check, validationResult } = require('express-validator');
exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();

  let error = result[0].msg;
  let msg = {};  
  if (error == 'name'){
    error = 'Name is required!';
    msg = {name: error}
  } else if (error == 'email'){
    error = 'Email is required!';
    msg = {email: error}
  } else if (error == 'password'){
    error = 'Password is required!';
    msg = {password: error}
  } else {
    error = 'Both password does not match!';
    msg = {confirmPassword: error}
  }
  const messages = {
    errors: msg,
  };
  const userInfo = req.body;

  return res.status(200).render('pages/register', { messages, userInfo });
};

exports.validateSignUp = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('name'),
  check('email').trim().isEmail().withMessage('email'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('password'),
  check('confirmPassword')
    .trim()
    .not()
    .isEmpty()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('confirm');
      }
      return true;
    }),
];