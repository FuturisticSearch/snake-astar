// netlify/functions/learning.js
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "learning.json");

exports.handler = async (event) => {
  // READ DB
  let data = {};
  if (fs.existsSync(DB_PATH)) {
    data = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  }

  // GET request → return full data
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    };
  }

  // POST request → merge learning data
  if (event.httpMethod === "POST") {
    try {
      const incoming = JSON.parse(event.body);

      Object.keys(incoming).forEach(key => {
        if (!data[key]) data[key] = [];
        data[key] = Array.from(new Set([...data[key], ...incoming[key]]));
      });

      fs.writeFileSync(DB_PATH, JSON.stringify(data));

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } catch (err) {
      return { statusCode: 400, body: "Bad JSON" };
    }
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
