const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_BASE_URL = 'https://api.nasa.gov';

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'NASA Data Explorer API is running!' });
});

// Get Astronomy Picture of the Day
app.get('/api/apod', async (req, res) => {
    try {
        const { date } = req.query;
        const url = `${NASA_BASE_URL}/planetary/apod?api_key=${NASA_API_KEY}${date ? `&date=${date}` : ''}`;

        console.log('API Key loaded:', NASA_API_KEY ? 'Yes' : 'No');
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('APOD Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch Astronomy Picture of the Day' });
    }
});

// Get Mars Rover Photos - Updated for recent photos
app.get('/api/mars-photos', async (req, res) => {
    try {
        const { earth_date = '2024-01-15', rover = 'perseverance', camera } = req.query;
        let url = `${NASA_BASE_URL}/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earth_date}&api_key=${NASA_API_KEY}`;

        if (camera) {
            url += `&camera=${camera}`;
        }

        console.log('Fetching Mars photos for:', rover, 'on', earth_date);
        const response = await axios.get(url);

        // Fix image URLs to use HTTPS
        if (response.data && response.data.photos) {
            response.data.photos.forEach(photo => {
                if (photo.img_src && photo.img_src.startsWith('http://')) {
                    photo.img_src = photo.img_src.replace('http://', 'https://');
                }
            });
        }

        res.json(response.data);
    } catch (error) {
        console.error('Mars Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch Mars rover photos' });
    }
});


// Get Near Earth Objects
app.get('/api/neo', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const today = new Date().toISOString().split('T')[0];

        const url = `${NASA_BASE_URL}/neo/rest/v1/feed?start_date=${start_date || today}&end_date=${end_date || today}&api_key=${NASA_API_KEY}`;

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('NEO Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch Near Earth Objects data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});