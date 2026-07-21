var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");


const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const authRouter = require("./routes/auth");
const resourcesRouter = require("./routes/resources");
const foldersRouter = require("./routes/folders");
const analyticsRouter = require("./routes/analytics");
const studentsRouter = require("./routes/students");

app.use("/api/auth", authRouter);
app.use("/api", authRouter);
app.use("/", authRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/folders", foldersRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/students", studentsRouter);
app.use("/students", studentsRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;