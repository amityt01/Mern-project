const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

const testConnection = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL;
  console.log("Using URI:", uri);
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(uri);
    console.log("SUCCESS: Connected to MongoDB successfully!");
    process.exit(0);
  } catch (err) {
    console.error("FAILURE: Connection failed!");
    console.error(err);
    process.exit(1);
  }
};

testConnection();
