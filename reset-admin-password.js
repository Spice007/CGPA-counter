// Resets the superadmin password on MongoDB Atlas without double-hashing
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

async function resetAdmin() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
        console.log('✅ Connected!');

        const db = mongoose.connection.db;
        const admins = db.collection('admins');

        // Wipe any existing admin entries
        await admins.deleteMany({});
        console.log('Cleared old admin entries...');

        // Hash password ONCE manually — bypassing Mongoose pre-save hook
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Gideon@2025', salt);

        // Verify hash works before inserting
        const verified = await bcrypt.compare('Gideon@2025', hashedPassword);
        console.log('🔑 Password hash verified:', verified);

        await admins.insertOne({
            username: 'superadmin',
            email: 'gideonlastgids@gmail.com',
            password: hashedPassword,
            role: 'superadmin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('\n🎉 Superadmin successfully reset on MongoDB Atlas!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Username : superadmin');
        console.log('  Password : Gideon@2025');
        console.log('  Role     : superadmin');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

resetAdmin();
