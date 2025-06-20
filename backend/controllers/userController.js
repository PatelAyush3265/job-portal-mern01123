import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill full form !"));
  }
  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered !"));
  }
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    resume: {
      public_id: "default",
      url: "default",
    },
  });
  sendToken(user, 201, res, "User Registered Sucessfully !");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role !"));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password !", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found !`, 404)
    );
  }
  sendToken(user, 201, res, "User Logged In Sucessfully !");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});

export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const getMyProfile = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, education, skills, languages, projects, companyName, companyDescription } = req.body;
  const updateData = { name, email, phone };
  if (education !== undefined) updateData.education = education;
  if (skills !== undefined) updateData.skills = skills;
  if (languages !== undefined) updateData.languages = languages;
  if (projects !== undefined) updateData.projects = projects;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (companyDescription !== undefined) updateData.companyDescription = companyDescription;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({
    success: true,
    message: "Profile Updated!",
    user,
  });
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(
      new ErrorHandler("Please provide old password, new password, and confirm password.", 400)
    );
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("New password and confirm password do not match.", 422)
    );
  }
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await user.comparePassword(oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Incorrect old password.", 400));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

export const updateProfilePicture = catchAsyncErrors(async (req, res, next) => {
  const { user } = req;
  if (!req.file) {
    return next(new ErrorHandler("No file uploaded.", 400));
  }

  const file = req.file;
  const fileName = `${user._id}-${Date.now()}${path.extname(file.originalname)}`;
  const filePath = `profile_pic/${fileName}`;

  const { data, error } = await supabase.storage
    .from("resume")
    .upload(filePath, file.buffer, {
      upsert: true,
      contentType: file.mimetype,
    });

  if (error) {
    return next(new ErrorHandler("Error uploading to Supabase: " + error.message, 500));
  }

  const { data: publicUrlData } = supabase.storage
    .from("resume")
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    return next(new ErrorHandler("Could not get public URL.", 500));
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { "profilePicture.url": publicUrlData.publicUrl },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully.",
    user: updatedUser,
  });
});