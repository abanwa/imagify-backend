import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transactionModel from "../models/transactionModel.js";
import razorpay from "razorpay";

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "Missing Details"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user?._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { name: user?.name }
    });
  } catch (err) {
    console.log("Error in registerUser in userController : ", err);
    res.json({
      success: false,
      message: err?.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        success: false,
        message: "Missing Details"
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User does not exist"
      });
    }

    const isMatch = await bcrypt.compare(password, user?.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign({ id: user?._id }, process.env.JWT_SECRET);

    res.json({
      success: true,
      token,
      user: { name: user?.name }
    });
  } catch (err) {
    console.log("Error in loginUser in userController : ", err);
    res.json({
      success: false,
      message: err?.message
    });
  }
};

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.json({
        success: false,
        message: "Missing ID"
      });
    }

    const user = await userModel.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      credits: user?.creditBalance,
      user: { name: user?.name }
    });
  } catch (err) {
    console.log("Error in userCredits in userController : ", err);
    res.json({
      success: false,
      message: err?.message
    });
  }
};

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentRazorpay = async (req, res) => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      return res.json({
        success: false,
        message: "Missing Details"
      });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    let credits, plan, amount, date;
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 10;
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 50;
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 250;
        break;

      default:
        return res.json({
          success: false,
          message: "Plan not found"
        });
    }

    date = Date.now();
    const transactionData = {
      userId,
      plan,
      amount,
      credits,
      date
    };

    const newTransaction = await transactionModel.create(transactionData);

    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction?._id
    };

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(
          `Error in razorpayInstance.order.create in paymentRazorpay : ${error}`
        );
        return res.json({
          success: false,
          message: error
        });
      }
      res.json({
        success: true,
        order
      });
    });
  } catch (err) {
    console.log("Error in paymentRazorpay in userController : ", err);
    res.json({
      success: false,
      message: err?.message
    });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;
    if (!razorpay_order_id) {
      return res.json({
        success: false,
        message: "Missing Data"
      });
    }

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo?.status !== "paid") {
      return res.json({
        success: false,
        message: "Payment not successful"
      });
    }

    const transactionData = await transactionModel.findById(orderInfo?.receipt);
    if (transactionData?.payment) {
      return res.json({
        success: false,
        message: "Payment Failed"
      });
    }

    const userData = await userModel.findById(transactionData?.userId);
    const creditBalance = userData?.creditBalance + transactionData?.credits;
    await userModel.findByIdAndUpdate(userData?._id, { creditBalance });
    await transactionModel.findByIdAndUpdate(transactionData?._id, {
      payment: true
    });

    res.json({
      success: true,
      message: "Credits Added"
    });
  } catch (err) {
    console.log("Error in verifyRazorpay in userController : ", err);
    res.json({
      success: false,
      message: err?.message
    });
  }
};

export {
  registerUser,
  loginUser,
  userCredits,
  paymentRazorpay,
  verifyRazorpay
};
