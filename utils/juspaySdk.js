// const axios = require("axios");
// const config = require("../config/smartgateway_config.json");

// module.exports = axios.create({
//   baseURL: "https://api.juspay.in",
//   auth: {
//     username: config.API_KEY,
//     password: "", // Juspay uses API key as username only
//   },
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

const fs = require("fs");
const { Juspay } = require("expresscheckout-nodejs");
const config = require("../config/smartgateway_config.json");

const publicKey = fs.readFileSync(config.PUBLIC_KEY_PATH);
const privateKey = fs.readFileSync(config.PRIVATE_KEY_PATH);

module.exports = new Juspay({
  merchantId: config.MERCHANT_ID,
  baseUrl: config.BASE_URL,
  jweAuth: {
    keyId: config.KEY_UUID,
    publicKey,
    privateKey
  }
});
