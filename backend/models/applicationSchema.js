import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide your name."],
    minLength: [3, "Name must contain at least 3 Characters!"],
    maxLength: [30, "Name cannot exceed 30 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email."],
  },
  coverLetter: {
    type: String,
    required: [true, "Please provide your cover letter."],
  },
  phone: {
    type: String,
    required: [true, "Please provide your phone number."],
  },
  address: {
    type: String,
    required: [true, "Please provide your address."],
  },
  resume: {
    url: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
  },
  applicantID: {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Job Seeker"],
      required: true,
    },
  },
  employerID: {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["Employer"],
      required: true,
    },
  },
  jobID: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
  },
  atsScore: {
    type: Number,
    default: 0, // Add this field
  },
  status: {
    type: String,
    enum: ["Pending", "Reviewed", "Accepted", "Rejected"],
    default: "Pending",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Application = mongoose.model("Application", applicationSchema);