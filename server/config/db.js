const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cgpa_calculator';
    // Log masked URI for debugging
    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`Attempting to connect to MongoDB: ${maskedUri}`);
    
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection error: ${error.message}`);
        console.error('Retrying in 5 seconds...');
        setTimeout(() => connectDB(), 5000);
    }
};

module.exports = connectDB;
