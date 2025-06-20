import express from "express";
import {
  deleteJob,
  getAllJobs,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
  shortlistApplicant,
  getShortlistedApplicants,
  removeShortlistedApplicant,
} from "../controllers/jobController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllJobs);
router.post("/post", isAuthenticated, postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
router.get("/:id", isAuthenticated, getSingleJob);
router.put("/:jobId/shortlist", isAuthenticated, shortlistApplicant);
router.get("/:jobId/shortlisted", isAuthenticated, getShortlistedApplicants);
router.delete("/:jobId/shortlisted/:applicationId", isAuthenticated, removeShortlistedApplicant);

export default router;
