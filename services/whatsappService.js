const twilio = require('twilio');

/**
 * WhatsApp Service
 * Handles sending messages via Twilio WhatsApp
 */
class WhatsAppService {
  constructor() {
    this.client = null;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.isConfigured = false;
    
    this.initialize();
  }

  /**
   * Initialize Twilio client
   */
  initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken && this.fromNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log('✅ WhatsApp service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize WhatsApp service:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.log('⚠️ WhatsApp not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables.');
      this.isConfigured = false;
    }
  }

  /**
   * Send a WhatsApp message
   * @param {string} to - Phone number in WhatsApp format (e.g., +1234567890)
   * @param {string} message - Message content
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(to, message) {
    if (!this.isConfigured) {
      console.log(`[MOCK] Would send to ${to}: ${message.substring(0, 50)}...`);
      return { sid: 'mock_' + Date.now(), status: 'mock' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`
      });

      console.log(`✅ Message sent to ${to}: ${result.sid}`);
      return result;
    } catch (error) {
      console.error(`❌ Error sending message to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Send news to multiple subscribers
   * @param {Array<string>} subscribers - Array of phone numbers
   * @param {string} message - Message content
   * @returns {Promise<Object>} Send results summary
   */
  async sendToSubscribers(subscribers, message) {
    const results = {
      success: 0,
      failed: 0,
      total: subscribers.length,
      details: []
    };

    console.log(`📱 Sending messages to ${subscribers.length} subscribers...`);

    // Send messages in batches to avoid rate limiting
    const batchSize = 10;
    const delayBetweenBatches = 1000; // 1 second

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(subscriber => this.sendMessage(subscriber, message))
      );

      batchResults.forEach((result, index) => {
        const subscriber = batch[index];
        if (result.status === 'fulfilled') {
          results.success++;
          results.details.push({
            phone: subscriber,
            status: 'success',
            sid: result.value.sid
          });
        } else {
          results.failed++;
          results.details.push({
            phone: subscriber,
            status: 'failed',
            error: result.reason.message
          });
        }
      });

      // Wait between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`📊 Send complete: ${results.success} successful, ${results.failed} failed`);
    return results;
  }

  /**
   * Verify phone number format
   * @param {string} phone - Phone number to verify
   * @returns {boolean} Is valid format
   */
  isValidPhoneNumber(phone) {
    // E.164 format: +[country code][number]
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      fromNumber: this.fromNumber ? this.fromNumber.substring(0, 10) + '...' : null
    };
  }
}

module.exports = new WhatsAppService();