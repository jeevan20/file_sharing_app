require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const register = require("./models/registers")
const File = require("./models/File");
const connectDB = require("./config/db");
const express = require("express");
const path = require("path");
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({ storage, limits: { fileSize: 1000000 * 100 } }); //100mb

// const upload = multer({ dest: "uploads" });

connectDB();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/api/files", upload.single("file"), async (req, res) => {
  // console.log(req.body);
  // console.log(req.file);
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
    size: req.file.size,
  };
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const file = await File.create(fileData);

  res.render("index", {
    fileLink: `${process.env.APP_BASE_URL}/file/${file.id}`,
  });
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);
  // console.log(file);
  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true });
      return;
    }
    if (await bcrypt.compare(req.body.password, file.password)) {
      return res.render("download", {
        fileName: file.originalName,
        fileSize: file.size,
        downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`,
      });
    }
  } else {
    return res.render("download", {
      fileName: file.originalName,
      fileSize: file.size,
      downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`,
    });
  }
}

//download link
app.get("/files/download/:uuid", async (req, res) => {
  // Extract link and get file from storage send download stream
  const file = await File.findOne({ uuid: req.params.uuid });
  // Link expired
  if (!file) {
    return res.render("download", { error: "Link has been expired." });
  }
  const response = await file.save();
  const filePath = `${__dirname}/file_sharing_app/../${file.path}`;
  res.download(filePath);
});



app.get("/register",(req,res)=>{
  res.render("register")
})

app.post("/register",async(req,res)=>{
  try {
  const password=req.body.password;
  const cpassword = req.body.confirmpassword; 
  if(password=== cpassword){
    const newuser = new register({
      name:req.body.name,
      email:req.body.email,
      age:req.body.age,
      contact:req.body.contact,
      password:password,
      confirmpassword:cpassword

    })
    const user = await newuser.save();
    res.status(201).render("index");
  }else{
    res.send("passwords are not matching")
  }
  } catch (error) {
    res.status(400).send(error)
  }
})

app.get("/login" ,(req,res)=>{
  res.render("login")
})
app.post("/login",async(req,res)=>{
    try {
      const email = req.body.email;
      const password = req.body.password;
    const userinfo=  await register.findOne({email:email})
      if(userinfo.password===password){
      res.render("index")
    }else{
      res.send("passwords are not matching");
    }
    } catch (error) {
      res.status(400).send("Invalid email")
    }
})


app.listen(process.env.PORT, () => {
  console.log("server started at 3000");
});
