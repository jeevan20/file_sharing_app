const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const connectDB = require("./config/db"); // connection to mongodb atlas
const ejs = require("ejs");
const multer = require("multer");
const path = require("path"); //To get the file extension
const File = require("./models/file"); // to get database model
const { v4: uuid4 } = require("uuid");

connectDB();

app.set("view engine", "ejs");

// multer file settings
let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniquename = `${Date.now()}=${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniquename);
  },
});

let upload = multer({
  storage,
  limit: { fileSize: 100000 * 100 }, //100mb
});

//routes
app.get("/", (req, res) => {
  res.render("index");
});

// uploading files to database
app.post("/api/files", upload.single("file"), upload_files);

async function upload_files(req, res, err) {
  //validate request
  if (!req.file) {
    return res.json({ error: "All fields are required" });
  }
  const file = new File({
    filename: req.file.filename,
    uuid: uuid4(),
    path: req.file.path,
    size: req.file.size,
  });
  const response = await file.save();
  return res.render("index", {
    file: `${process.env.APP_BASE_URL}/files/${response.uuid}`,
  });
}

//download page

app.get("/files/:uuid", async (req, res) => {
  try {
    const file = await File.findOne({ uuid: req.params.uuid });
    if (!file) {
      return res.render("download", { error: "link expired" });
    }
    return res.render("download", {
      uuid: file.uuid,
      fileName: file.filename,
      fileSize: file.size,
      downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`,
    });
  } catch (err) {
    return res.render("download", { error: "something went wrong" });
  }
});

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

app.listen(PORT, () => {
  console.log("sever started at 3000");
});
