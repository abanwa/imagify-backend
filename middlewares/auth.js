import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again"
      });
    }
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenDecode?.id) {
      return res.json({
        success: false,
        message: "Invalid token data. Login Again"
      });
    }

    req.body.userId = tokenDecode?.id;
    next();
  } catch (err) {
    console.log("Error in userAuth in auth.js middleware : ", err);
    return res.json({
      success: false,
      message: err?.message
    });
  }
};

export default userAuth;
