const axios = require('axios');
const cheerio = require('cheerio');

/**
 * AI News Service
 * Fetches latest AI news from multiple sources
 */
class NewsService {
  constructor() {
    this.newsSources = [
      {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/',
        type: 'rss'
      },
      {
        name: 'MIT Technology Review AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence',
        type: 'html'
      },
      {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/',
        type: 'html'
      }
    ];
  }

  /**
   * Fetch latest AI news from all sources
   * @returns {Promise<Array>} Array of news articles
   */
  async fetchLatestNews() {
    const allNews = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    try {
      // Fetch from multiple sources concurrently
      const results = await Promise.allSettled([
        this.fetchFromTechCrunch(),
        this.fetchFromMITTechnologyReview(),
        this.fetchFromVentureBeat(),
        this.fetchFromNewsAPI()
      ]);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allNews.push(...result.value);
        } else {
          console.error(`Error fetching from source ${index}:`, result.reason.message);
        }
      });

      // Filter and sort news
      const filteredNews = allNews
        .filter(article => {
          // Filter articles from last 24 hours
          const articleDate = new Date(article.publishedAt);
          return articleDate >= yesterday && articleDate <= new Date();
        })
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 20); // Limit to 20 articles

      console.log(`Fetched ${filteredNews.length} AI news articles`);
      return filteredNews;

    } catch (error) {
      console.error('Error fetching news:', error);
      throw error;
    }
  }

  /**
   * Fetch news from TechCrunch
   */
  async fetchFromTechCrunch() {
    try {
      const response = await axios.get(
        'https://techcrunch.com/wp-json/wp/v2/posts?categories=149264&per_page=10',
        { timeout: 10000 }
      );

      return response.data.map(article => ({
        title: article.title.rendered,
        description: this.stripHtml(article.excerpt.rendered),
        url: article.link,
        source: 'TechCrunch',
        publishedAt: article.date,
        image: article._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
      }));
    } catch (error) {
      console.error('Error fetching from TechCrunch:', error.message);
      return [];
    }
  }

  /**
   * Fetch news from MIT Technology Review
   */
  async fetchFromMITTechnologyReview() {
    try {
      const response = await axios.get(
        'https://www.technologyreview.com/topic/artificial-intelligence',
        { timeout: 10000 }
      );

      const $ = cheerio.load(response.data);
      const articles = [];

      $('article').each((i, elem) => {
        if (i < 5) { // Limit to 5 articles
          const title = $(elem).find('h2 a, h3 a').first().text().trim();
          const url = $(elem).find('h2 a, h3 a').first().attr('href');
          const excerpt = $(elem).find('.excerpt, p').first().text().trim();
          const publishedAt = $(elem).find('time').attr('datetime') || new Date().toISOString();

          if (title && url) {
            articles.push({
              title,
              description: excerpt || 'Click to read more about this AI story',
              url: url.startsWith('http') ? url : `https://www.technologyreview.com${url}`,
              source: 'MIT Technology Review',
              publishedAt,
              image: null
            });
          }
        }
      });

      return articles;
    } catch (error) {
      console.error('Error fetching from MIT Technology Review:', error.message);
      return [];
    }
  }

  /**
   * Fetch news from VentureBeat
   */
  async fetchFromVentureBeat() {
    try {
      const response = await axios.get(
        'https://venturebeat.com/category/ai/feed/',
        { timeout: 10000 }
      );

      const $ = cheerio.load(response.data, {
        xmlMode: true
      });

      const articles = [];

      $('item').each((i, elem) => {
        if (i < 5) { // Limit to 5 articles
          const title = $(elem).find('title').text();
          const url = $(elem).find('link').text();
          const description = $(elem).find('description').text();
          const publishedAt = $(elem).find('pubDate').text();

          if (title && url) {
            articles.push({
              title,
              description: this.stripHtml(description).substring(0, 200),
              url,
              source: 'VentureBeat',
              publishedAt: new Date(publishedAt).toISOString(),
              image: null
            });
          }
        }
      });

      return articles;
    } catch (error) {
      console.error('Error fetching from VentureBeat:', error.message);
      return [];
    }
  }

  /**
   * Fetch news from NewsAPI (if API key is available)
   */
  async fetchFromNewsAPI() {
    const apiKey = process.env.NEWS_API_KEY;
    
    if (!apiKey) {
      console.log('NewsAPI key not configured, skipping');
      return [];
    }

    try {
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=artificial+intelligence+OR+AI+OR+machine+learning&language=en&sortBy=publishedAt&pageSize=10`,
        {
          headers: { 'X-Api-Key': apiKey },
          timeout: 10000
        }
      );

      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description || 'Click to read more',
        url: article.url,
        source: article.source.name || 'NewsAPI',
        publishedAt: article.publishedAt,
        image: article.urlToImage
      }));
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error.message);
      return [];
    }
  }

  /**
   * Strip HTML tags from string
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Format news for WhatsApp message
   */
  formatForWhatsApp(news) {
    if (news.length === 0) {
      return 'No AI news articles found in the last 24 hours. 😔\n\nCheck back tomorrow for the latest updates!';
    }

    let message = `🗞️ *Daily AI News Update* 🗞️\n\n`;
    message += `📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    message += `📊 *${news.length} articles from the last 24 hours*\n\n`;
    message += `_Tip: Click links to read full articles_\n\n`;

    news.forEach((article, index) => {
      const number = `${index + 1}.`;
      const title = article.title.length > 80 ? article.title.substring(0, 77) + '...' : article.title;
      const source = `📰 ${article.source}`;
      const time = this.formatTimeAgo(article.publishedAt);
      
      message += `${number} *${title}*\n`;
      message += `${source} • ${time}\n`;
      message += `🔗 ${article.url}\n\n`;
    });

    message += `---\n`;
    message += `🤖 *AI News Pusher*\n`;
    message += `To unsubscribe, visit: ${process.env.APP_URL || 'https://your-app-url.com'}/unsubscribe`;

    return message;
  }

  /**
   * Format time ago for display
   */
  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }
}

module.exports = new NewsService();