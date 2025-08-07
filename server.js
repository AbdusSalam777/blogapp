// 📦 BACKEND: server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import ImageKit from "imagekit";

dotenv.config();

const app = express();
const PORT = 3000;

// ⛓️ MIDDLEWARES
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// 📦 NEW: ImageKit Setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// 🧠 Replace diskStorage with memoryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📁 GET __dirname equivalent in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🌐 MONGOOSE
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");
} catch (err) {
  console.error("❌ MongoDB connection error:", err);
}

// 🧬 SCHEMAS
const UserSchema = new mongoose.Schema(
  { username: String, email: String, img: String },
  { timestamps: true }
);
const CommentSchema = new mongoose.Schema(
  { date: String, desc: String },
  { timestamps: true }
);
const PostSchema = new mongoose.Schema(
  { img: String, title: String, slug: String, descr: String, content: String },
  { timestamps: true }
);
const NewPostSchema = new mongoose.Schema(
  { img: String, title: String, slug: String, descr: String, content: String },
  { timestamps: true }
);

const NewpostsModel = mongoose.model("Newpost", NewPostSchema);
const CommentModel = mongoose.model("Comment", CommentSchema);
const PostModel = mongoose.model("Post", PostSchema);

// 📥 FILE UPLOAD + POST SAVE
app.post("/create-post", upload.single("file"), async (req, res) => {
  const { title, descr, content } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ⬆️ Upload file buffer to ImageKit
    const imageResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: "/blog-posts", // optional
    });

    // 📝 Save post with ImageKit image URL
    const post = await NewpostsModel.create({
      img: imageResponse.url,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      descr,
      content,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("❌ Image upload or DB save error:", err);
    res.status(500).json({ message: "Error creating post" });
  }
});

// 🧾 API ROUTES
app.get("/getdata", async (req, res) => {
  try {
    const data = await PostModel.find();
    res.json(data);
  } catch (err) {
    res.status(501).json("Error fetching data");
  }
});

app.get("/getnewdata", async (req, res) => {
  try {
    const data = await NewpostsModel.find();
    res.json(data);
  } catch (err) {
    res.status(501).json("Error fetching data");
  }
});

app.get("/getSinglepost/:slug", async (req, res) => {
  try {
    const singlePostData = await PostModel.findById(req.params.slug);
    res.json(singlePostData);
  } catch (err) {
    res.status(501).json("Error fetching post");
  }
});

app.get("/getSinglenewpost/:slug", async (req, res) => {
  try {
    const data = await NewpostsModel.findById(req.params.slug);
    res.json(data);
  } catch (err) {
    res.status(501).json("Error fetching post");
  }
});

app.post("/sendcomment", async (req, res) => {
  const { date, desc } = req.body;
  try {
    await CommentModel.create({ date, desc });
    res.status(200).json("Comment sent successfully!");
  } catch (err) {
    res.status(501).json("Error sending comment");
  }
});

app.get("/getcomments", async (req, res) => {
  try {
    const data = await CommentModel.find();
    res.status(200).json(data);
  } catch (err) {
    res.status(501).json("Error fetching comments");
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
