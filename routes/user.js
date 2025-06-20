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
  saveRecipeV2,
  getRecipeList,
  getUserRecipeList,
  delRecipe,
  updateRecipe,
  getMyPostList,
  getPostList,
  updateLike,
  saveSwitch,
  getUserPostList,
  getUserCrewList,
  getUserMemberList,
  getUserData,
  addComment,
  deleteComment,
  updateComment,
  updateCommentLike,
  deletePost,
  cookbookRequest,
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
router.post('/save-recipeV2', isAuth, saveRecipeV2);
router.post('/get-recipes', isAuth, getRecipeList);
router.post('/get-userrecipes', isAuth, getUserRecipeList);
router.post('/del-recipe', isAuth, delRecipe);
router.post('/update-recipe', isAuth, updateRecipe);
router.post('/get-myposts', isAuth, getMyPostList);
router.post('/get-posts', isAuth, getPostList);
router.post('/update-like', isAuth, updateLike);
router.post('/save-switch', isAuth, saveSwitch);
router.post('/get-userposts', isAuth, getUserPostList);
router.post('/get-usercrews', isAuth, getUserCrewList);
router.post('/get-usermembers', isAuth, getUserMemberList);
router.post('/get-userdata', isAuth, getUserData);
router.post('/add-comment', isAuth, addComment);
router.post('/del-comment', isAuth, deleteComment);
router.post('/update-comment', isAuth, updateComment);
router.post('/update-commentlike', isAuth, updateCommentLike);
router.post('/cookbook-request', isAuth, cookbookRequest);
router.post('/del-post', isAuth, deletePost);
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

const uploadImagesDir = path.join(__dirname, '..', 'uploads', 'images',);
if (!fs.existsSync(uploadImagesDir)) {
  fs.mkdirSync(uploadImagesDir, { recursive: true });
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
        prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }
    }else{
      prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe, cook information(servings, prep time, cook time, calories, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
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
        prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
      }
    }else{
      prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), a list of ingredients, and one recipe results image. Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
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

const recipeImgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.originalname.split('.').pop())
  }
})
const recipe_img_upload = multer({ storage: recipeImgStorage });

router.post('/makeMealRecipeV4', isAuth, recipe_img_upload.single('image'), async (req, res) => {
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
    fs.readFile(req.file.path, async (err, data) => {
      if (err) {
        console.error('File read error:', err);
        return res.status(500).json({ success: false, error: 'File read error' });
      }
      const imageBuffer = data;
      let recipeImg = req.file.filename;
      const diets = req.body.diets;
      const ingredients = req.body.ingredients;
      const meal = req.body.meal;
      const useAI = req.body.useAI;
      let prompt = '';
      if(meal){
        if(meal=='bake'){
          prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
        }else{
          prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
        }
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
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
          responseModalities: useAI > 0 ? ["Text", "Image"] : ["Text"],
        },
      });
      let recipeText = '';
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
    });
  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:{recipeText: '', recipeImg: ''} });
  }
});

router.post('/makeMealRecipeV5', isAuth, recipe_img_upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    fs.readFile(req.file.path, async (err, data) => {
      if (err) {
        console.error('File read error:', err);
        return res.status(500).json({ success: false, error: 'File read error' });
      }
      const imageBuffer = data;
      let recipeImg = req.file.filename;
      const diets = req.body.diets;
      const ingredients = req.body.ingredients;
      const meal = req.body.meal;
      const useAI = req.body.useAI;
      const servings = req.body.servings;
      let prompt = '';
      if(meal){
        if(meal=='bake'){
          prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
        }else{
          prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
        }
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with \"Here’s a recipe based on the ingredients detected in your photo.\n\n\"`;
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
          responseModalities: useAI > 0 ? ["Text", "Image"] : ["Text"],
        },
      });
      let recipeText = '';
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
        servings: servings,
      });
      await recipe.save();

      res.json({ success: true, results:{recipeText, recipeImg, recipeId: recipe._id} });
    });
  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:{recipeText: '', recipeImg: ''} });
  }
});

router.post('/makeMealRecipeV6', isAuth, recipe_img_upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    fs.readFile(req.file.path, async (err, data) => {
      if (err) {
        console.error('File read error:', err);
        return res.status(500).json({ success: false, error: 'File read error' });
      }
      const imageBuffer = data;
      let recipeImg = req.file.filename;
      const diets = req.body.diets;
      const ingredients = req.body.ingredients;
      const meal = req.body.meal;
      const useAI = req.body.useAI;
      const servings = req.body.servings;
      let prompt = '';
      if(meal){
        if(meal=='bake'){
          prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
        }else{
          prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
        }
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
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
          responseModalities: useAI > 0 ? ["Text", "Image"] : ["Text"],
        },
      });
      let recipeText = '';
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
        text: 'Here’s a recipe based on the ingredients detected in your photo.\n\n' + recipeText,
        servings: servings,
      });
      await recipe.save();

      res.json({ success: true, results:{recipeText, recipeImg, recipeId: recipe._id} });
    });
  } catch (error) {
    console.log('Error processing recipe:', error);
    res.json({ success: false, results:{recipeText: '', recipeImg: ''} });
  }
});

