const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();

async function tokenGenerator(payload = {}, expiresIn = { expiresIn: "30d" }) {
  let isValidPayload = true;

  if (typeof payload === "number") {
    isValidPayload = false;
  } else if (payload === null) {
    isValidPayload = false;
  } else if (typeof payload === "object" && !Object.keys(payload).length) {
    isValidPayload = false;
  }

  return isValidPayload
    ? jwt.sign(payload, process.env.SECRET_KEY, expiresIn)
    : null;
}

module.exports = {
  tokenGenerator,
};
