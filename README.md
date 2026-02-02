# AI News Pusher

🤖 An intelligent news推送 application that delivers the latest artificial intelligence news and developments directly to your WhatsApp every morning at 8 AM.

![AI News Pusher](https://img.shields.io/badge/AI-News%20Pusher-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## ✨ Features

- **🤖 Automated AI News Collection**: Fetches latest AI news from multiple sources including TechCrunch, MIT Technology Review, and VentureBeat
- **📱 WhatsApp Delivery**: Sends curated news directly to your WhatsApp via Twilio
- **⏰ Scheduled Push**: Automatically delivers news every morning at 8:00 AM
- **🌐 Web Interface**: Clean, responsive web interface for subscription management
- **📊 News Sources**: Aggregates news from 3+ reliable tech news sources
- **🛡️ Reliability**: Automatic retry and error handling for message delivery

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Twilio account (free tier available)
- WhatsApp number configured in Twilio

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-news-pusher
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   PORT=3000
   TWILIO_ACCOUNT_SID=your_sid_here
   TWILIO_AUTH_TOKEN=your_token_here
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the web interface**
   Open http://localhost:3000 in your browser

## 📱 Setup Twilio WhatsApp

### Step 1: Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/) and sign up for a free account
2. Verify your phone number for WhatsApp sandbox

### Step 2: Configure WhatsApp Sandbox

1. Navigate to [Twilio Console](https://console.twilio.com)
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Note your WhatsApp sender number (usually `+14155238886`)
4. Join the WhatsApp sandbox by sending `join <sandbox-name>` to that number

### Step 3: Get Credentials

1. In Twilio Console, go to Account Info
2. Copy your Account SID and Auth Token
3. Add them to your `.env` file

## 🏗️ Project Structure

```
ai-news-pusher/
├── server.js                 # Main Express server
├── package.json              # Dependencies and scripts
├── .env.example              # Environment template
├── README.md                 # This file
├── services/
│   ├── newsService.js       # AI news fetching service
│   ├── whatsappService.js   # WhatsApp messaging service
│   └── scheduler.js         # Scheduled task handler
└── public/
    ├── index.html           # Main web interface
    ├── styles.css           # Frontend styles
    └── app.js               # Frontend JavaScript
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Yes | Twilio WhatsApp sender number |
| `NEWS_API_KEY` | No | NewsAPI key for additional sources |
| `APP_URL` | No | Your app's URL for unsubscribe links |

### News Sources

The app automatically fetches news from:

1. **TechCrunch** - Tech industry leader
2. **MIT Technology Review** - Academic and research focus
3. **VentureBeat** - Business and enterprise AI

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/news` | Get latest AI news |
| POST | `/api/subscribe` | Subscribe to news推送 |
| POST | `/api/unsubscribe` | Unsubscribe |
| GET | `/api/subscribers/count` | Get subscriber count |
| POST | `/api/push-now` | Trigger manual push (testing) |

### Subscribe Request
```json
POST /api/subscribe
{
  "phone": "+1234567890"
}
```

### Response
```json
{
  "success": true,
  "message": "Successfully subscribed to AI news updates"
}
```

## 🚀 Deployment to GitHub Codespace

### Step 1: Create GitHub Repository

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   echo "node_modules/" > .gitignore
   echo ".env" >> .gitignore
   git init
   git add .
   git commit -m "Initial commit: AI News Pusher"
   git remote add origin https://github.com/yourusername/ai-news-pusher.git
   git push -u origin main
   ```

### Step 2: Open in Codespace

1. Go to your repository on GitHub
2. Click the green "Code" button
3. Select "Open with Codespaces"
4. Click "New codespace"

### Step 3: Configure Codespace

1. Wait for the codespace to initialize
2. Open the terminal in Codespace
3. Install dependencies:
   ```bash
   npm install
   ```

4. Create environment file:
   ```bash
   cp .env.example .env
   ```

5. Configure your credentials in `.env`:
   - Add Twilio credentials
   - Optionally add NewsAPI key

### Step 4: Run the Application

1. Start the server:
   ```bash
   npm start
   ```

2. Codespace will show a URL like:
   ```
   https://yourname-ai-news-pusher-12345.devspaces.github.dev
   ```

3. This is your app's public URL!

### Step 5: Configure Port Forwarding (Automatic)

Codespace automatically forwards ports. Your app will be accessible at:
```
https://<codespace-name>-<port>.devspaces.github.dev
```

### Step 6: Update App URL

Update the `APP_URL` in `.env` to match your Codespace URL:
```env
APP_URL=https://yourname-ai-news-pusher-12345.devspaces.github.dev
```

Restart the server to apply changes.

## 📱 Usage Guide

### Subscribing

1. Open the web interface
2. Enter your WhatsApp number (with country code, without +)
3. Click "Subscribe"
4. You'll receive a welcome message on WhatsApp

### Receiving News

- News is sent automatically every day at 8:00 AM
- Messages include 5-10 top AI articles from the last 24 hours
- Each article includes title, source, time, and link

### Unsubscribing

1. Go to the Unsubscribe section
2. Enter your phone number
3. Click "Unsubscribe"

### Manual Push (Admin)

You can trigger a manual news push:
```bash
curl -X POST https://your-codespace-url/api/push-now
```

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

This uses nodemon for automatic restart on file changes.

### Adding New News Sources

Edit `services/newsService.js` and add a new fetch method:

```javascript
async fetchFromNewSource() {
    try {
        const response = await axios.get('https://new-source.com/feed');
        // Process and return articles
        return articles;
    } catch (error) {
        console.error('Error fetching from new source:', error);
        return [];
    }
}
```

Then add it to the `fetchLatestNews` method's Promise.allSettled call.

### Customizing Message Format

Edit the `formatForWhatsApp` method in `services/newsService.js`:

```javascript
formatForWhatsApp(news) {
    // Customize message format here
    let message = `🗞️ *Daily AI News* 🗞️\n\n`;
    // ... rest of formatting
    return message;
}
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` to version control
2. **Input Validation**: Phone numbers are validated before processing
3. **Rate Limiting**: Messages are sent in batches with delays to avoid rate limits
4. **HTTPS**: In production, ensure HTTPS is enabled

## 📊 Monitoring

### View Logs

```bash
# In Codespace terminal
npm start

# Check console output for:
# - News fetching status
# - Message delivery results
# - Error messages
```

### Check Subscriber Count

Visit: `https://your-codespace-url/api/subscribers/count`

## 🐛 Troubleshooting

### "WhatsApp not configured" Error

1. Check your `.env` file has all Twilio credentials
2. Verify credentials in Twilio Console
3. Restart the server after updating `.env`

### No News Articles

1. Check internet connectivity
2. Verify news sources are accessible
3. Check logs for specific errors

### Messages Not Delivered

1. Verify phone number format (E.164)
2. Check Twilio account balance
3. Verify WhatsApp sandbox is active

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues, please open a GitHub issue in the repository.

---

Built with ❤️ for AI enthusiasts everywhere