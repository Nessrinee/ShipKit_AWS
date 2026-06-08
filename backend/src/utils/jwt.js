const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessExpiry });

const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiry });

const verifyAccessToken = (token) => {
  try {
    return { valid: true, payload: jwt.verify(token, config.jwt.secret) };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

const verifyRefreshToken = (token) => {
  try {
    return { valid: true, payload: jwt.verify(token, config.jwt.refreshSecret) };
  } catch (err) {
    return { valid: false, error: err.message };
  }
};

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
