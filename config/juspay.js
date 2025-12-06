const axios = require("axios");
const config = require("./smartgateway_config.json");

const api = axios.create({
  baseURL: config.BASE_URL,
  auth: {
    username: config.MERCHANT_ID,
    password: config.API_KEY,
  },
  headers: {
    "Content-Type": "application/json",
  },
});

module.exports = api;
