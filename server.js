require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/File");
const connectDB = require("./config/db");
const express = require("express");
const path = require("path");
const app = express();
app.use(express.urlencoded({ extended: true }));

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({ storage, limits: { fileSize: 10000000 * 100 } }); //1000mb

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

app.listen(process.env.PORT, () => {
  console.log("server started at 3000");
});
