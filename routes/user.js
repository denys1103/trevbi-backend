var express = require('express');
const multer = require('multer');
const User = require('../models/user');
//gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
var router = express.Router();

const {
  createUser,
  userSignIn,
  forgotPassword,
  getIngredientsToAvoid,
  getAvoidData,
  getAvoidListData,
  getAskAi,
  getBarcodeAi,
  getCorrectWords,
  geminiTest,
  sendEmailTest,
  replyEmailTest,
  gptTest,
  uploadProfile,
  saveFeedback,
  getUsers,
  signOut,
} = require('../controllers/user');
const { isAuth } = require('../middlewares/auth');
const {
  validateUserSignUp,
  userVlidation,
  validateUserSignIn,
} = require('../middlewares/validation/user');

router.post('/create-user', validateUserSignUp, userVlidation, createUser);
router.post('/sign-in', validateUserSignIn, userVlidation, userSignIn);
router.post('/forgot-password', validateUserSignIn, userVlidation, forgotPassword);
router.get('/getIngredientsToAvoid', getIngredientsToAvoid);
router.post('/getAvoidData', getAvoidData);
router.post('/getAvoidListData', getAvoidListData);
router.post('/getAskAi', getAskAi);
router.post('/getBarcodeAi', getBarcodeAi);
router.post('/getCorrectWords', getCorrectWords);
router.get('/geminiTest', geminiTest);
router.get('/sendEmailTest', sendEmailTest);
router.get('/replyEmailTest', replyEmailTest);
router.get('/gptTest', gptTest);
router.post('/save-profile', isAuth, uploadProfile);
router.post('/save-feedback', isAuth, saveFeedback);
router.post('/get-users', isAuth, getUsers);
router.post('/sign-out', isAuth, signOut);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post('/getIngredientsForRecipe', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    const imageBuffer = req.file.buffer;

    const prompt = `Given this food image. Generate a list of ingredients(with simple description, must not add alcohol), and return only result`;
    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = result.response.candidates[0].content.parts[0].text;
    res.json({ success: true, results:response });

  } catch (error) {
    console.log('Error processing get ingredients for recipe:', error);
    res.json({ success: false, results:'' });
  }
});

router.post('/makeRecipe', upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}, diets: ${req.body.diets}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    const imageBuffer = req.file.buffer;
    const diets = req.body.diets;
    const ingredients = req.body.ingredients;

    const prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe and a list of ingredients. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = result.response.candidates[0].content.parts[0].text;
    res.json({ success: true, results:response });

  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:'' });
  }
});

router.post('/makeMealRecipe', upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}, diets: ${req.body.diets}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    const imageBuffer = req.file.buffer;
    const diets = req.body.diets;
    const ingredients = req.body.ingredients;
    const meal = req.body.meal;
    let prompt = '';
    if(meal){
      if(meal=='bake'){
        prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe and a list of ingredients. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe and a list of ingredients. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }
    }else{
      prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe and a list of ingredients. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
    }

    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = result.response.candidates[0].content.parts[0].text;
    res.json({ success: true, results:response });

  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:'' });
  }
});

router.post('/recipe', upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}, diets: ${req.body.diets}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    const imageBuffer = req.file.buffer;
    const diets = req.body.diets;

    const prompt = `Given this food image and dietary: ${diets}. Generate a recipe and a list of ingredients. Start with \"AI-generated recipe image coming soon! In the meantime, here’s a recipe based on the ingredients detected in your photo\"`;
    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = result.response.candidates[0].content.parts[0].text;
    res.json({ success: true, results:response });

  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:'' });
  }
});

const imgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.originalname.split('.').pop())
  }
})
const img_upload = multer({ storage: imgStorage });
router.post("/upload-avata", isAuth, img_upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.json({ success: false, message: 'Upload Photo File failed!' });
  }
  const image_name = req.file.filename;
  if(image_name)
    await User.findByIdAndUpdate(req.user._id, { 'avatar': image_name});
  const user = await User.findById(req.user._id);
  const userInfo = {
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    gender: user.gender,
    birth: user.birth,
    phone_num: user.phone_num,
    avatar: user.avatar ? user.avatar : '',
  };

  res.json({ success: true, user: userInfo, message: 'Upload Profile successfully!' });
});

module.exports = router;
