app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // Validate Gmail email
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.render("register", { errorMessage: "❌ Please provide a valid Gmail address." });
  }

  // Validate password format
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,8}$/;
  if (!passwordRegex.test(password)) {
    return res.render("register", { errorMessage: "❌ Password must be 6–8 characters long and include at least one uppercase letter, one lowercase letter, and one number." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { errorMessage: "❌ Email already registered. Please login." });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hash });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { errorMessage: "❌ Error registering." });
  }
});
