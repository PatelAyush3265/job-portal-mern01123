import express from 'express';
import dbConnection from './database/dbConnection.js';
import jobRouter from './routes/jobRoutes.js';
import userRouter from './routes/userRoutes.js';
import applicationRouter from './routes/applicationRoutes.js';
import { config } from 'dotenv';
import cors from 'cors';
import { errorMiddleware } from './middlewares/error.js';
import cookieParser from 'cookie-parser';
// import { GoogleGenerativeAI } from '@google/generative-ai'; // Keep this import if needed elsewhere

const app = express();
config({ path: './config/config.env' });

// Initialize Google AI // Remove or comment out this line
// const genAI = new GoogleGenerativeAI('AIzaSyBQG2Z2y9fTIqqn69NH21K43-12u0_3vqA');

// Middleware
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    method: ['GET', 'POST', 'DELETE', 'PUT'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/job', jobRouter);
app.use('/api/v1/application', applicationRouter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB
if (typeof dbConnection !== 'function') {
  console.error('Error: dbConnection is not a function. Check ./database/dbConnection.js');
  process.exit(1);
}

dbConnection().catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Error middleware
app.use(errorMiddleware);

export default app;