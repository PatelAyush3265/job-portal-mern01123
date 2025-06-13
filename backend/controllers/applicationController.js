import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import mongoose from "mongoose";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  // Access the uploaded file using req.file with multer
  const resumeFile = req.file; 
  
  if (!resumeFile) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const allowedFormats = ["application/pdf"];
  if (!allowedFormats.includes(resumeFile.mimetype)) {
    return next(
      new ErrorHandler("Invalid file type. Please upload a PDF file.", 400)
    );
  }

  try {
    // Upload to Supabase Storage
    const fileName = `${req.user._id}_resume_${Date.now()}.pdf`;
    // When using multer.memoryStorage(), the file buffer is in resumeFile.buffer
    const { data, error } = await supabase.storage
      .from('resume')
      .upload(fileName, resumeFile.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      return next(new ErrorHandler("Failed to upload Resume to Supabase", 500));
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('resume')
      .getPublicUrl(fileName);

    const { name, email, coverLetter, phone, address, jobId } = req.body;
    const applicantID = {
      user: req.user._id,
      role: "Job Seeker",
    };
    
    if (!jobId) {
      return next(new ErrorHandler("Job not found!", 404));
    }
    
    const jobDetails = await Job.findById(jobId);
    if (!jobDetails) {
      return next(new ErrorHandler("Job not found!", 404));
    }

    const employerID = {
      user: jobDetails.postedBy,
      role: "Employer",
    };
    
    if (
      !name ||
      !email ||
      !coverLetter ||
      !phone ||
      !address ||
      !applicantID ||
      !employerID
    ) {
      return next(new ErrorHandler("Please fill all fields.", 400));
    }

    const application = await Application.create({
      name,
      email,
      coverLetter,
      phone,
      address,
      applicantID,
      employerID,
      jobID: jobId,
      resume: {
        url: publicUrl,
        fileName: fileName
      }
    });

    res.status(201).json({
      success: true,
      message: "Application Submitted!",
      application,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

export const getMyApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }
  console.log("User ID:", req.user._id);
  const myApplications = await Application.find({ "applicantID.user": req.user._id })
    .populate("jobID")
    .populate("employerID.user");
  console.log("My Applications:", myApplications);
  res.status(200).json({
    success: true,
    myApplications,
  });
});

export const getEmployerApplications = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const applications = await Application.find({ "employerID.user": req.user._id })
    .populate("jobID")
    .populate("applicantID.user");
  res.status(200).json({
    success: true,
    applications,
  });
});

export const updateApplicationStatus = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }

  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Reviewed", "Accepted", "Rejected"].includes(status)) {
    return next(new ErrorHandler("Invalid status value.", 400));
  }

  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found.", 404));
  }

  application.status = status;
  await application.save();

  res.status(200).json({
    success: true,
    message: "Application status updated successfully!",
    application,
  });
});

export const deleteApplication = catchAsyncErrors(async (req, res, next) => {
  console.log("Delete application request received for ID:", req.params.id);
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found!", 404));
  }
  await application.deleteOne();
  res.status(200).json({
    success: true,
    message: "Application Deleted!",
  });
});

export const getApplicationsForJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role !== "Employer") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { jobId } = req.params;
  const applications = await Application.find({ jobID: jobId })
    .populate("applicantID.user")
    .populate("jobID")
    .populate("employerID.user");

  res.status(200).json({
    success: true,
    applications,
  });
});
