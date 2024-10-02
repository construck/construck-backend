const path = require("path");
const multer = require("multer");
const fs = require("fs");
const _ = require("lodash");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const { CTK_APP_URL } = process.env;

async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(500).json({
        status: "error",
        message: "No file uploaded.",
      });
    }

    const fileUrl = `${CTK_APP_URL}/uploads/${req.file.filename}`;

    return res.status(203).json({
      status: "success",
      message: "File uploaded successfully",
      data: { url: fileUrl, name: req.file.filename },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while uploading the file.",
    });
  }
}

async function download(req, res) {
  const { filename } = req.params;
  const filePath = path.join(uploadDir, filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    return res.download(filePath);
  } else {
    return res.status(404).send("File not found");
  }
}

module.exports = {
  uploadFile,
  download,
};
