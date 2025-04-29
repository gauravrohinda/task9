app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
  
      if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user._id;
        res.redirect("/secrets");
      } else {
        // Send error message to frontend
        res.render("login", { errorMessage: "❌ Invalid email or password." });
      }
    } catch (err) {
      console.error(err);
      res.render("login", { errorMessage: "❌ Error logging in." });
    }
  });
  