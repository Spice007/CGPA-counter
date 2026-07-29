const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://SPICE007:gids2258@cluster0.38jtmep.mongodb.net/cgpa_calculator?appName=Cluster0';

async function cleanAll() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('✅ Connected!');
        
        const collections = ['users', 'courses', 'results'];
        for (const col of collections) {
            try {
                const count = await mongoose.connection.db.collection(col).deleteMany({});
                console.log(`Cleared production collection: ${col} (Deleted ${count.deletedCount} documents)`);
            } catch (colErr) {
                console.warn(`Failed to clear production collection ${col}:`, colErr.message);
            }
        }
        console.log('✅ Cleaned all production student, course, and result data from Atlas successfully!');
    } catch (err) {
        console.error('❌ Error during Atlas database cleanup:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

cleanAll();
