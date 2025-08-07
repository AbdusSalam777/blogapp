// 📦 BACKEND: server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3000;

// ⛓️ MIDDLEWARES
app.use(cors({
  origin: ["http://localhost:5173", "https://clinquant-torte-90da94.netlify.app"],
  credentials: true
}));

app.use(express.json());

// 📁 SERVE UPLOADS FOLDER
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ☁️ MULTER SETUP
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// 🌐 MONGOOSE
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("MongoDB connection error:", err);
}

// 🧬 SCHEMAS
const UserSchema = new mongoose.Schema({ username: String, email: String, img: String }, { timestamps: true });
const CommentSchema = new mongoose.Schema({ date: String, desc: String }, { timestamps: true });
const PostSchema = new mongoose.Schema({ img: String, title: String, slug: String, descr: String, content: String }, { timestamps: true });
const NewPostSchema = new mongoose.Schema({ img: String, title: String, slug: String, descr: String, content: String }, { timestamps: true });

const NewpostsModel = mongoose.model("Newpost", NewPostSchema);
const CommentModel = mongoose.model("Comment", CommentSchema);
const PostModel = mongoose.model("Post", PostSchema);

// 📥 FILE UPLOAD + POST SAVE
// ✅ POST route with multer to upload and save post
app.post("/create-post", upload.single("file"), async (req, res) => {
  const { title, descr, content } = req.body;

  try {
    // ✅ This stores the full accessible URL in DB
    const fileUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : "";

    const post = await NewpostsModel.create({
      img: fileUrl, // ✅ store full URL here
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      descr,
      content,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
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
    res.status(501).json("Error sending comment");
  }
});

app.get("/", (req, res) => {
  res.send("✅ Blog API is running!");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
