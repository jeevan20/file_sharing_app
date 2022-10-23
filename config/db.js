require("dotenv").config();
const mongoose = require("mongoose");
function connectDB() {
  // Database connection
  mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const connection = mongoose.connection;
  connection.once("open", () => {
    console.log("Database connected");
  });
}

module.exports = connectDB;
