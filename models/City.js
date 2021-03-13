const mongoose = require("mongoose");

const { Schema } = mongoose;

// GeoJSON format
const citySchema = new mongoose.Schema({
  geonameId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  country: { type: String, required: true, minLength: 2, maxLength: 2 },
});

// geospatial index required for $near function
citySchema.index({ location: "2dsphere" });

const City = mongoose.model("City", citySchema);

module.exports = City;
