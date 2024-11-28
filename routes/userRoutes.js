import express from "express";
import {
  loginUser,
  paymentRazorpay,
  registerUser,
  userCredits,
  verifyRazorpay
} from "../controllers/userController.js";
import userAuth from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

userRouter.get("/credits", userAuth, userCredits);
userRouter.get("/pay-razor", userAuth, paymentRazorpay);
userRouter.get("/verify-razor", userAuth, verifyRazorpay);

export default userRouter;
