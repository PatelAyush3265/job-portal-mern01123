import express from "express";
import {
  getEmployerApplications,
  getMyApplications,
  updateApplicationStatus,
} from "../controllers/applicationController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/userSchema.js";
import axios from "axios"; // For downloading the PDF
import pdf from "pdf-parse"; // Add parser import here

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Multer setup to use memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/post",
  isAuthenticated,
  upload.single("resume"),
  catchAsyncErrors(async (req, res, next) => {
    const { role, _id: userId } = req.user;

    if (role === "Employer") {
      return next(new ErrorHandler("Employer not allowed to apply for jobs.", 400));
    }

    const { name, email, phone, address, coverLetter, jobId } = req.body;
    const resumeFile = req.file;

    // Validation
    if (!name || !email || !phone || !address || !coverLetter || !jobId) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    if (!resumeFile) {
      return next(new ErrorHandler("Resume file is required.", 400));
    }

    if (resumeFile.size > 2 * 1024 * 1024) {
      return next(new ErrorHandler("Resume must be less than 2MB.", 400));
    }

    if (resumeFile.mimetype !== "application/pdf") {
      return next(new ErrorHandler("Only PDF files are allowed.", 400));
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }

    const alreadyApplied = await Application.findOne({
      "applicantID.user": userId,
      jobID: jobId,
    });

    if (alreadyApplied) {
      return next(new ErrorHandler("You have already applied for this job.", 400));
    }

    // Upload to Supabase Storage
    const fileName = `${req.user._id}_resume_${Date.now()}.pdf`;
    const storagePath = `resume/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("resume")
      .upload(storagePath, resumeFile.buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return next(new ErrorHandler("Resume upload failed.", 500));
    }

    // Get public URL from Supabase
    const { data: publicData } = supabase.storage
      .from("resume")
      .getPublicUrl(storagePath);

    const resumeUrl = publicData?.publicUrl;

    if (!resumeUrl) {
      return next(new ErrorHandler("Could not generate resume URL.", 500));
    }

    // Save to DB
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
        role: "Job Seeker",
      },
      employerID: {
        user: job.postedBy,
        role: "Employer",
      },
    });

    res.status(201).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  })
);

// Other routes
router.get("/employer/getall", isAuthenticated, getEmployerApplications);
router.get("/myapplications", isAuthenticated, getMyApplications);
router.put("/update/:id", isAuthenticated, updateApplicationStatus);

router.post(
  "/score-resume",
  catchAsyncErrors(async (req, res, next) => {
    const { jobID, applicationID } = req.body;
    console.log("Received request for jobID:", jobID, "applicationID:", applicationID);

    const job = await Job.findById(jobID);
    const application = await Application.findById(applicationID);

    if (!job || !application) {
      console.log("Job or Application not found");
      return next(new ErrorHandler("Job or Application not found", 404));
    }

    if (!job.skills || !Array.isArray(job.skills) || job.skills.length === 0) {
      console.log("Invalid job skills");
      return next(new ErrorHandler("Job skills are missing or invalid.", 400));
    }

    console.log("Job skills:", job.skills);
    const requiredSkills = job.skills.join(", ");
    const resumeURL = application.resume.url;
    console.log("Resume URL:", resumeURL);

    try {
      // Step 1: Download the PDF using axios
      const pdfBuffer = (await axios.get(resumeURL, { responseType: "arraybuffer" })).data;
      console.log("PDF downloaded successfully");

      // Step 2: Use pdf-parse to extract text (this is where the parser is added)
      const parsed = await pdf(pdfBuffer);
      const resumeText = parsed.text;
      console.log("Resume text length:", resumeText.length);

      if (!resumeText) {
        console.log("Empty resume text extracted");
        return next(new ErrorHandler("Failed to extract text from resume.", 400));
      }

      // Step 3: Truncate resume text to avoid Gemini token limits
      const maxLength = 3000;
      const truncatedResumeText = resumeText.length > maxLength ? resumeText.substring(0, maxLength) : resumeText;

      // Step 4: Prepare prompt for Gemini using the extracted text
      const prompt = `
Given the resume text and a list of required job skills, analyze the resume content and return:
- ATS score out of 100
- List of matched skills
- List of missing skills
- One-line summary feedback

### Required Skills:
${requiredSkills}

### Resume Text:
${truncatedResumeText}

Respond in JSON:
{
  "score": number,
  "matched_skills": [string],
  "missing_skills": [string],
  "summary": string
}
`;

      console.log("Sending request to Gemini...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      let text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      // Clean response: remove ```json and ``` if present
      text = text.replace(/```json\s*|\s*```/g, "").trim();
      console.log("AI Response:", text);

      if (!text) {
        return next(new ErrorHandler("Empty response from AI.", 500));
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(text);
      } catch (jsonError) {
        console.error("Failed to parse Gemini response as JSON:", text);
        return next(new ErrorHandler("Invalid JSON response from AI.", 500));
      }

      if (!parsedResponse.score || !Number.isInteger(parsedResponse.score) || parsedResponse.score < 0 || parsedResponse.score > 100) {
        console.error("Invalid score in Gemini response:", parsedResponse);
        return next(new ErrorHandler("Invalid score in AI response.", 500));
      }

      // Update application with score
      application.atsScore = parsedResponse.score;
      await application.save();

      res.status(200).json({
        success: true,
        score: parsedResponse.score,
        matched_skills: parsedResponse.matched_skills || [],
        missing_skills: parsedResponse.missing_skills || [],
        summary: parsedResponse.summary || "No summary provided.",
      });
    } catch (error) {
      console.error("Error in score-resume:", error.message, error.stack);
      return next(new ErrorHandler(`Failed to analyze resume: ${error.message}`, 500));
    }
  })
);

export default router;