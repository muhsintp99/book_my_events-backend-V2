const crypto = require('crypto');
const config = require('../config/smartgateway_config.json');

module.exports = (req, res, next) => {
  const signature = req.headers['x-signature'] || req.headers['x-hdfc-signature'] || req.headers['x-hdfc-sign'];
  const body = JSON.stringify(req.body || {});
  if (!signature) {
    console.log('No signature header present');
    return res.status(401).json({ error: 'No signature' });
  }
  const expected = crypto.createHmac('sha256', config.RESPONSE_KEY).update(body).digest('hex');
  if (signature !== expected) {
    console.log('Invalid webhook signature. got:', signature, 'expected:', expected);
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
};
