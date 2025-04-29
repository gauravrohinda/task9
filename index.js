require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "ThisIsMySecretKey", // fallback for safety
  resave: false,
  saveUninitialized: false
}));

// MongoDB Connection
mongoose.connect("mongodb+srv://gjain0279:9r28zn14IYSs5Lwh@task-7.ostklop.mongodb.net/?retryWrites=true&w=majority&appName=task-7").then(() => {
  console.log("✅ Connected to MongoDB successfully.");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

// Mongoose Schema & Model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
  tasks: {
    type: [
      {
        serial: Number,
        description: String
      }
    ],
    default: []
  }
});

const User = mongoose.model("User", userSchema);

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
}

// Routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  
  // Validate Gmail email
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.send("❌ Please provide a valid Gmail address.");
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hash });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.send("❌ Error registering.");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.redirect("/secrets");
    } else {
      res.send("❌ Invalid email or password.");
    }
  } catch (err) {
    console.error(err);
    res.send("❌ Error logging in.");
  }
});

app.get("/secrets", isAuthenticated, async (req, res) => {
  try {
    const me = await User.findById(req.session.userId);
    if (!me) return res.redirect("/login");
    res.render("secrets", { user: me });
  } catch (err) {
    console.error(err);
    res.send("❌ Could not load your secret.");
  }
});

app.post("/secrets/delete", isAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.session.userId,
      { $unset: { secret: "" } }
    );
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.send("❌ Could not delete your secret.");
  }
});

app.post("/tasks/add", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.redirect("/login");
    const nextSerial = (user.tasks.length || 0) + 1;
    user.tasks.push({
      serial: nextSerial,
      description: req.body.description
    });
    await user.save();
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.send("❌ Could not add task.");
  }
});

app.get("/submit", isAuthenticated, (req, res) => {
  res.render("submit");
});

app.post("/submit", isAuthenticated, async (req, res) => {
  const submittedSecret = req.body.secret;
  try {
    const user = await User.findById(req.session.userId);
    user.secret = submittedSecret;
    await user.save();
    res.redirect("/secrets");
  } catch (err) {
    console.error(err);
    res.send("❌ Error submitting secret.");
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
