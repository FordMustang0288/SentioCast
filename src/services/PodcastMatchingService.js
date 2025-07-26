import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Fuse from 'fuse.js';

class PodcastMatchingService {
  constructor() {
    this.redditBaseUrl = 'https://www.reddit.com/r';
    this.podcastIndexUrl = 'https://api.podcastindex.org/api/1.0';
    this.listenNotesUrl = 'https://listen-api.listennotes.com/api/v2';
    this.userHistory = [];
    this.trendingCache = null;
    this.cacheExpiry = 3600000; // 1 hour
  }

  async initialize() {
    await this.loadUserHistory();
  }

  async searchPodcasts(query) {
    try {
      // Combine multiple sources for comprehensive search
      const [historyResults, trendingResults, redditResults] = await Promise.all([
        this.searchUserHistory(query),
        this.searchTrendingPodcasts(query),
        this.searchRedditMentions(query)
      ]);

      // Merge and rank results
      const allResults = [
        ...historyResults.map(r => ({ ...r, source: 'history', score: r.score + 0.3 })),
        ...trendingResults.map(r => ({ ...r, source: 'trending', score: r.score + 0.2 })),
        ...redditResults.map(r => ({ ...r, source: 'reddit', score: r.score + 0.1 }))
      ];

      // Remove duplicates and sort by score
      const uniqueResults = this.removeDuplicates(allResults);
      return uniqueResults.sort((a, b) => b.score - a.score).slice(0, 10);

    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async searchUserHistory(query) {
    if (this.userHistory.length === 0) return [];

    const fuse = new Fuse(this.userHistory, {
      keys: ['title', 'description', 'author', 'categories'],
      threshold: 0.4,
      includeScore: true
    });

    const results = fuse.search(query);
    return results.map(result => ({
      ...result.item,
      score: 1 - result.score // Invert score (lower is better in Fuse.js)
    }));
  }

  async searchTrendingPodcasts(query) {
    try {
      const trending = await this.getTrendingPodcasts();
      
      const fuse = new Fuse(trending, {
        keys: ['title', 'description', 'author', 'categories'],
        threshold: 0.5,
        includeScore: true
      });

      const results = fuse.search(query);
      return results.map(result => ({
        ...result.item,
        score: 1 - result.score
      }));

    } catch (error) {
      console.error('Trending search error:', error);
      return [];
    }
  }

  async searchRedditMentions(query) {
    try {
      const subreddits = ['podcasts', 'podcasting', 'serialpodcast', 'truecrimepodcasts'];
      const redditResults = [];

      for (const subreddit of subreddits) {
        try {
          const response = await axios.get(
            `${this.redditBaseUrl}/${subreddit}/search.json`,
            {
              params: {
                q: query,
                sort: 'relevance',
                limit: 10,
                t: 'month'
              },
              headers: {
                'User-Agent': 'VoicePodcastPlayer/1.0'
              }
            }
          );

          if (response.data && response.data.data && response.data.data.children) {
            const posts = response.data.data.children;
            
            for (const post of posts) {
              const postData = post.data;
              const podcastInfo = this.extractPodcastFromRedditPost(postData, query);
              if (podcastInfo) {
                redditResults.push({
                  ...podcastInfo,
                  redditScore: postData.score,
                  redditComments: postData.num_comments
                });
              }
            }
          }
        } catch (subredditError) {
          console.log(`Error searching ${subreddit}:`, subredditError.message);
        }
      }

      return redditResults;

    } catch (error) {
      console.error('Reddit search error:', error);
      return [];
    }
  }

  extractPodcastFromRedditPost(postData, query) {
    const title = postData.title.toLowerCase();
    const selftext = (postData.selftext || '').toLowerCase();
    const queryLower = query.toLowerCase();

    // Look for podcast indicators
    const podcastIndicators = ['podcast', 'episode', 'listen', 'audio', 'show'];
    const hasIndicator = podcastIndicators.some(indicator => 
      title.includes(indicator) || selftext.includes(indicator)
    );

    if (!hasIndicator) return null;

    // Extract potential podcast name
    let podcastName = postData.title;
    
    // Clean up common Reddit formatting
    podcastName = podcastName.replace(/\[.*?\]/g, '').trim();
    podcastName = podcastName.replace(/\(.*?\)/g, '').trim();

    // Calculate relevance score
    const titleRelevance = this.calculateRelevance(title, queryLower);
    const textRelevance = this.calculateRelevance(selftext, queryLower);
    const score = Math.max(titleRelevance, textRelevance) * 0.8; // Reddit results get lower base score

    return {
      id: `reddit_${postData.id}`,
      title: podcastName,
      description: postData.selftext || postData.title,
      author: 'Unknown',
      image: postData.thumbnail && postData.thumbnail.startsWith('http') ? postData.thumbnail : null,
      audioUrl: null, // Will need to be resolved later
      duration: null,
      categories: ['reddit-mentioned'],
      score: score,
      redditUrl: `https://reddit.com${postData.permalink}`
    };
  }

  calculateRelevance(text, query) {
    const words = query.split(' ');
    let matches = 0;
    
    words.forEach(word => {
      if (text.includes(word)) {
        matches++;
      }
    });
    
    return matches / words.length;
  }

  async getTrendingPodcasts() {
    // Check cache first
    if (this.trendingCache && Date.now() - this.trendingCache.timestamp < this.cacheExpiry) {
      return this.trendingCache.data;
    }

    try {
      // Try multiple sources for trending podcasts
      const trending = await this.fetchFromMultipleSources();
      
      // Cache the results
      this.trendingCache = {
        data: trending,
        timestamp: Date.now()
      };

      return trending;

    } catch (error) {
      console.error('Error fetching trending podcasts:', error);
      return this.getFallbackTrending();
    }
  }

  async fetchFromMultipleSources() {
    const sources = [];

    // Try Listen Notes API (requires API key)
    try {
      const listenNotesResponse = await axios.get(`${this.listenNotesUrl}/best_podcasts`, {
        headers: {
          'X-ListenAPI-Key': 'YOUR_LISTEN_NOTES_API_KEY' // User needs to add this
        },
        params: {
          region: 'us',
          safe_mode: 1
        }
      });
      
      if (listenNotesResponse.data && listenNotesResponse.data.podcasts) {
        sources.push(...listenNotesResponse.data.podcasts.map(this.formatListenNotesPodcast));
      }
    } catch (error) {
      console.log('Listen Notes API error (API key needed):', error.message);
    }

    // Add fallback trending data if no API results
    if (sources.length === 0) {
      sources.push(...this.getFallbackTrending());
    }

    return sources;
  }

  formatListenNotesPodcast(podcast) {
    return {
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      author: podcast.publisher,
      image: podcast.image,
      audioUrl: null, // Episodes would have audio URLs
      duration: null,
      categories: podcast.genre_ids || [],
      score: 0.8 // High base score for trending
    };
  }

  getFallbackTrending() {
    // Fallback trending podcasts when APIs are unavailable
    return [
      {
        id: 'fallback_1',
        title: 'The Joe Rogan Experience',
        description: 'Long form conversations with interesting people',
        author: 'Joe Rogan',
        image: null,
        audioUrl: null,
        categories: ['comedy', 'interview'],
        score: 0.9
      },
      {
        id: 'fallback_2',
        title: 'Serial',
        description: 'Investigative journalism podcast',
        author: 'Sarah Koenig',
        image: null,
        audioUrl: null,
        categories: ['true-crime', 'journalism'],
        score: 0.85
      },
      {
        id: 'fallback_3',
        title: 'This American Life',
        description: 'Stories of American life',
        author: 'Ira Glass',
        image: null,
        audioUrl: null,
        categories: ['storytelling', 'culture'],
        score: 0.8
      }
    ];
  }

  removeDuplicates(results) {
    const seen = new Set();
    return results.filter(result => {
      const key = result.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async addToHistory(podcast) {
    try {
      // Add timestamp and play count
      const historyItem = {
        ...podcast,
        lastPlayed: Date.now(),
        playCount: 1
      };

      // Check if already in history
      const existingIndex = this.userHistory.findIndex(item => item.id === podcast.id);
      
      if (existingIndex >= 0) {
        // Update existing entry
        this.userHistory[existingIndex] = {
          ...this.userHistory[existingIndex],
          lastPlayed: Date.now(),
          playCount: (this.userHistory[existingIndex].playCount || 0) + 1
        };
      } else {
        // Add new entry
        this.userHistory.unshift(historyItem);
        
        // Keep only last 100 items
        if (this.userHistory.length > 100) {
          this.userHistory = this.userHistory.slice(0, 100);
        }
      }

      await this.saveUserHistory();

    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  async loadUserHistory() {
    try {
      const historyJson = await AsyncStorage.getItem('podcast_history');
      if (historyJson) {
        this.userHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('Error loading history:', error);
      this.userHistory = [];
    }
  }

  async saveUserHistory() {
    try {
      await AsyncStorage.setItem('podcast_history', JSON.stringify(this.userHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  getUserHistory() {
    return this.userHistory;
  }

  async clearHistory() {
    this.userHistory = [];
    await AsyncStorage.removeItem('podcast_history');
  }
}

export default new PodcastMatchingService();
