const { wrap } = require('async-middleware');

const { isAuth } = require('../../middlewares/admin-auth');
const loadPage = require('./commands/load-page');
const ingredientsToAvoid = require('../../models/ingredientsToAvoid');
const multer = require('multer');
const XLSX = require('xlsx');
// const excelStorage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, 'uploads/excel/')
//     },
//     filename: function (req, file, cb) {
//       cb(null, Date.now() + '.' + file.originalname.split('.').pop())
//     }
//   })
// const excel_upload = multer({ storage: excelStorage });
const excel_upload = multer({ dest: 'uploads/excel/' });

module.exports = router => {
  router.get('/uploadExcel', isAuth, wrap(loadPage));
  router.post('/uploadExcel', excel_upload.single('file'), async (req, res) => {
    try {
        // Read the uploaded Excel file
        const workbook = XLSX.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        let data = XLSX.utils.sheet_to_json(sheet);

        data = data.map(item => ({
            name: item.name ? item.name.trim() : '',
            description: item.description ? item.description.trim() : '',
            source: item.source ? item.source.trim() : '',
        })).filter(item => item.name && item.description);

        const existingNames = await ingredientsToAvoid.find({ name: { $in: data.map(item => item.name) } }, 'name');
        const existingNameSet = new Set(existingNames.map(doc => doc.name));

        const documents = data.filter(item => !existingNameSet.has(item.name));

        if (documents.length > 0) {
            await ingredientsToAvoid.insertMany(documents);
        }

        res.render('pages/uploadExcel', { data: documents, uploadState:true, session: req.session });
    } catch (error) {
        console.log('upload excel error:', error);
        res.render('pages/uploadExcel', { data: [], uploadState:true, session: req.session });
    }
});

  return router;
};
