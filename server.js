const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcrypt');


const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json({limit: '10mb'}));
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.mongoUri;

mongoose.connect(mongoUri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

const usersCollection = connection.collection('users');
const artsCollection = connection.collection('arts');

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists in the collection
    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      // If email exists, check if the password matches
      const passwordMatch = await bcrypt.compare(password, existingUser.password);

      if (passwordMatch) {
        // If password matches, consider it as a signin
        res.status(200).json({ message: 'Login successful', userId: existingUser._id });
      } else {
        // If password doesn't match, return an error
        res.status(401).json({ message: 'Password did not match' });
      }
    } else {
      // If email doesn't exist, create a new user and consider it as a signup
      const _id = new ObjectId(); // Generate a new ObjectId
      const hashedPassword = await bcrypt.hash(password, 10);

      // Save the new user to the collection
      await usersCollection.insertOne({ _id, email, password: hashedPassword });

      res.status(200).json({ message: 'Signup successful', userId: _id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post('/save', async (req, res) => {
  try {
      const { userId, artName, pixels, width, height, artId } = req.body;

      if (!artId) {
          // If artId is not provided, create a new art
          const result = await artsCollection.insertOne({ userId, artName, pixels, width, height });
          res.json({ _id: result.insertedId, message: 'Pixel art created successfully' });
      } else {
          // If artId is provided, update the existing art
          const updatedArt = await artsCollection.findOneAndUpdate(
              { _id: new ObjectId(artId) },
              { $set: { userId, artName, pixels, width, height } },
              { returnDocument: 'after' } // Return the updated document
          );


          res.json({ _id: artId, message: 'Pixel art updated successfully' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/userArts', async (req, res) => {
  try {
    const userId = req.query.userId; // Get the userId from the query parameters
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }

    const arts = await artsCollection.find({ userId }).toArray();
    res.json(arts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getArtData', async (req, res) => {
  const artId = req.query.artId;
  try {
      const art = await artsCollection.find({ _id: new ObjectId(artId) }).toArray();
      res.json(art);
  } catch (error) {
      res.status(500).json({ error: 'Error fetching art data' });
  }
});

app.delete('/deleteArt', async (req, res) => {
  try {
      const artId = req.query.artId;

      if (!artId) {
          return res.status(400).json({ error: 'Missing artId parameter' });
      }

      // Delete the art with the specified ID
      const result = await artsCollection.deleteOne({ _id: new ObjectId(artId) });

      if (result.deletedCount === 1) {
          res.json({ success: true });
      } else {
          res.status(404).json({ error: 'Art not found' });
      }
  } catch (error) {
      console.error('Error deleting art:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});