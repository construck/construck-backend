const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const _ = require("lodash");
const fs = require("fs");
const FileController = require("./../controllers/file");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File filter for PDF only
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(null, false);
    req.fileValidationError = "Only PDF files are allowed!";
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // Max:1 MB
  },
}).single("file");

router.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File size should not exceed 1MB" });
      }
      return res.status(500).json({ error: err.message });
    } else if (err) {
      console.log("err", err);
      return res
        .status(400)
        .json({ error: err.message || "An unknown error occurred" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or file type not allowed" });
    }

    return FileController.uploadFile(req, res);
  });
});
router.get("/download/:filename", (req, res) => {
  return FileController.download(req, res);
});

module.exports = router;
