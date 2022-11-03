const mongoose = require("mongoose");

const File = new mongoose.Schema({
  path: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  password: String,
  size: { type: Number, required: true },
  downloadCount: {
    type: Number,
    required: true,
    default: 0,
  },
  sender:{
    type:String,
    required:false,
  },
  reciever:{
    type:String,
    required:false,
  }
});

module.exports = mongoose.model("File", File);
