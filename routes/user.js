var express = require('express');
const multer = require('multer');
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
router.post('/sign-out', isAuth, signOut);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post('/recipe', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.json({ recipeImage:null, ingredients:null, msg: 'No file uploaded'});
    }
    const imageBuffer = req.file.buffer;
    const diets = req.body.diets;

    const prompt = `Given this food image and dietary restrictions: ${diets}. Generate a recipe image and a list of ingredients.`;
    const image = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, image]);
    const response = result.response;
    console.log('gemini response:', JSON.stringify(response, null, 2))
    console.log('gemini response:', JSON.stringify(response.candidates[0].content.parts[0].text, null, 2))
    // const text = response.text();

    let recipeImage = null;
    let ingredients = null;

    // try{
    //     const parsedResponse = JSON.parse(text);
    //     recipeImage = parsedResponse.recipeImage;
    //     ingredients = parsedResponse.ingredients;
    // } catch(e){
    //     const imageStart = text.indexOf("data:image/");
    //     if (imageStart !== -1) {
    //         const imageEnd = text.indexOf(")", imageStart);
    //         if(imageEnd !== -1){
    //             recipeImage = text.substring(imageStart, imageEnd+1);
    //         }
    //     }
    //     const ingredientsStart = text.indexOf("Ingredients:");
    //     if (ingredientsStart !== -1) {
    //         ingredients = text.substring(ingredientsStart + "Ingredients:".length).trim();
    //     }
    // }
    // if (!recipeImage || !ingredients) {
    //     return res.status(500).json({ error: 'Failed to extract recipe image and ingredients from Gemini response.' });
    // }

    res.json({ recipeImage, ingredients });

  } catch (error) {
    console.error('Error processing recipe:', error);
    res.status(500).json({ error: 'Failed to process recipe.' });
  }
});

module.exports = router;
