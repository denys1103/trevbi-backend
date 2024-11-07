const User = require('../../../models/user');
const HistoryActiveUser = require('../../../models/historyActiveUser');

async function createUser(req, res) {
  const { name, email, password } = req.body;
  const isNewUser = await User.isThisEmailInUse(email);
  const userInfo = req.body;

  let msg = {}; 
  if (!isNewUser){
    msg = {result: 'This email is already in use, try sign-in'};
    const messages = {
      errors: msg,
    };
    return res.status(200).render('pages/register', { messages, userInfo });
  }
  let status = 0;
  if(email == 'admin@gmail.com')
    status = 1;
  const user = await User({
    fullname: name,
    email,
    status:status,
    role:1,
    password,
  });
  await user.save();

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  const activeUser = await HistoryActiveUser({
    fullname: name,
    email,
    date:formattedDate,
  });
  await activeUser.save();

  const messages = {
    success: 'You have successfully registered.',
  };

  return res.status(200).render('pages/login', { messages });
}

module.exports = createUser;
