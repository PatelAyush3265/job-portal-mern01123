import express from "express";
import {
  login,
  register,
  logout,
  getMyProfile,
  updateProfile,
  updatePassword,
  getUser,
  updateProfilePicture,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getmyprofile", isAuthenticated, getMyProfile);
router.get("/getuser/:id", isAuthenticated, getUser);
router.put("/update/profile", isAuthenticated, updateProfile);
router.put("/update/password", isAuthenticated, updatePassword);
router.put(
  "/update/profile-picture",
  isAuthenticated,
  upload.single("profilePicture"),
  updateProfilePicture
);

export default router;
