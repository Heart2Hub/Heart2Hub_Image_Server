const { PORT_NUM } = require("./constants/PortNum");
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = PORT_NUM;

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";

    // Decide on the folder based on the route
    if (req.params.type === "id") {
      folder += "id_photos/";
    } else if (req.params.type === "general") {
      folder += "general_photos/";
    } else {
      return cb(new Error("Invalid image type")); // Handle unexpected types
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Serve static images from different folders
app.use(
  "/images/id",
  express.static(path.join(__dirname, "uploads/id_photos"))
);
app.use(
  "/images/general",
  express.static(path.join(__dirname, "uploads/general_photos"))
);

// Endpoints to upload images
app.post("/upload/:type", upload.single("image"), (req, res) => {
  res.send({
    message: "Image uploaded successfully!",
    type: req.params.type, // This will be either 'id' or 'general'
    filename: req.file.filename,
  });
});

app.listen(PORT, () => {
  console.log(Server started on http://localhost:${PORT});
});