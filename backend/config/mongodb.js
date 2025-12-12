const mongoose = require('mongoose');

let isConnected = false;

async function connectMongoDB() {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

function getMongoConnection() {
  if (!isConnected) {
    throw new Error('MongoDB not connected');
  }
  return mongoose.connection;
}

module.exports = { connectMongoDB, getMongoConnection };
