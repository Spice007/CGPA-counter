const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cgpa_calculator');
    const users = await User.find({}, 'email lastLogin createdAt').sort({ lastLogin: -1 });
    console.log(users);
    mongoose.connection.close();
}
test();
