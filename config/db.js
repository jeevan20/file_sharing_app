require("dotenv").config();
const mongoose = require("mongoose");

function connectDB() {
  // Database connection
  mongoose.connect(process.env.MONGO_CONNNECTION_URL, {
    useNewUrlParser: true,
    // useCreateIndex: true,
    useUnifiedTopology: true,
    // useFindAndModify: true,
  });

  const connection = mongoose.connection;
  connection.once("open", () => {
    console.log("Database connected");
  });
}

module.exports = connectDB;
