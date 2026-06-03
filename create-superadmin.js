const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect directly to Atlas
const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

const adminSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'superadmin' }
}, { timestamps: true });

adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Admin = mongoose.model('Admin', adminSchema);

async function createSuperAdmin() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected!');

        // Remove any old admin with same username or email
        await Admin.deleteMany({ $or: [{ username: 'superadmin' }, { email: 'gideonlastgids@gmail.com' }] });
        console.log('Cleared old admin entries...');

        const admin = new Admin({
            username: 'superadmin',
            email: 'gideonlastgids@gmail.com',
            password: 'Gideon@2025',
            role: 'superadmin'
        });

        await admin.save();

        console.log('\n🎉 Super Admin created successfully on MongoDB Atlas!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Username : superadmin');
        console.log('  Email    : gideonlastgids@gmail.com');
        console.log('  Password : Gideon@2025');
        console.log('  Role     : superadmin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createSuperAdmin();
