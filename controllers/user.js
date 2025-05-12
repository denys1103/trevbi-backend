const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HistoryActiveUser = require('../models/historyActiveUser');
const ingredientsToAvoid = require('../models/ingredientsToAvoid');
const RecipeList = require('../models/recipeList');
const Feedback = require('../models/feedback');
const MessageBoard = require('../models/messageBoard');
const sgMail = require('@sendgrid/mail');
const OpenAI = require('openai');
var md5 = require('md5');
const bcrypt = require("bcrypt");
//gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//sendgrid
sgMail.setApiKey(process.env.SENDGRID_KEY);
//openai
const gptClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    expiresIn: '100d',
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
    bio: user.bio,
    avatar: user.avatar ? user.avatar : '',
    following: user.following,
    switchObj: user.isshow,
  };

  res.json({ success: true, user: userInfo, token });
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
    // console.log(code, md5_code);
    const msg = {
      to: email,
      from: process.env.MANAGER_EMAIL,
      subject: `Request of authorization from TREVBI App`,
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
  // const prompt = `In the following Spanish ingredients text, translate the ingredients into English, and return only result(includes ingredients in parentheses). Only return the ingredients separated by "||" and if there are no ingredients, return words separated by "||". If the example text is "Artificial color (including F.D.&C. Yellow No.5, FD&C Red No.3), Contains 2% Or Less Of Vegetable Oil (Hydrogenated Coconut, Soybean And/or Cottonseed), rojo 40, amarillo 6, vitamina D", Return example is "Artificial color||Yellow No.5||Red No.3||Vegetable Oil||Hydrogenated Coconut||Soybean||Cottonseed||Red 40||Yellow 6||vitamin D".\nThe text is: ${ingredientsText}`;
  const prompt = `In the following ingredients text, translate the ingredients into English, and return only result(includes ingredients in parentheses). Only return the ingredients separated by "||" and if there are no ingredients, return words separated by "||". If the example text is "Artificial color (including F.D.&C. Yellow No.5, FD&C Red No.3), Contains 2% Or Less Of Vegetable Oil (Hydrogenated Coconut, Soybean And/or Cottonseed), rojo 40, amarillo 6, vitamina D, rouge 3, jaune 5", Return example is "Artificial color||Yellow No.5||Red No.3||Vegetable Oil||Hydrogenated Coconut||Soybean||Cottonseed||Red 40||Yellow 6||vitamin D||red 3||yellow 5".\nThe text is: ${ingredientsText}`;
  const result = await model.generateContent([prompt]);
  // console.log('correctSpellingIngredients:', result.response.candidates[0].content.parts[0].text)
  const resultText = result.response.candidates[0].content.parts[0].text;
  const correctedWords = resultText.split('||').map(word => word.trim());
  if (resultText.toLowerCase().includes('yellow no.5') || resultText.toLowerCase().includes('yellow no. 5')) correctedWords.push('yellow 5');
  if (resultText.toLowerCase().includes('red no.3') || resultText.toLowerCase().includes('red no. 3')) correctedWords.push('red 3');
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
    .limit(20);
  
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
    to: process.env.TESTER_EMAIL,
    from: process.env.MANAGER_EMAIL,
    subject: 'Sendgrid Test',
    html: 'This is <b>Test</b>',
  };

  console.log('msg:', JSON.stringify(msg, null, 2));

  try {
      await sgMail.send(msg);
      res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Error sending email', error });
  }
};

exports.replyEmailTest = async (req, res) => {
  const msg = {
    to: process.env.MANAGER_EMAIL,
    from: process.env.MANAGER_EMAIL,
    replyTo: process.env.TESTER_EMAIL,
    subject: 'Sendgrid Test',
    html: 'This is <b>Test</b> feedback',
  };

  console.log('msg:', JSON.stringify(msg, null, 2));

  try {
      await sgMail.send(msg);
      res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Error sending email', error });
  }
};

exports.gptTest = async (req, res) => {
  const params = {
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hi' }],
  };

  try {
    const completion = await gptClient.chat.completions.create(params);
    const result = completion.choices[0]?.message?.content;
    console.log('gpt result:', result);
    res.json({ success: true, message: result });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error gpt api', error });
  }
};

exports.uploadProfile = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    await User.findByIdAndUpdate(req.user._id, { ...req.body[0] });
    const user = await User.findById(req.user._id);
    const userInfo = {
	    _id: user._id,
      fullname: user.fullname,
      email: user.email,
      gender: user.gender,
      birth: user.birth,
      phone_num: user.phone_num,
      bio: user.bio,
      avatar: user.avatar ? user.avatar : '',
      following: user.following,
      switchObj: user.isshow,
    };
  
    res.json({ success: true, user: userInfo, message: 'Upload Profile successfully!' });
  }
};

exports.saveFeedback = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    console.log('feedback data:', req.body[0])
    const feedback = await Feedback({
      ...req.body[0],
      userid: req.user._id,
    });
    await feedback.save();
  
    res.json({ success: true, message: 'Share feedback successfully!' });
  }
};

exports.getUsers = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const users = await User.find({ email: { $ne: 'admin@gmail.com' }, status: 1}).select({ "fullname": 1, "avatar": 1, 'following': 1, 'bio': 1});
  
    res.json({ success: true, users });
  }
};

