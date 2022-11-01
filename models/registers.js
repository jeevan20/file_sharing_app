const mongoose = require("mongoose");
const regschema = new mongoose.Schema(
    {
      firstname:{
        type:String,
        required:true
      },
      email:{
        type:String,
        required:true,
        unique:true
      },
      gender:{
        type:String,
        required:true
      },
      phone:{
        type:Number,
        required:true,
        unique:true
      },
      age:{
        type:Number,
        required:true
      },
     password:{
      type:String,
      required:true
     },
     confirmpassword: {
      type:String,
      required:true
    }
  })
  module.exports = mongoose.model("register",regschema);
  