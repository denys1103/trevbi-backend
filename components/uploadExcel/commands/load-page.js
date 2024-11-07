async function loadPage(req, res) {
    res.render('pages/uploadExcel', { data: [], uploadState:false, session: req.session });
  }
  
module.exports = loadPage;
  