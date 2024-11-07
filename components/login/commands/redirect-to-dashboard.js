const jwt = require('jsonwebtoken');
const User = require('../../../models/user');

async function redirectToDashboard(req, res) {
  const { email, password } = req.body;

  const adminUser = await User.findOne({ email });
  const userInfo = req.body;

  let msg = {};  
  if (!adminUser){
    msg = {result: 'admin not found, with the given email!'};
    const messages = {
      errors: msg,
    };
    return res.status(200).render('pages/login', { messages, userInfo });
  }

  const isMatch = await adminUser.comparePassword(password);
  if (!isMatch){
    msg = {result: 'email / password does not match!'};
    const messages = {
      errors: msg,
    };
    return res.status(200).render('pages/login', { messages, userInfo });
  }
  if (!adminUser.status){
    msg = {result: 'Your account has been disabled!'};
    const messages = {
      errors: msg,
    };
    return res.status(200).render('pages/login', { messages, userInfo });
  }
  if (!adminUser.role){
    msg = {result: 'You do not have admin permission.'};
    const messages = {
      errors: msg,
    };
    return res.status(200).render('pages/login', { messages, userInfo });
  }

  const token = jwt.sign({ adminId: adminUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  let oldTokens = adminUser.tokens || [];

  if (oldTokens.length) {
    oldTokens = oldTokens.filter(t => {
      const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
      if (timeDiff < 86400) {
        return t;
      }
    });
  }

  await User.findByIdAndUpdate(adminUser._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
  });
  const adminInfo = {
	  _id: adminUser._id,
    fullname: adminUser.fullname,
    avatar: adminUser.avatar,
    email: adminUser.email,
    token: token,
  };
  req.session.adminInfo = adminInfo;
  return res.status(200).redirect('/admin/dashboard');
}

module.exports = redirectToDashboard;
