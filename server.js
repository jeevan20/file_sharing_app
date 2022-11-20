require("dotenv").config();
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const File = require("./models/file");
const connectDB = require("./config/db");
const express = require("express");
const path = require("path");
const app = express();
const archiver = require("archiver"); // for multiple file uploads
const fs = require("fs");
//install body-parser npm and require it
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "./public")));
let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
// app.use(express.bodyParser());
let upload = multer({ storage, limits: { fileSize: 10000000 * 100 } }); //1000mb

// const upload = multer({ dest: "uploads" });

connectDB();

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/transfer", (req, res) => {
  res.render("index");
});

app.post("/api/files", upload.array("file"), async (req, res) => {
  const { files } = req;
  let id = "";
  try {
    if (files.length === 1) {
      const fileData = {
        path: files[0].path,
        originalName: files[0].originalname,
        size: files[0].size,
      };
      if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10);
      }
      fileData.sender = req.body.sendermail;
      fileData.receiver = req.body.recievermail;

      const file = await File.create(fileData);
      id = file.id;
      res.render("transfer", {
        fileLink: `${process.env.APP_BASE_URL}/file/${file.id}`,
      });
    } else if (files.length > 1) {
      const zipFile = archiver("zip", { zlib: { level: 9 } });

      zipFile.on("warning", (error) => {
        console.log("warning:", error);
      });

      zipFile.on("error", (error) => {
        console.error("error occurred :", error);
      });
      const randomPath = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const writeStream = fs.createWriteStream(`uploads/${randomPath}`);
      zipFile.pipe(writeStream);
      let sizeoffiles = 0;
      await files.forEach((file) => {
        sizeoffiles += file.size;
        zipFile.append(fs.createReadStream(file.path), {
          name: file.originalname,
        });
      });
      await zipFile.finalize();

      files.forEach((file) => {
        fs.unlink(file.path, (err) => {
          if (err) console.log(err);
        });
      });
      const title = files[0].originalname;

      const fileData = {
        path: `uploads/${randomPath}`,
        originalName: `${title}.zip`,
        size: sizeoffiles,
      };
      if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10);
      }
      if (req.body.sendermail != null && req.body.recievermail != null) {
        fileData.sender = req.body.sendermail;
        fileData.receiver = req.body.recievermail;
      }
      const file = await File.create(fileData);
      id = file.id;
      res.render("transfer", {
        fileLink: `${process.env.APP_BASE_URL}/file/${file.id}`,
      });
    }
    let emailFrom = req.body.sendermail;
    let emailTo = req.body.recievermail;
    if (id && emailTo && emailFrom) {
      const file = await File.findOne({ _id: id });
      let passSentence = "";
      const sendmail = require("./services/mail");
      let dLink = process.env.APP_BASE_URL + "/file/" + file.id;
      if (req.body.passCheck == "on" && req.body.password != null) {
        passSentence = "File password : " + req.body.password;
      }
      sendmail({
        from: emailFrom,
        to: emailTo,
        subject: "file sharing",
        text: `${emailFrom} sent a mail`,
        html: require("./services/template")({
          emailFrom: emailFrom,
          downloadLink: dLink,
          size: parseInt(file.size / 1000) + "KB",
          expires: "24 hours",
          passSentence: passSentence,
        }),
      });
    }
  } catch (error) {
    console.log(error);
  }
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
