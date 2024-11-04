const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Our mongodb is connected');
  })
  .catch(err => console.log(err.message));
