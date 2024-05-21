const jwt = require('jsonwebtoken');
const dotenv = require("dotenv").config();


dotenv.config();
export default (token = '') => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return {
      errors: error
    };
  }
};
