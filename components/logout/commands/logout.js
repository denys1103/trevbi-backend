const jwt = require('jsonwebtoken');
const admin = require('../../../models/user');
async function logout(req, res) {
  const adminInfo = req.session.adminInfo;
  const token = adminInfo?.token;
  req.session.adminInfo = {};
  console.log('token', token);
  if(token){
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await admin.findById(decode.adminId);
    if (!user) {
      res.json({ success: true, message: 'Sign out successfully!' });
    }
  
    req.user = user;
    const tokens = req.user.tokens;
    const newTokens = tokens.filter(t => t.token !== token);
    await admin.findByIdAndUpdate(req.user._id, { tokens: newTokens });
    res.json({ success: true, message: 'Sign out successfully!' });
  }else{
    res.json({ success: true, message: 'Sign out successfully!' });
  }
  
}

module.exports = {
  logout,
};
