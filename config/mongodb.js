import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database connected");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/imagify`);
  } catch (err) {
    console.log("DB ERROR : ", err);
  }
};

export default connectDB;
