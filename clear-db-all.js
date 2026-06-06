const mongoose = require('mongoose');

async function cleanAll() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/cgpa_calculator');
        console.log('Connected to MongoDB');
        
        const collections = ['users', 'courses', 'results'];
        for (const col of collections) {
            try {
                const count = await mongoose.connection.db.collection(col).deleteMany({});
                console.log(`Cleared collection: ${col} (Deleted ${count.deletedCount} documents)`);
            } catch (colErr) {
                console.warn(`Failed to clear collection ${col}:`, colErr.message);
            }
        }
        console.log('✅ Cleaned all student, course, and result data from database successfully!');
    } catch (err) {
        console.error('❌ Error during database cleanup:', err.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

cleanAll();
