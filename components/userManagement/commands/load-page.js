async function loadPage(req, res) {
    res.render('pages/userManagement', { session: req.session });
  }
  
module.exports = loadPage;
  