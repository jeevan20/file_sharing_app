const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const regschema = new mongoose.Schema(
    {
      name:{
        type:String,
        required:true
      },
      email:{
        type:String,
        required:true,
      },
      age:{
        type:String,
        required:true
      },
      contact:{
        type:Number,
        required:true,
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

  regschema.pre("save",async function(next){
    if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password,10);
    this.confirmpassword = await bcrypt.hash(this.confirmpassword,10);
    
    }
    next();
  })
  module.exports = mongoose.model("register",regschema);
  