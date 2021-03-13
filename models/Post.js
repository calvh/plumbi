const mongoose = require("mongoose");

const { Schema } = mongoose;

const postSchema = new Schema({
  text: { type: String, required: true },
  // todo link to city schema
  city: { type: String, required: true },
  country: { type: String, required: true },
  // todo time buckets
  date: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
