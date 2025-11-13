const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const privateKey = fs.readFileSync(
  path.join(__dirname, "../config/jwt_private.pem"),
  "utf8"
);

exports.generateJuspayJWT = () => {
  const payload = {
    iss: "SG3864",  // Merchant ID
    sub: "SG3864",
    aud: "smartgateway",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
  };

  return jwt.sign(payload, privateKey, { algorithm: "RS256" });
};