router.post('/makeMealRecipeV7', isAuth, recipe_img_upload.single('image'), async (req, res) => {
  try {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    console.log(`Date: ${day} - ${hour}:${minute}`);
    if (!req.file) {
      console.log('no file uploaded');
      res.json({ success: false, results:'' });
    }
    fs.readFile(req.file.path, async (err, data) => {
      if (err) {
        console.error('File read error:', err);
        return res.status(500).json({ success: false, error: 'File read error' });
      }
      const imageBuffer = data;
      let recipeImg = req.file.filename;
      const diets = req.body.diets;
      const ingredients = req.body.ingredients;
      const meal = req.body.meal;
      const useAI = req.body.useAI;
      const servings = req.body.servings;
      let prompt = '';
      if(meal){
        if(meal=='bake'){
          prompt = `Dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
        }else{
          prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. This is for ${meal}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
        }
      }else{
        prompt = `Given this food image and dietary: ${diets}. My Ingredients: ${ingredients}. Amount of servings: ${servings}. Generate a recipe, cook information(servings, prep time, cook time, calories, nutritional information, tips), ${useAI > 0 ? 'a list of ingredients, and one recipe results image.' : 'and a list of ingredients.'} Start with the recipe title and add ! to the end of the recipe title.`;
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
          responseModalities: useAI > 0 ? ["Text", "Image"] : ["Text"],
        },
      });
      let recipeText = '';
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

      const recipeAllText = recipeText;
      const recipeAllTextArr = recipeAllText
        .replace(/[*#]/g, '')
        .split('!');
      const getRecipeTitle = recipeAllTextArr[0] || '';
      const recipeContents = recipeAllTextArr.slice(1).join('!').replace(/^\n+/, '');

      const recipe = await RecipeList({
        userid: req.user._id,
        title: getRecipeTitle,
        img: recipeImg,
        text: recipeContents,
        servings: servings,
      });
      await recipe.save();

      res.json({ success: true, results:{recipeTitle: getRecipeTitle, recipeText: recipeContents, recipeImg, recipeId: recipe._id} });
    });
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
    cb(null, uploadImagesDir)
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
    cookBookName: user.cookBookName,
    avatar: user.avatar ? user.avatar : '',
    following: user.following,
    switchObj: user.isshow,
  };

  res.json({ success: true, user: userInfo, message: 'Upload Profile successfully!' });
});

router.post("/upload-recipeimg", isAuth, recipe_img_upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.json({ success: false, message: 'Upload Photo File failed!' });
  }
  const image_name = req.file.filename;

  res.json({ success: true, img: image_name, message: 'Upload photo file successfully!' });
});

const postImgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPostDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.' + file.originalname.split('.').pop())
  }
})
const post_img_upload = multer({ storage: postImgStorage });
const MAX_MEDIA = 10;
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
router.post("/upload-mediapost", isAuth, post_img_upload.array('media', MAX_MEDIA), async (req, res, next) => {
  try {
    const files = req.files;
    if (!files) {
      res.json({ success: false, message: 'Upload Media failed!' });
    }
    const mediaList = files.map(f => ({
      name: f.filename,
      mime: f.mimetype
    }));
    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      res.json({ success: false, message: 'Upload Media failed!' });
    }
  
    const title = req.body.title;
    const note = req.body.note;
    const id = req.body.id;
  
    if(id){
      await MessageBoard.findByIdAndUpdate(
        id,
        {
          $set: { title, note },
          $push: { media: { $each: mediaList } }
        }
      );
      const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
      res.json({ success: true, myposts: message_board, message: 'Update successfully!' });
    }else{
      const MessageBoardData = await MessageBoard({
        userid: req.user._id,
        media: mediaList,
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

router.post("/recipeToPost", isAuth, async (req, res, next) => {
  try {
    const { imageName, title, note } = req.body;

    if (!imageName) {
      return res.status(400).json({ success: false, message: 'Image name is required' });
    }

    const sourcePath = path.join(uploadDir, imageName);
    const destPath = path.join(uploadPostDir, imageName);

    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ success: false, message: 'Source image not found' });
    }

    const handlePost = async () => {
      const mediaList = [{
        name: imageName,
        mime: imageName.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg'
      }];

      const MessageBoardData = new MessageBoard({
        userid: req.user._id,
        media: mediaList,
        title,
        note,
        status: 1,
      });

      await MessageBoardData.save();
      const message_board = await MessageBoard.find({ $and: [{ 'status': 1 }, { 'userid': req.user._id }] });
      res.json({ success: true, myposts: message_board, message: 'Post successfully!' });
    };

    if (!fs.existsSync(destPath)) {
      fs.copyFile(sourcePath, destPath, async (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Failed to copy image', error: err.message });
        }
        await handlePost();
      });
    } else {
      await handlePost();
    }

  } catch (error) {
    console.error('Error processing post:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