exports.followRequest = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    
    const { id, status } = req.body;
    const user = await User.findById(req.user._id);
    const targetUser = await User.findById(id);
    try {
      if (!user.following.includes(targetUser._id) && status < 1) {
        user.following.push(targetUser._id);
        if (!targetUser.followers.includes(user._id)) {
          targetUser.followers.push(user._id);
        }
        await User.findByIdAndUpdate(req.user._id, {
          following: user.following,
        });
        await User.findByIdAndUpdate(targetUser._id, {
          followers: targetUser.followers,
        });
      }
      if (user.following.includes(targetUser._id) && status > 0) {
        let index = user.following.indexOf(targetUser._id);
        if (index > -1) {
          user.following.splice(index, 1);
        }
        if (targetUser.followers.includes(user._id)) {
          index = targetUser.followers.indexOf(user._id);
          if (index > -1) {
            targetUser.followers.splice(index, 1);
          }
        }
        await User.findByIdAndUpdate(req.user._id, {
          following: user.following,
        });
        await User.findByIdAndUpdate(targetUser._id, {
          followers: targetUser.followers,
        });
      }

      const userInfo = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender,
        birth: user.birth,
        phone_num: user.phone_num,
        bio: user.bio,
        avatar: user.avatar ? user.avatar : '',
        following: user.following,
        switchObj: user.isshow,
      };

      res.json({ success: true, user: userInfo });
    } catch (err) {
      console.error(err);
      const userInfo = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        gender: user.gender,
        birth: user.birth,
        phone_num: user.phone_num,
        bio: user.bio,
        avatar: user.avatar ? user.avatar : '',
        following: user.following,
        switchObj: user.isshow,
      };
      res.json({ success: true, user: userInfo });
    }
  }
};

exports.getFriendList = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const user = await User.findById(req.user._id);
    const friends = await User.find({_id: { "$in": user.following }}).select({ "fullname": 1, "avatar": 1, 'bio': 1});
  
    res.json({ success: true, friends });
  }
};

exports.saveRecipe = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const { recipeId } = req.body;
    await RecipeList.findByIdAndUpdate(recipeId, { status: 1 });
    res.json({ success: true, message: 'Save recipe successfully!' });
  }
};

exports.getRecipeList = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const recipes = await RecipeList.find({userid: req.user._id, status: 1}).select({ "title": 1, "img": 1, "text": 1, "servings": 1, "cookTime": 1}).sort({_id: -1 });
  
    res.json({ success: true, recipes });
  }
};

exports.delRecipe = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const { recipeId } = req.body;
    if(recipeId){
      await RecipeList.deleteOne({_id: recipeId});
    }
    const recipes = await RecipeList.find({userid: req.user._id, status: 1}).select({ "title": 1, "img": 1, "text": 1, "servings": 1, "cookTime": 1}).sort({_id: -1 });
    res.json({ success: true, message: 'Remove recipe successfully!', recipes });
  }
};

exports.updateRecipe = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const recipeId = req.body[0]._id;
    await RecipeList.findByIdAndUpdate(recipeId, { ...req.body[0] });
    const recipes = await RecipeList.find({userid: req.user._id, status: 1}).select({ "title": 1, "img": 1, "text": 1, "servings": 1, "cookTime": 1}).sort({_id: -1 });
  
    res.json({ success: true, recipes, message: 'Update Recipe successfully!' });
  }
};

exports.getMyPostList = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
    return res
        .status(200)
        .json({ success: true, myposts: message_board });
    // res.json({ success: true, myposts: message_board });
  }
};

exports.getPostList = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const message_board = await MessageBoard.find({ status: 1 })
    .populate('userid', 'fullname avatar bio')
    .sort({_id: -1 });
    res.json({ success: true, posts: message_board });
  }
};

exports.updateLike = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const {id, status} = req.body[0];
    const like_result = await MessageBoard.findOne({ $and: [{ '_id': id }, { status: 1 }, { 'like': req.user._id }] }).select({"like": 1});
    if(status < 1){
      if(like_result){
        const post = await MessageBoard.findByIdAndUpdate(id, {$pull: {like: req.user._id}}, {new : true});
        res.json({ success: true, post, message: 'Removed this recommend.' });
      }else{
        const post = await MessageBoard.findByIdAndUpdate(id, {$addToSet:{ like: req.user._id }}, {safe: true, upsert: true, new : true});
        res.json({ success: true, post, message: 'Recommended this post.' });
      }
    }else{
      if(like_result){
        res.json({ success: true, post: {}, message: 'Already recommended this post.' });
      }else{
        res.json({ success: true, post: {}, message: 'Already recommended this post.' });
      }
    }
  }
};

exports.saveSwitch = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    await User.findByIdAndUpdate(req.user._id, { isshow: {...req.body[0]} });
    const user = await User.findById(req.user._id);
    const switchObj = user.isshow;
  
    res.json({ success: true, switchObj, message: 'Upload switch successfully!' });
  }
};

exports.getUserPostList = async (req, res) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: token });
    }
    const { id } = req.body;
    console.log(id);
    const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': id }] });
    res.json({ success: true, userposts: message_board });
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