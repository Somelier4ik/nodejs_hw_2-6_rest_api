const UserSchema = require("../model/schemas/user.js");
const HttpCode = require("../helpers/constants.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const registration = async (req, res, next) => {
  const userExist = await UserSchema.findOne({ email: req.body.email });
  if (userExist) {
    return res.status(HttpCode.CONFLICT).json({
      status: `${HttpCode.CONFLICT} Conflict`,
      ContentType: "application/json",
      ResponseBody: {
        message: "Email in use",
      },
    });
  }
  try {
    const newUser = new UserSchema(req.body);
    await newUser.save();
    return res.status(HttpCode.CREATED).json({
      status: `${HttpCode.CREATED} Created`,
      ContentType: "application/json",
      ResponseBody: {
        user: {
          email: newUser.email,
          subscription: newUser.subscription,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const foundUser = await UserSchema.findOne({ email });
    const isValidPassword = await foundUser?.isValidPassword(password);
    if (!foundUser || !isValidPassword) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        Status: `${HttpCode.UNAUTHORIZED} Unauthorized`,
        ResponseBody: {
          message: "Email or password is wrong",
        },
      });
    }

    const payload = { id: foundUser.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "2h",
    });
    await UserSchema.updateOne({ _id: foundUser.id }, { token });

    return res.status(HttpCode.OK).json({
      Status: `${HttpCode.OK} OK`,
      ContentType: "application/json",
      ResponseBody: {
        token,
        user: {
          email: foundUser.email,
          subscription: foundUser.subscription,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  const userId = req.user?.id;
  await UserSchema.updateOne({ _id: userId }, { token: null });
  return res.status(HttpCode.NO_CONTENT).json({
    Status: `${HttpCode.NO_CONTENT} No Content`,
  });
};

const getCurrentUser = async (req, res, next) => {
  return res.status(HttpCode.OK).json({
    Status: `${HttpCode.OK} OK`,
    ContentType: "application/json",
    ResponseBody: {
      email: req.user.email,
      subscription: req.user.subscription,
    },
  });
};

const updateSubscr = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const updatedUser = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { subscription: req.body.subscription },
      { new: true }
    );

    return res.status(HttpCode.OK).json({
      Status: `${HttpCode.OK} OK`,
      ContentType: "application/json",
      ResponseBody: {
        email: updatedUser.email,
        subscription: updatedUser.subscription,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { registration, login, logout, getCurrentUser, updateSubscr };