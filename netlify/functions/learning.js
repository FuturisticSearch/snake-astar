// /netlify/functions/learning.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'learning.json');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      // Load AI learning data
      if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
      }
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      // Update AI learning data
      const incoming = JSON.parse(event.body);
      let current = {};
      if (fs.existsSync(DATA_FILE)) {
        current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
      // Merge incoming data
      for (const key in incoming) {
        if (!current[key]) current[key] = [];
        current[key] = Array.from(new Set([...current[key], ...incoming[key]]));
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(current), 'utf8');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};
