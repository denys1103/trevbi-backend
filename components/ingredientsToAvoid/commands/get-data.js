const IngredientsToAvoid = require('../../../models/ingredientsToAvoid');

exports.getIngredientsToAvoid = async (req, res, next) => {
  const result = await IngredientsToAvoid.find({});
  res.json({ success: true, data: JSON.stringify(result) });
};
