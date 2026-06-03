const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

const userSchema = mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    matricNumber: String,
    department: String,
    faculty: String,
    university: String,
    academicSession: String,
    profilePicture: String,
    lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected!');

        // Check if admin user account already exists
        let existing = await User.findOne({ email: 'gideonlastgids@gmail.com' });
        if (existing) {
            console.log('✅ Admin user account already exists in Users collection:');
            console.log('   Name   :', existing.fullName);
            console.log('   Email  :', existing.email);
            console.log('   ID     :', existing._id);
        } else {
            const user = new User({
                fullName: 'Gideon (Super Admin)',
                email: 'gideonlastgids@gmail.com',
                password: 'Gideon@2025',
                department: 'Administration',
                university: 'SpiceCGPA HQ'
            });
            await user.save();
            console.log('\n🎉 Admin user account created in Users collection!');
            console.log('  Email    : gideonlastgids@gmail.com');
            console.log('  Password : Gideon@2025');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

run();
