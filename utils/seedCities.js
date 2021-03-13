require("dotenv").config();
const fs = require("fs");
const Papa = require("papaparse");

// path relative to node.js process
const pathToDataFile = "./data/cities15000.txt"; 
const file = fs.createReadStream(pathToDataFile);

const previewData = (numLines) => {
  let count = 0;
  Papa.parse(file, {
    worker: true,
    delimiter: "\t",
    preview: numLines,
    dynamicTyping: true,
    step: (result) => {
      console.log(result);
      count++;
    },
    complete: (results, file) => {
      console.log(`Parsed ${count} lines`);
    },
  });
};

const mongoose = require("mongoose");
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

const City = require("../models").City; // path relative to file

const writeToDb = () => {
  let count = 0;
  Papa.parse(file, {
    worker: true,
    delimiter: "\t",
    dynamicTyping: true, // convert latlong to numbers
    step: async (result) => {
      const geonameId = result.data[0];
      const name = result.data[1];
      const latitude = result.data[4];
      const longitude = result.data[5];
      const country = result.data[8];

      try {
        await City.create({
          geonameId,
          name,
          country,
          location: { type: "Point", coordinates: [longitude, latitude] },
        });
        console.log(geonameId, name, latitude, longitude, country);
        count++;
      } catch (err) {}
    },
    complete: (results, file) => {
      console.log(`Parsed ${count} lines`);
    },
  });
};

const testCities = (long, lat, min, max) => {
  City.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [long, lat] },
        $minDistance: min,
        $maxDistance: max,
      },
    },
  })
    .then((result) => console.log(result))
    .catch((err) => console.error(err));
};

// uncommment below to run
// previewData(100);
// writeToDb();
// mongoose.connection.close();
// testCities(-79.38, 43.65, 0, 5000);