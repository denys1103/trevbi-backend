const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HistoryActiveUser = require('../models/historyActiveUser');
const ingredientsToAvoid = require('../models/ingredientsToAvoid');
const sgMail = require('@sendgrid/mail');
//gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//sendgrid
sgMail.setApiKey(process.env.SENDGRID_KEY);

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

async function correctSpellingBatch(words) {
  // console.log('words:', JSON.stringify(words, null, 2))
  const prompt = `In the following text, correct spelling errors in words, leave special characters intact, translate the words into English, and return only result(example: word || word, || ,word): ${words.join(' || ')}`;
  const result = await model.generateContent([prompt]);
  // console.log('prompt:', prompt)
  // console.log('correctSpellingBatch:', result.response.candidates[0].content.parts[0].text)
  const correctedWords = result.response.candidates[0].content.parts[0].text.split(' || ').map(word => word.trim());
  return correctedWords;
}

exports.geminiTest = async (req, res) => {
  const array = ['Ths is', 'is', 'smple txt', 'txt', 'anothe', 'wrng', 'wrd'];
  const correctedArray = await correctSpellingBatch(array);
  res.json({ success: true, correctedArray });
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getAvoidData = async (req, res) => {
  const { IngredientsList } = req.body;
  let TempIngredients = IngredientsList;
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  console.log(`Date: ${day} - ${hour}:${minute}`, IngredientsList.length);
  try {
    if(IngredientsList.length > 0) {
      const correctedArray = await correctSpellingBatch(IngredientsList);
      console.log('correctedArray length using gemini api:', correctedArray.length);
      TempIngredients = correctedArray;
    }
  } catch (error) {
    console.log('gemini api error:', error);
  } finally {
    console.log('correctedArray result:', JSON.stringify(TempIngredients, null, 2));
    const results = await ingredientsToAvoid.find({
      name: {
          $in: TempIngredients
          .filter(item => item.trim() !== "")
          .map(item => new RegExp(`^${escapeRegExp(item)}$`, 'i'))
      }
    })
    .limit(15);
  
    res.json({ success: true, results });
  }
};

async function correctSpellingIngredients(ingredientsText) {
  const prompt = `In the following text, translate the words into English, and return only result(includes ingredients in parentheses). Only return the ingredients separated by "||" and if there are no ingredients, return words separated by "||". If the example text is "Artificial color (including F.D.&C. Yellow No.5, FD&C Red No.3), Contains 2% Or Less Of Vegetable Oil (Hydrogenated Coconut, Soybean And/or Cottonseed)", Return example is "Artificial color || Yellow No.5 || Red No.3 || Vegetable Oil || Hydrogenated Coconut || Soybean || Cottonseed".\nThe text is: ${ingredientsText}`;
  const result = await model.generateContent([prompt]);
  // console.log('correctSpellingIngredients:', result.response.candidates[0].content.parts[0].text)
  const correctedWords = result.response.candidates[0].content.parts[0].text.split(' || ').map(word => word.trim());
  return correctedWords;
}

exports.getAvoidListData = async (req, res) => {
  const { IngredientsList } = req.body;
  let TempIngredients = [];
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  console.log(`Date: ${day} - ${hour}:${minute}`, IngredientsList.length);
  try {
    if(IngredientsList.length > 0) {
      const correctedArray = await correctSpellingIngredients(IngredientsList);
      console.log('correctedArray length using gemini api(get avoid list api):', correctedArray.length);
      TempIngredients = correctedArray;
    }
  } catch (error) {
    console.log('gemini api error:', error);
  } finally {
    console.log('correctedArray result(get avoid list api):', JSON.stringify(TempIngredients, null, 2));
    const results = await ingredientsToAvoid.find({
      name: {
          $in: TempIngredients
          .filter(item => item.trim() !== "")
          .map(item => new RegExp(`^${escapeRegExp(item)}$`, 'i'))
      }
    })
    .limit(15);
  
    res.json({ success: true, results });
  }
};

async function askAI(words) {
  const prompt = `${words}\n Please recommend an article of less than 100 words that presents an alternative to a better options.`;
  const result = await model.generateContent([prompt]);
  const answerAticle = result.response.candidates[0].content.parts[0].text;
  return answerAticle;
}

exports.getAskAi = async (req, res) => {
  const { modalData } = req.body;
  const askText = `${modalData.name}\n${modalData.description}`
  let TempAnswer = askText;
  try {
    if(askText.length > 0) {
      const answer = await askAI(askText);
      TempAnswer = answer;
      console.log('TempAnswer length using gemini api:', TempAnswer.length);
    }
  } catch (error) {
    console.log('gemini api error:', error);
  } finally {
    res.json({ success: true, results:TempAnswer });
  }
};

async function barcodeAI(words) {
  const prompt = `${words}\n Please recommend product barcode list that presents an alternative to a better healthier in Open Food Facts, and return only result.(example: barcode || barcode || barcode)`;
  const result = await model.generateContent([prompt]);
  const barcodeList = result.response.candidates[0].content.parts[0].text.split(' || ').map(word => word.trim());
  return barcodeList;
}

exports.getBarcodeAi = async (req, res) => {
  const { modalData } = req.body;
  const askText = `${modalData.name}\n${modalData.description}`
  let TempAnswer = [];
  try {
    if(askText.length > 0) {
      const answer = await barcodeAI(askText);
      TempAnswer = answer;
      console.log('Barcode TempAnswer length using gemini api:', TempAnswer.length);
    }
  } catch (error) {
    console.log('gemini api error:', error);
  } finally {
    res.json({ success: true, results:TempAnswer });
  }
};

exports.getCorrectWords = async (req, res) => {
  const { ocrWords } = req.body;
  let TempIngredients = ocrWords;
  try {
    if(ocrWords.length > 0) {
      const correctedArray = await correctSpellingBatch(ocrWords);
      TempIngredients = correctedArray;
      console.log('getCorrectWords length using gemini api:', TempIngredients.length);
    }
  } catch (error) {
    console.log('gemini api error:', error);
  } finally {
    res.json({ success: true, results:TempIngredients });
  }
};

exports.sendEmailTest = async (req, res) => {
  const msg = {
    to: process.env.MANAGER_EMAIL,
    from: process.env.MANAGER_EMAIL,
    replyTo: process.env.TESTER_EMAIL,
    subject: 'Sendgrid Test',
    html: 'This is <b>Test/b>',
  };

  try {
      await sgMail.send(msg);
      res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Error sending email', error });
  }
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