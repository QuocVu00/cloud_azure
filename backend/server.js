const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

const app = express();

/**
 * Middleware Setup
 */
app.use(cors({
    origin: '*', // Cho phép mọi nguồn (phù hợp để test local)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); 
app.use(express.json()); 

/**
 * API Route Definition
 */
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Health Check
 */
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Google Drive Mini API is running' });
});

/**
 * Server Execution
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
