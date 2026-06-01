const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Admin = require('./models/Admin');

async function debug() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cgpa_calculator';
    await mongoose.connect(uri);
    console.log('Connected...');

    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
        console.log('❌ No admin found in DB!');
        return mongoose.connection.close();
    }

    console.log('✅ Admin found:', admin.username);
    const match = await bcrypt.compare('password123', admin.password);
    console.log('🔑 Password match:', match);

    await mongoose.connection.close();
}
debug().catch(console.error);
