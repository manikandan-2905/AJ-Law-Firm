require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const clientRoutes = require('./routes/clients');
const documentRoutes = require('./routes/documents');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// The user provided MONGO_URI in plain text in the prompt, but we should use process.env if available, falling back to the plain text if not strictly configured in .env yet.
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://mani:mani123@image-generator.x56ji.mongodb.net/?appName=Image-generator";

mongoose.connect(MONGODB_URI, {
    // useNewUrlParser and useUnifiedTopology are deprecated in latest drivers, but keeping standard connection
})
.then(() => console.log('✅ Connected to MongoDB Backend Database Successfully!'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);

// Base route for health check
app.get('/', (req, res) => {
    res.send('AJ Law Firm API Backend is running!');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
