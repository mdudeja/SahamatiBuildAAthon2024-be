export default () => ({
  urls: {
    base: process.env.BASE_URL,
    db: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  default: {
    otp: process.env.DEFAULT_OTP,
  },
});
