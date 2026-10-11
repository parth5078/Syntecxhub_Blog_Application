
const express = require("express");
const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET all published blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .populate("author", "name")
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

// GET single blog
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await Blog.findOne({
      _id: req.params.id,
      published: true,
    }).populate("author", "name");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch blog" });
  }
});

// CREATE blog
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, coverImage, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const blog = await Blog.create({
      title: title.trim(),
      content,
      coverImage: coverImage || "",
      tags: Array.isArray(tags) ? tags : [],
      author: req.user.id,
    });

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Failed to create blog" });
  }
});

// UPDATE own blog
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await Blog.findOne({
      _id: req.params.id,
      author: req.user.id,
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const { title, content, coverImage, tags, published } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      blog.title = title.trim();
    }

    if (content !== undefined) blog.content = content;
    if (coverImage !== undefined) blog.coverImage = coverImage;
    if (tags !== undefined && Array.isArray(tags)) blog.tags = tags;
    if (published !== undefined) blog.published = published;

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: "Failed to update blog" });
  }
});

// DELETE own blog
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await Blog.findOneAndDelete({
      _id: req.params.id,
      author: req.user.id,
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete blog" });
  }
});

module.exports = router;

/* GET my own stories — must be before GET /:id */
router.get("/mine", authMiddleware, async (req, res) => {
  try {
    const blogs = await Blog.find({
      author: req.user.id,
    })
      .populate("author", "name")
      .sort({ updatedAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your stories",
    });
  }
});
