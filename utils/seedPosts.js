require("dotenv").config();
const faker = require("faker");

const mongoose = require("mongoose");
const { Post } = require("../models");
const MONGODB_URI = process.env.MONGODB_URI;

try {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
} catch (err) {
  console.log(err);
  throw err;
}

const seedEntries = async (numEntries) => {
  for (let i = 0; i < numEntries; i++) {
    await Post.create({
      text: faker.lorem.paragraph(3),
      city: "San Francisco",
      country: "US",
      date: faker.date.past(),
    });
  }
  mongoose.connection.close();
};

seedEntries(30);