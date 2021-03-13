const express = require("express");
const router = express.Router();
const Filter = require("bad-words");
const db = require("../models");
const Post = db.Post;
const City = db.City;

// retrieve latest 10 posts
router.get("/posts", async (req, res, next) => {
  req.query.limit = parseInt(req.query.limit);
  const { before, limit } = req.query;

  // check query parameters
  // todo check valid date
  if (!before) {
    return res.status(500).send("Bad query");
  }

  if (!Number.isInteger(limit) || !(limit > 0)) {
    return res.status(500).send("Bad query");
  }

  try {
    const posts = await Post.find({ date: { $lt: before } })
      .sort({ date: -1 })
      .limit(limit)
      .exec();
    console.log(posts);
    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).send("DB error");
  }
});

// create new post
router.post("/posts", async (req, res, next) => {
  // remove bad words
  filter = new Filter();

  try {
    const sanitized = filter.clean(req.body.text);
    req.body.text = sanitized;
  } catch (err) {
    if (err instanceof TypeError) {
      console.log("Non-english input, not filtered");
    } else {
      throw err;
    }
  }
  
  try {
    const post = await Post.create(req.body);
    console.log(post);
    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).send("DB error");
  }
});

// longitude first to comply with GeoJSON standards
router.get("/cities/", async (req, res, next) => {
  const { long, lat } = req.query;

  // check query parameters
  if (!long || !lat) {
    return res.status(500).send("Bad query");
  }

  try {
    const city = await City.findOne({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [long, lat] },
        },
      },
    }).exec();
    console.log(city);
    const { name, country } = city;
    res.json({ name, country });
  } catch (err) {
    console.log(err);
    res.status(500).send("DB error");
  }
});

module.exports = router;
