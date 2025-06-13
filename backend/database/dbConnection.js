import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Debug the MONGO_URI
console.log('MONGO_URI:', process.env.DB_URL);

const dbConnection = async () => {
  if (!process.env.DB_URL) {
    throw new Error('MONGO_URI is not defined in the environment variables.');
  }

  try {
    await mongoose.connect(process.env.DB_URL, {
      dbName: 'Job_Portal',
    });
    console.log('MongoDB Connected Successfully!');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

export default dbConnection;