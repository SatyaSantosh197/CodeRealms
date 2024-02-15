const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.connect('mongodb://localhost:27017/codeRealmsDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', () => console.log("Error in connecting to the database"));
db.once('open', () => console.log("Connected to the database"));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true }
});

const User = mongoose.model('User', userSchema);

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword, email });
        await newUser.save();

        console.log("Record Inserted Successfully");
        res.redirect('/home.html');
    } catch (error) {
        console.error('Error:', error.message);

        if (error.name === 'ValidationError') {
            res.status(400).json({ error: error.message });
        } else if (error.code === 11000) {
            res.status(400).json({ error: 'Email must be unique' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

app.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  console.log('Entered Password:', password);


  console.log('Request Body:', req.body);
  try {
      // Find the user by username
      const user = await User.findOne({ username });

      if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Compare the provided password with the hashed password from the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Hashed Password:', user.password);
      console.log('Password Comparison Result:', isPasswordValid);

      if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
      }

      console.log("User signed in successfully");
      res.redirect('/home.html');
  } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.use(express.static(__dirname));

const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
