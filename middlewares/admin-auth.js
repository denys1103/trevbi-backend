const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.isAuth = async (req, res, next) => {
  const adminInfo = req.session.adminInfo;
  const token = adminInfo?.token;
  if (token) {
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decode.adminId);
      if (!user) {
        return res.status(200).redirect('/admin/login');
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(200).redirect('/admin/login');
    }
  } else {
    return res.status(200).redirect('/admin/login');
  }
};
