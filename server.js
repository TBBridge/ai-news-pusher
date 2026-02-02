const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import services
const newsService = require('./services/newsService');
const whatsappService = require('./services/whatsappService');
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store subscribed users
let subscribers = [];

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get latest AI news
app.get('/api/news', async (req, res) => {
  try {
    const news = await newsService.fetchLatestNews();
    res.json({ success: true, news, count: news.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subscribe to WhatsApp推送
app.post('/api/subscribe', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' });
    }
    
    // Check if already subscribed
    if (subscribers.includes(phone)) {
      return res.status(400).json({ success: false, error: 'This number is already subscribed' });
    }
    
    // Add to subscribers list
    subscribers.push(phone);
    
    // Send welcome message
    await whatsappService.sendMessage(phone, `Welcome to AI News Pusher! 🗞️\n\nYou'll receive daily AI news updates every morning at 8 AM.\n\nStay tuned for the latest artificial intelligence developments!`);
    
    res.json({ success: true, message: 'Successfully subscribed to AI news updates' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unsubscribe from推送
app.post('/api/unsubscribe', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    const index = subscribers.indexOf(phone);
    if (index > -1) {
      subscribers.splice(index, 1);
      res.json({ success: true, message: 'Successfully unsubscribed from AI news updates' });
    } else {
      res.status(404).json({ success: false, error: 'Phone number not found in subscribers' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subscriber count
app.get('/api/subscribers/count', (req, res) => {
  res.json({ count: subscribers.length });
});

// Manually trigger news push (for testing)
app.post('/api/push-now', async (req, res) => {
  try {
    const news = await newsService.fetchLatestNews();
    await scheduler.manualPush(news);
    res.json({ success: true, message: `News pushed to ${subscribers.length} subscribers` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI News Pusher server running on port ${PORT}`);
  console.log(`📱 WhatsApp subscription service active`);
  console.log(`⏰ Daily push scheduled for 8:00 AM`);
  
  // Initialize scheduler
  scheduler.initialize();
  
  // Log subscriber count
  console.log(`👥 Current subscribers: ${subscribers.length}`);
});

// Export for testing
module.exports = app;