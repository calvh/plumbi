require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");

// define folder to serve assets from
app.use(express.static(path.join(__dirname, "public")));

// -----------------------------  HANDLEBARS  -----------------------------
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// -------------------------  EXPRESS MIDDLEWARE  -------------------------
const logger = require("morgan");
const cookieParser = require("cookie-parser");
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// -------------------------------  MONGODB  ------------------------------

const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
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
}

connectDB();

// ----------------------------  MOUNT ROUTERs  ----------------------------

app.use("/api", require("./routes/api"));
app.use("/", require("./routes/render"));

// ---------------------------  ERROR HANDLING  ---------------------------
const createError = require("http-errors");
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// ----------------------------  START SERVER  ----------------------------
const PORT = process.env.PORT;

// grab instance of http server for socket.io
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// ------------------------------  SOCKET.IO  -----------------------------

const io = require("socket.io")(server);

// a socket connects to the server
io.on("connection", (socket) => {
  // new post by this socket
  socket.on("new post", (data) => {
    // emit to all users
    socket.broadcast.emit("new post", data);
  });

  // todo handle disconnect
});

module.exports = app;
