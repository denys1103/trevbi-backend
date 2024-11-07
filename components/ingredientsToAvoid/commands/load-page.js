async function loadPage(req, res) {
    res.render('pages/ingredientsToAvoid', { session: req.session });
  }
  
module.exports = loadPage;
  