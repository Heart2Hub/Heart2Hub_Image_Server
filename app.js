const { PORT_NUM } = require("./constants/PortNum");
const {
  WEB_PORTAL,
  MOBILE_APP,
  ELGIN_ANDROID,
} = require("./constants/EndPoint");
const express = require("express");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
var { expressjwt: jwt } = require("express-jwt");
const { JWT_SECRET } = require("./constants/JwtSecret");

const app = express();
const PORT = PORT_NUM;

const cors = require("cors");

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

//ADD CORS CODE:
const corsOrigins = [WEB_PORTAL, MOBILE_APP, ELGIN_ANDROID];
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

//checking for JWT
app.use((req, res, next) => {
  let authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    let token = authHeader.split(" ")[1];
    console.log("Received Token:", token);
  } else {
    console.log("No Token Received");
  }
  next();
});

app.use((req, res, next) => {
  if (req.method === "GET") {
    let authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      let token = authHeader.split(" ")[1];
      console.log("Attempting to verify token:", token);
    }
    try {
      jwt({
        secret: Buffer.from(JWT_SECRET, "base64"),
        algorithms: ["HS256"],
      })(req, res, next);
    } catch (error) {
      console.log(error);
    }
  } else {
    next();
  }
});

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
  if (req.body) {
    res.send({
      message: "Image uploaded successfully!",
      type: req.params.type, // This will be either 'id' or 'general'
      filename: req.file.filename,
    });
  } else {
    res.status(400).send("Please upload a profile picture");
  }
});

//GET endpoint for frontend to receive image
// app.get('/path-to-image', (req, res) => {
//   const imgBuffer = ...; // Load your image into a buffer
//   res.setHeader('Content-Type', 'image/png');
//   res.send(imgBuffer);
// });

// Validate upload middleware using express validator
// const validateUpload = [
//     // Validate 'type' parameter
//     body("type").isIn(["id", "general"]).withMessage("Invalid image type"),

//     // Validate 'image' file upload
//     body("image").custom((value, { req }) => {
//       if (!req.file) {
//         throw new Error("Image file is required");
//       }
//       // Additional file validation logic can be added here, e.g., file size, file type, etc.
//       return true;
//     }),
//   ];

// Throws error if invalid JWT Token
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    console.error(err.message);
    if (err.message === "jwt expired") {
      return res.status(401).send("JWT Token has expired");
    } else {
      return res.status(401).send("Invalid token");
    }
  } else {
    // Pass the error to any subsequent error handlers.
    next(err);
  }
});

// Catch-all for any request that doesn't match the above routes.
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
