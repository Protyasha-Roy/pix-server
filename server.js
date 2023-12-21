// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const { ObjectId } = require('mongodb');
// require('dotenv').config();
// const bcrypt = require('bcrypt');


// const app = express();
// const PORT = process.env.PORT || 10000;

// app.use(bodyParser.json());
// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// const mongoUri = process.env.mongoUri;

// mongoose.connect(mongoUri);
// const connection = mongoose.connection;
// connection.once('open', () => {
//   console.log('MongoDB database connection established successfully');
// });

// const usersCollection = connection.collection('users');


// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });

// app.post('/signin', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check if the email already exists in the collection
//     const existingUser = await usersCollection.findOne({ email });

//     if (existingUser) {
//       // If email exists, check if the password matches
//       const passwordMatch = await bcrypt.compare(password, existingUser.password);

//       if (passwordMatch) {
//         // If password matches, consider it as a signin
//         res.status(200).json({ message: 'Login successful', userId: existingUser._id });
//       } else {
//         // If password doesn't match, return an error
//         res.status(401).json({ message: 'Password did not match' });
//       }
//     } else {
//       // If email doesn't exist, create a new user and consider it as a signup
//       const _id = new ObjectId(); // Generate a new ObjectId
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Save the new user to the collection
//       await usersCollection.insertOne({ _id, email, password: hashedPassword });

//       res.status(200).json({ message: 'Signup successful', userId: _id });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());
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
const projectsCollection = connection.collection('projects');

app.get('/', (req, res) => {
  res.send('Hello, World!');
});


// Create or update a project
app.post('/createOrUpdateProject', async (req, res) => {
  try {
    const { projectId, content } = req.body;

    if (!projectId) {
      // If projectId is not provided, create a new project
      const newProjectId = new ObjectId();
      await projectsCollection.insertOne({ _id: newProjectId, userId: req.userId, content });
      res.status(200).json({ message: 'Project created', projectId: newProjectId });
    } else {
      // If projectId is provided, update the existing project
      await projectsCollection.updateOne({ _id: ObjectId(projectId), userId: req.userId }, { $set: { content } });
      res.status(200).json({ message: 'Project updated', projectId });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
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


// Retrieve a project based on its ID
app.get('/getProject/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await projectsCollection.findOne({ _id: ObjectId(projectId), userId: req.userId });

    if (project) {
      res.status(200).json({ message: 'Project retrieved', content: project.content });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
