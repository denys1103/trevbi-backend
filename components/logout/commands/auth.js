const jwt = require('jsonwebtoken');
const admin = require('../../../models/admin');

exports.isAuth = async (req, res, next) => {
  const { token } = req.body;
  if (token) {
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const user = await admin.findById(decode.adminId);
      if (!user) {
        res.json({ success: false, message: error });
      }

      req.user = user;
      next();
    } catch (error) {
      res.json({ success: false, message: error });
    }
  } else {
    res.json({ success: false, message: 'token is empty' });
  }
};
