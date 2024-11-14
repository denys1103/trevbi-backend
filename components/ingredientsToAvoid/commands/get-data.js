const IngredientsToAvoid = require('../../../models/ingredientsToAvoid');

exports.getIngredientsToAvoid = async (req, res, next) => {
  const result = await IngredientsToAvoid.find({});
  res.json({ success: true, data: JSON.stringify(result) });
};

exports.registerIngredient = async (req, res, next) => {
  const {ingredient_name, description, edit_id} = req.body;
  // console.log('req.body:', JSON.stringify(req.body, null, 2))
  try {
    if (ingredient_name.trim() && description.trim()) {
      const isExist = await IngredientsToAvoid.findOne({ name: ingredient_name.trim() });
      if (isExist && edit_id!='') {
        if(isExist._id == edit_id){
          await IngredientsToAvoid.findByIdAndUpdate({_id:edit_id}, { description: description.trim() });
        }
      } else if (!isExist && edit_id!='') {
        await IngredientsToAvoid.findByIdAndUpdate({_id:edit_id}, { name: ingredient_name.trim(), description: description.trim() });
      } else if (!isExist && edit_id=='') {
        const ingredientData = await IngredientsToAvoid({
          name: ingredient_name.trim(),
          description: description.trim(),
        });
        await ingredientData.save();
      }
    }
  } catch (error) {
    console.log('edit ingredient error:', error);
  } finally {
    return res.status(200).redirect('/admin/ingredientsToAvoid');
  }
};

exports.getEditIngredient = async (req, res, next) => {
  const {id} = req.body;
  const ingredientData = await IngredientsToAvoid.findOne({_id:id});
  res.json({ success: true, data: JSON.stringify(ingredientData) });
};

exports.delIngredient = async (req, res, next) => {
  const {id} = req.body;
  await IngredientsToAvoid.deleteOne({_id: id});
  res.json({ success: true });
};
