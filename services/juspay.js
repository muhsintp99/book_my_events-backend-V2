const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const config = require('../config/smartgateway_config.json');

const privateKey = fs.readFileSync(path.join(__dirname, '../config/jwt_private.pem'), 'utf8');
// replace KID with the one given to you (if none, leave as-is but ideally provide the right KID)
const KID = "key_88bcd0bfc01c485e848b3d70c49fcf4c";

exports.generateJuspayJWT = () => {
  const payload = {
    iss: config.MERCHANT_ID,
    aud: "smartgateway",
    iat: Math.floor(Date.now()/1000),
    exp: Math.floor(Date.now()/1000) + 300
  };
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: { kid: KID }
  });
};
