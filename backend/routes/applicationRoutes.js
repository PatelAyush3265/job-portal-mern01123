import express from 'express';
import {
  getEmployerApplications,
  getMyApplications,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsForJob,
} from '../controllers/applicationController.js';
import { isAuthenticated } from '../middlewares/auth.js';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { Application } from '../models/applicationSchema.js';
import { Job } from '../models/jobSchema.js';
import ErrorHandler from '../middlewares/error.js';
import { catchAsyncErrors } from '../middlewares/catchAsyncError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import pdf from 'pdf-parse';

const router = express.Router();
console.log("Initializing application routes. DELETE route for /delete/:id is set.");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Multer setup to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Define the scoreResume logic
const scoreResume = async (jobID, applicationID, next) => {
  try {
    const job = await Job.findById(jobID);
    const application = await Application.findById(applicationID);

    if (!job || !application) {
      throw new ErrorHandler('Job or Application not found', 404);
    }

    const skills = Array.isArray(job.skills) && job.skills.length > 0 ? job.skills : ['communication', 'teamwork', 'problem-solving'];
    const requiredSkills = skills.join(', ');
    const resumeURL = application.resume.url;

    const pdfBuffer = (await axios.get(resumeURL, { responseType: 'arraybuffer' })).data;
    const parsedPDF = await pdf(pdfBuffer);
    const resumeText = parsedPDF.text;

    if (!resumeText) {
      throw new ErrorHandler('Failed to extract text from resume.', 400);
    }

    const maxLength = 3000;
    const truncatedResumeText = resumeText.length > maxLength ? resumeText.substring(0, maxLength) : resumeText;

    const prompt = `
You are an expert ATS analyzer. Analyze the resume against the job requirements and provide a detailed score based on multiple criteria.

JOB REQUIREMENTS:
- Skills: ${requiredSkills}
- Preferred Experience: At least 2 years of relevant experience (if not specified, assume this as a baseline).
- Preferred Education: Bachelor's degree or higher, with a CGPA of 3.0 or above (if not specified, assume this as a baseline).

RESUME CONTENT:
${truncatedResumeText}

ANALYSIS INSTRUCTIONS:
1. Skills Analysis:
   - Check for each required skill, including variations and related terms (e.g., 'js' for 'javascript', 'reactjs' for 'react').
   - Evaluate expertise level for each skill based on years of experience, project complexity, or specific achievements.
2. Experience Analysis:
   - Identify the candidate's total years of relevant work experience.
   - Evaluate the relevance of their experience to the job requirements (e.g., specific projects, roles, or responsibilities).
3. Education Analysis:
   - Extract the candidate's highest degree and CGPA (if mentioned).
   - Assess if the degree is relevant to the job (e.g., Computer Science for a tech role).
   - Evaluate the CGPA: Consider a CGPA ≥ 3.0 as "good" (boosts the score), and < 3.0 as "average" (neutral or slight penalty).
4. Additional Factors:
   - Look for certifications, awards, or achievements that align with the job requirements.
   - Consider any other relevant details (e.g., leadership roles, publications).
5. Scoring:
   - Skills (40%): 90-100 for all skills with strong evidence, 70-89 for most skills with good evidence, 50-69 for some skills with moderate evidence, 30-49 for few skills with limited evidence, 0-29 for minimal or no skills.
   - Experience (30%): 90-100 for >5 years of relevant experience, 70-89 for 3-5 years, 50-69 for 1-2 years, 30-49 for <1 year, 0-29 for no relevant experience.
   - Education (20%): 90-100 for relevant degree with CGPA ≥ 3.5, 70-89 for relevant degree with CGPA 3.0-3.5, 50-69 for relevant degree with CGPA < 3.0, 30-49 for non-relevant degree or no CGPA, 0-29 for no degree.
   - Additional Factors (10%): 90-100 for multiple relevant certifications/achievements, 70-89 for some, 50-69 for minimal, 0-49 for none.
   - Combine the weighted scores for a final score out of 100.

RESPONSE FORMAT:
Score: [0-100]
Skills Analysis: [Detailed explanation of skill matches and expertise]
Experience Analysis: [Details of relevant experience, years, and relevance]
Education Analysis: [Degree, CGPA (if found), and relevance]
Additional Factors: [Certifications, awards, or other relevant details]
Matched Skills: [List of matched skills]
Missing Skills: [List of missing skills]
`;

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        throw new ErrorHandler('Empty response from AI.', 500);
      }

      const scoreMatch = text.match(/Score:\s*(\d+)/);
      let score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      const skillsAnalysisMatch = text.match(/Skills Analysis:\s*(.+?)(?=(Experience Analysis:|$))/s);
      const experienceAnalysisMatch = text.match(/Experience Analysis:\s*(.+?)(?=(Education Analysis:|$))/s);
      const educationAnalysisMatch = text.match(/Education Analysis:\s*(.+?)(?=(Additional Factors:|$))/s);
      const additionalFactorsMatch = text.match(/Additional Factors:\s*(.+?)(?=(Matched Skills:|$))/s);
      const matchedSkillsMatch = text.match(/Matched Skills:\s*(.+?)(?=(Missing Skills:|$))/s);
      const missingSkillsMatch = text.match(/Missing Skills:\s*(.+)/s);

      const skillsAnalysis = skillsAnalysisMatch ? skillsAnalysisMatch[1].trim() : 'No skills analysis provided.';
      const experienceAnalysis = experienceAnalysisMatch ? experienceAnalysisMatch[1].trim() : 'No experience analysis provided.';
      const educationAnalysis = educationAnalysisMatch ? educationAnalysisMatch[1].trim() : 'No education analysis provided.';
      const additionalFactors = additionalFactorsMatch ? additionalFactorsMatch[1].trim() : 'No additional factors provided.';
      let matchedSkills = matchedSkillsMatch ? matchedSkillsMatch[1].split(',').map(s => s.trim()) : [];
      let missingSkills = missingSkillsMatch ? missingSkillsMatch[1].split(',').map(s => s.trim()) : [];

      // Extract CGPA from education analysis for transparency
      const cgpaMatchInAnalysis = educationAnalysis.match(/CGPA\s*[:\-]?\s*(\d*\.?\d+)/i);
      const cgpaFromAI = cgpaMatchInAnalysis ? parseFloat(cgpaMatchInAnalysis[1]) : null;

      if (!score || score < 0 || score > 100 || matchedSkills.length === 0 && missingSkills.length === 0) {
        const skillsArray = skills.map(skill => skill.toLowerCase());
        const resumeLower = resumeText.toLowerCase();
        matchedSkills = skillsArray.filter(skill => resumeLower.includes(skill));
        missingSkills = skillsArray.filter(skill => !resumeLower.includes(skill));
        const matchedSkillsCount = matchedSkills.length;
        score = Math.round((matchedSkillsCount / skillsArray.length) * 100) || 1;
      }

      application.atsScore = score;
      application.status = 'Reviewed';
      await application.save();

      return {
        success: true,
        score,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        summary: {
          overall_score: score,
          skills_analysis: skillsAnalysis,
          experience_analysis: experienceAnalysis,
          education_analysis: educationAnalysis,
          additional_factors: additionalFactors,
          cgpa: cgpaFromAI || 'Not found',
        },
      };
    } catch (apiError) {
      console.error('Gemini API Error:', apiError.message);
      // Fallback scoring
      const skillsArray = skills.map(skill => skill.toLowerCase());
      const resumeLower = resumeText.toLowerCase();
      const matchedSkills = skillsArray.filter(skill => resumeLower.includes(skill));
      const missingSkills = skillsArray.filter(skill => !resumeLower.includes(skill));
      const matchedSkillsCount = matchedSkills.length;

      // Basic experience check
      let experienceScore = 0;
      const experienceMatch = resumeLower.match(/(\d+)\s*(?:year|yr)s?\s*(?:of\s*)?(?:experience|exp)/i);
      const yearsOfExperience = experienceMatch ? parseInt(experienceMatch[1]) : 0;
      if (yearsOfExperience >= 5) experienceScore = 90;
      else if (yearsOfExperience >= 3) experienceScore = 70;
      else if (yearsOfExperience >= 1) experienceScore = 50;
      else if (yearsOfExperience > 0) experienceScore = 30;

      // Basic CGPA check with score impact
      let educationScore = 0;
      let cgpa = null;
      const cgpaMatch = resumeLower.match(/cgpa\s*[:\-]?\s*(\d*\.?\d+)/i);
      const hasDegree = resumeLower.includes('bachelor') || resumeLower.includes('master') || resumeLower.includes('phd');
      if (cgpaMatch) {
        cgpa = parseFloat(cgpaMatch[1]);
        if (hasDegree && cgpa >= 3.5) educationScore = 90; // Good CGPA, boost score
        else if (hasDegree && cgpa >= 3.0) educationScore = 70; // Decent CGPA, moderate boost
        else if (hasDegree && cgpa > 0) educationScore = 50; // Low CGPA, neutral
        else educationScore = 30; // Degree but no CGPA or irrelevant
      } else {
        educationScore = hasDegree ? 30 : 0; // No CGPA, lower education score
      }

      // Weighted score
      const skillsScore = Math.round((matchedSkillsCount / skillsArray.length) * 100) || 1;
      const finalScore = Math.round((skillsScore * 0.4) + (experienceScore * 0.3) + (educationScore * 0.2) + (10 * 0.1)); // 10% for additional factors (basic)

      application.atsScore = finalScore;
      application.status = 'Reviewed';
      await application.save();

      return {
        success: true,
        score: finalScore,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        summary: {
          overall_score: finalScore,
          skills_analysis: `Fallback: Matched ${matchedSkillsCount} out of ${skillsArray.length} skills. Missing skills: ${missingSkills.join(', ') || 'none'}.`,
          experience_analysis: `Fallback: Detected ${yearsOfExperience} years of experience.`,
          education_analysis: `Fallback: ${hasDegree ? `Detected a degree with CGPA ${cgpa || 'unknown'}` : 'No degree detected'}.`,
          additional_factors: 'Fallback: No additional factors analyzed.',
          cgpa: cgpa || 'Not found',
        },
      };
    }
  } catch (error) {
    console.error('Error in scoreResume:', error.message);
    throw error;
  }
};

