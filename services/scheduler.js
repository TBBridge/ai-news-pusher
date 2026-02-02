const cron = require('node-cron');
const newsService = require('./newsService');
const whatsappService = require('./whatsappService');

/**
 * Scheduler Service
 * Handles scheduled tasks for daily news push
 */
class SchedulerService {
  constructor() {
    this.cronJob = null;
    this.lastPushTime = null;
    this.isRunning = false;
  }

  /**
   * Initialize the scheduler
   * Runs daily at 8:00 AM
   */
  initialize() {
    // Schedule daily push at 8:00 AM
    this.cronJob = cron.schedule('0 8 * * *', async () => {
      console.log('⏰ Scheduled news push triggered at 8:00 AM');
      await this.executeDailyPush();
    });

    console.log('✅ Daily scheduler initialized for 8:00 AM');
    console.log('📅 Next push will be tomorrow at 8:00 AM');
  }

  /**
   * Execute daily news push
   */
  async executeDailyPush() {
    if (this.isRunning) {
      console.log('⚠️ Push already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🚀 Starting daily AI news push...');

      // Fetch latest news
      const news = await newsService.fetchLatestNews();
      
      if (news.length === 0) {
        console.log('No news to push today');
        this.isRunning = false;
        return;
      }

      // Format news for WhatsApp
      const message = newsService.formatForWhatsApp(news);

      // Get subscribers from server
      const subscribers = this.getSubscribers();

      if (subscribers.length === 0) {
        console.log('No subscribers to send news to');
        this.isRunning = false;
        return;
      }

      // Send to all subscribers
      const results = await whatsappService.sendToSubscribers(subscribers, message);

      this.lastPushTime = new Date();
      
      console.log(`✅ Daily push completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      console.log(\`📊 Results: \${results.success}/\${results.total} messages sent\`);

    } catch (error) {
      console.error('❌ Error during daily push:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manual push for testing
   * @param {Array} news - News articles to push
   */
  async manualPush(news) {
    if (this.isRunning) {
      throw new Error('Push already in progress');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🔧 Manual push triggered...');

      const message = newsService.formatForWhatsApp(news);
      const subscribers = this.getSubscribers();

      if (subscribers.length === 0) {
        console.log('No subscribers to send news to');
        this.isRunning = false;
        return { success: true, message: 'No subscribers found' };
      }

      const results = await whatsappService.sendToSubscribers(subscribers, message);
      this.lastPushTime = new Date();

      console.log(`✅ Manual push completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      
      this.isRunning = false;
      return results;

    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Get current subscribers
   * Note: In a production app, this should come from a database
   */
  getSubscribers() {
    // This will be populated from the server's subscribers array
    // For now, we'll access it through the server
    const app = require('../server');
    return app.locals.subscribers || [];
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      scheduled: true,
      cronExpression: '0 8 * * * (Daily at 8:00 AM)',
      nextRun: this.getNextRunTime(),
      lastRun: this.lastPushTime ? this.lastPushTime.toISOString() : null,
      isRunning: this.isRunning
    };
  }

  /**
   * Calculate next run time
   */
  getNextRunTime() {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(8, 0, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toISOString();
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('🛑 Scheduler stopped');
    }
  }

  /**
   * Restart the scheduler
   */
  restart() {
    this.stop();
    this.initialize();
    console.log('🔄 Scheduler restarted');
  }
}

module.exports = new SchedulerService();