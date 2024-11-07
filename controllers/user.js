const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HistoryActiveUser = require('../models/historyActiveUser');
const ingredientsToAvoid = require('../models/ingredientsToAvoid');

exports.createUser = async (req, res) => {
  const { fullname, email, password } = req.body;

  const isNewUser = await User.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: 'This email is already in use, try sign-in',
    });
  const user = await User({
    fullname,
    email,
    password,
    status:1,
  });
  await user.save();

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  const activeUser = await HistoryActiveUser({
    fullname,
    email,
    date:formattedDate,
  });
  await activeUser.save();

  res.json({ success: true, user });
};

exports.userSignIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.json({
      success: false,
      message: 'user not found, with the given email!',
    });

  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res.json({
      success: false,
      message: 'email / password does not match!',
    });

  if (!user.status)
    return res.json({
      success: false,
      message: 'Your account has been disabled!',
    });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  let oldTokens = user.tokens || [];

  if (oldTokens.length) {
    oldTokens = oldTokens.filter(t => {
      const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
      if (timeDiff < 86400) {
        return t;
      }
    });
  }

  await User.findByIdAndUpdate(user._id, {
    tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
    login_status: 1,
  });
  
  const isuser = await HistoryActiveUser.findOne({ email:user.email, status:1 });
  if(!isuser){
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const activeUser = await HistoryActiveUser({
      fullname:user.fullname,
      email:user.email,
      status:1,
      date:formattedDate,
    });
    await activeUser.save();
  }
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    gender: user.gender,
    birth: user.birth,
    phone_num: user.phone_num,
    about_you: user.about_you,
    avatar: user.avatar ? user.avatar : '',
  };

  res.json({ success: true, user: userInfo });
};

exports.forgotPassword = async (req, res) => {
  const { email, verify, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.json({
      success: false,
      code: 'unregistered',
    });
  if (verify) {
    const min = 10000;
    const max = 99999;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
	const md5_code = md5(code.toString());
	console.log(code, md5_code);
    const msg = {
      to: email,
      from: `info@cleanlabel.com`,
      subject: `Request of authorization from CleanLabelApp`,
      html: 'verification code:<b>'+code+'</b>',
    };

    sgMail
    .send(msg)
    .then(() => {
		return res.json({
        success: true,
        code: md5_code,
      });
	}, error => {
      console.log(error)
      return res.json({
        success: false,
        code: 'failed',
      });
    });
  } else {
    bcrypt.hash(password, 8, async function (err, hash) {
      if (err)
        return res.json({
          success: false,
          code: 'server error!',
        });
      await User.findByIdAndUpdate(user._id, {
        password: hash,
      });
      res.json({ success: true, code: '' });
    });
  }
};

exports.getIngredientsToAvoid = async (req, res) => {
  const ingredientsList = await ingredientsToAvoid.find({});
  res.json({ success: true, ingredientsList });
};

exports.getAvoidData = async (req, res) => {
  const { IngredientsList } = req.body;
  // console.log('ingredientsList:', IngredientsList);

  const results = await ingredientsToAvoid.find({
    name: { $in: IngredientsList.map(item => new RegExp(`^${item}$`, 'i')) }
  })
  .limit(10);

  res.json({ success: true, results });
};

exports.signOut = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Authorization fail!' });
    }

    const tokens = req.user.tokens;

    const newTokens = tokens.filter(t => t.token !== token);

    await User.findByIdAndUpdate(req.user._id, { tokens: newTokens, login_status: 0 });
    res.json({ success: true, message: 'Sign out successfully!' });
  }
};