// Routes
router.post(
  '/post',
  isAuthenticated,
  upload.single('resume'),
  catchAsyncErrors(async (req, res, next) => {
    const { role, _id: userId } = req.user;

    if (role === 'Employer') {
      return next(new ErrorHandler('Employer not allowed to apply for jobs.', 400));
    }

    const { name, email, phone, address, coverLetter, jobId } = req.body;
    const resumeFile = req.file;

    if (!name || !email || !phone || !address || !coverLetter || !jobId) {
      return next(new ErrorHandler('All fields are required.', 400));
    }

    if (!resumeFile) {
      return next(new ErrorHandler('Resume file is required.', 400));
    }

    if (resumeFile.size > 2 * 1024 * 1024) {
      return next(new ErrorHandler('Resume must be less than 2MB.', 400));
    }

    if (resumeFile.mimetype !== 'application/pdf') {
      return next(new ErrorHandler('Only PDF files are allowed.', 400));
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorHandler('Job not found.', 404));
    }

    const alreadyApplied = await Application.findOne({
      'applicantID.user': userId,
      jobID: jobId,
    });

    if (alreadyApplied) {
      return next(new ErrorHandler('You have already applied for this job.', 400));
    }

    const fileName = `${req.user._id}_resume_${Date.now()}.pdf`;
    const storagePath = `resume/${fileName}`;

    const { data: uploadData, error: updateError } = await supabase.storage
      .from('resume')
      .upload(storagePath, resumeFile.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });

    if (updateError) {
      console.error('Supabase Upload Error:', updateError);
      return next(new ErrorHandler('Resume upload failed.', 500));
    }

    const { data: publicData } = supabase.storage
      .from('resume')
      .getPublicUrl(storagePath);

    const resumeUrl = publicData?.publicUrl;

    if (!resumeUrl) {
      return next(new ErrorHandler('Could not generate resume URL.', 500));
    }

    const application = await Application.create({
      name,
      email,
      phone,
      address,
      coverLetter,
      resume: {
        url: resumeUrl,
        fileName,
      },
      jobID: jobId,
      applicantID: {
        user: userId,
        role: 'Job Seeker',
      },
      employerID: {
        user: job.postedBy,
        role: 'Employer',
      },
    });

    try {
      console.log('Triggering scoreResume for application:', application._id, 'job:', jobId);
      const scoreResult = await scoreResume(jobId, application._id, next);
      console.log('Score result:', scoreResult);
    } catch (scoreError) {
      console.error('Error in scoreResume:', scoreError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Application Submitted!',
      application,
    });
  })
);

router.get('/employer/getall', isAuthenticated, getEmployerApplications);
router.get('/myapplications', isAuthenticated, getMyApplications);
router.put('/update/:id', isAuthenticated, updateApplicationStatus);
router.delete('/delete/:id', isAuthenticated, deleteApplication);
router.get('/job/:jobId', isAuthenticated, getApplicationsForJob);
console.log("Registered GET /api/v1/application/job/:jobId route.");

router.post(
  '/score-resume',
  catchAsyncErrors(async (req, res, next) => {
    const { jobID, applicationID } = req.body;
    const result = await scoreResume(jobID, applicationID, next);
    res.status(200).json(result);
  })
);

export default router;