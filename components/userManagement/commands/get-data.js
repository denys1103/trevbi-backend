const jwt = require('jsonwebtoken');
const User = require('../../../models/user');
const HistoryActiveUser = require('../../../models/historyActiveUser');

exports.getUserData = async (req, res, next) => {
  const users = await User.find({}).sort({_id: -1 });
  res.json({ success: true, data: JSON.stringify(users) });
};

exports.activeUser = async (req, res, next) => {
  const {id, status} = req.body;
  await User.findByIdAndUpdate({_id:id}, { status: status });
  res.json({ success: true });
};

exports.delUser = async (req, res, next) => {
  const {id} = req.body;
  await User.deleteOne({_id: id});
  res.json({ success: true });
};

exports.getOneUser = async (req, res, next) => {
  const {id} = req.body;
  const user = await User.findOne({_id:id});
  res.json({ success: true, data: JSON.stringify(user) });
};

exports.updateUser = async (req, res, next) => {
  const {id, status, role} = req.body;
  await User.findByIdAndUpdate({_id:id}, { status: status, role:role });
  if(status>0){
    const this_user = await User.findOne({_id:id});
    if(this_user){
      const user = await HistoryActiveUser.findOne({ email:this_user.email, status });
      if(!user){
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        const activeUser = await HistoryActiveUser({
          fullname:this_user.fullname,
          email:this_user.email,
          status,
          date:formattedDate,
        });
        await activeUser.save();
      }
    }
  }
  res.json({ success: true });
};

exports.getDashboardData = async (req, res, next) => {
  const users = await User.find({}).sort({_id: -1 });

  res.json({ success: true, users: JSON.stringify(users) });
};
