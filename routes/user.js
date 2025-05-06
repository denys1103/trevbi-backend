var express = require('express');
const multer = require('multer');
const User = require('../models/user');
const RecipeList = require('../models/recipeList');
const MessageBoard = require('../models/messageBoard');
var path = require('path');
const fs = require('fs')
//gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//gemini-2.0
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY_v2 });
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
  followRequest,
  getFriendList,
  saveRecipe,
  getRecipeList,
  delRecipe,
  updateRecipe,
  getMyPostList,
  getPostList,
  signOut,
} = require('../controllers/user');
const { isAuth } = require('../middlewares/auth');
const {
  validateUserSignUp,
  userVlidation,
  validateUserSignIn,
  validateGoogleSignIn,
} = require('../middlewares/validation/user');

router.post('/create-user', validateUserSignUp, userVlidation, createUser);
router.post('/sign-in', validateUserSignIn, userVlidation, userSignIn);
router.post('/forgot-password', validateGoogleSignIn, userVlidation, forgotPassword);
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
router.post('/follow-request', isAuth, followRequest);
router.post('/get-friends', isAuth, getFriendList);
router.post('/save-recipe', isAuth, saveRecipe);
router.post('/get-recipes', isAuth, getRecipeList);
router.post('/del-recipe', isAuth, delRecipe);
router.post('/update-recipe', isAuth, updateRecipe);
router.post('/get-myposts', isAuth, getMyPostList);
router.post('/get-posts', isAuth, getPostList);
router.post('/sign-out', isAuth, signOut);

// Make sure uploads/images exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'recipeImgs',);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadPostDir = path.join(__dirname, '..', 'uploads', 'postImgs',);
if (!fs.existsSync(uploadPostDir)) {
  fs.mkdirSync(uploadPostDir, { recursive: true });
}

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

router.post('/makeMealRecipeV2', upload.single('image'), async (req, res) => {
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
        prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }
    }else{
      prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
    }

    const contents = [
      { text: prompt },
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
    ];
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });
    let recipeText = '';
    let recipeImg = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        recipeText = part.text;
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const filename = `gen_${Date.now()}.png`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        recipeImg = filename;
      }
    }

    res.json({ success: true, results:{recipeText, recipeImg} });

  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:{recipeText: '', recipeImg: ''} });
  }
});

router.post('/makeMealRecipeV3', isAuth, upload.single('image'), async (req, res) => {
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
        prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }
    }else{
      prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe, cook information(yield, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
    }

    const contents = [
      { text: prompt },
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
    ];
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });
    let recipeText = '';
    let recipeImg = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        recipeText = part.text;
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const filename = `gen_${Date.now()}.png`;
        const filepath = path.join(uploadDir, filename);

        fs.writeFileSync(filepath, buffer);
        recipeImg = filename;
      }
    }
    const recipe = await RecipeList({
      userid: req.user._id,
      title: '',
      img: recipeImg,
      text: recipeText,
    });
    await recipe.save();

    res.json({ success: true, results:{recipeText, recipeImg, recipeId: recipe._id} });

  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:{recipeText: '', recipeImg: ''} });
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
    bio: user.bio,
    avatar: user.avatar ? user.avatar : '',
    following: user.following,
  };

  res.json({ success: true, user: userInfo, message: 'Upload Profile successfully!' });
});

const recipeImgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/recipeImgs/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.originalname.split('.').pop())
  }
})
const recipe_img_upload = multer({ storage: recipeImgStorage });
router.post("/upload-recipeimg", isAuth, recipe_img_upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.json({ success: false, message: 'Upload Photo File failed!' });
  }
  const image_name = req.file.filename;

  res.json({ success: true, img: image_name, message: 'Upload photo file successfully!' });
});

const postImgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/postImgs/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.originalname.split('.').pop())
  }
})
const post_img_upload = multer({ storage: postImgStorage });
router.post("/upload-post", isAuth, post_img_upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.json({ success: false, message: 'Upload Photo File failed!' });
    }
    const image_name = req.file.filename;
  
    const title = req.body.title;
    const note = req.body.note;
    const id = req.body.id;
  
    if(id){
      await MessageBoard.findByIdAndUpdate(id, { title, note, photo: image_name });
      const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
      res.json({ success: true, myposts: message_board, message: 'Update successfully!' });
    }else{
      const MessageBoardData = await MessageBoard({
        userid: req.user._id,
        photo: image_name,
        title,
        note,
        status: 1,   
      });
      await MessageBoardData.save();
      const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
      res.json({ success: true, myposts: message_board, message: 'Post successfully!' });
    }
  } catch (error) {
    console.log('Error processing post:', error);
  }
});
router.post("/upload-txtpost", isAuth, async (req, res, next) => {
  const title = req.body[0].title;
  const note = req.body[0].note;
  const id = req.body[0].id;

  if(id){
    await MessageBoard.findByIdAndUpdate(id, { title, note });
    const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
    res.json({ success: true, myposts: message_board, message: 'Update successfully!' });
  }else{
    const MessageBoardData = await MessageBoard({
      userid: req.user._id,
      title,
      note,
      status: 1,   
    });
    await MessageBoardData.save();
    const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
    res.json({ success: true, myposts: message_board, message: 'Post successfully!' });
  }
});

module.exports = router;
