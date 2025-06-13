import express from 'express';
import { scoreResume } from '../controllers/resumeScoreController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

// Route to score resume
router.post('/score/:jobId/:applicationId', isAuthenticated, scoreResume);

export default router; 