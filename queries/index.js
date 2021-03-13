const db = require("../models");
const Post = db.Post;

module.exports = {
  getLatest: Post.find({}).sort("-date").limit(10).exec(),
  postNew: Post.create(req.body).exec(),
};
