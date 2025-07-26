import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PodcastMatchingService from '../services/PodcastMatchingService';
import VoiceControlService from '../services/VoiceControlService';

const DiscoverScreen = ({ navigation }) => {
  const [trendingPodcasts, setTrendingPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'comedy', name: 'Comedy', icon: 'sentiment-very-satisfied' },
    { id: 'news', name: 'News', icon: 'newspaper' },
    { id: 'technology', name: 'Tech', icon: 'computer' },
    { id: 'true-crime', name: 'Crime', icon: 'gavel' },
    { id: 'business', name: 'Business', icon: 'business-center' },
  ];

  useEffect(() => {
    loadTrendingPodcasts();
  }, []);

  const loadTrendingPodcasts = async () => {
    try {
      setLoading(true);
      const trending = await PodcastMatchingService.getTrendingPodcasts();
      setTrendingPodcasts(trending);
    } catch (error) {
      console.error('Error loading trending podcasts:', error);
      Alert.alert('Error', 'Could not load trending podcasts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrendingPodcasts();
    setRefreshing(false);
  };

  const playPodcast = async (podcast) => {
    try {
      await VoiceControlService.playPodcast(podcast);
      await PodcastMatchingService.addToHistory(podcast);
      navigation.navigate('Player');
    } catch (error) {
      Alert.alert('Error', 'Could not play this podcast');
    }
  };

  const searchByCategory = async (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      await loadTrendingPodcasts();
      return;
    }

    try {
      setLoading(true);
      const results = await PodcastMatchingService.searchPodcasts(category);
      setTrendingPodcasts(results);
    } catch (error) {
      console.error('Category search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive
      ]}
      onPress={() => searchByCategory(item.id)}
    >
      <Icon
        name={item.icon}
        size={20}
        color={selectedCategory === item.id ? 'white' : '#ff6b35'}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderPodcastItem = ({ item }) => (
    <TouchableOpacity
      style={styles.podcastCard}
      onPress={() => playPodcast(item)}
    >
      <View style={styles.podcastImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.podcastImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="podcasts" size={40} color="#666" />
          </View>
        )}
        <View style={styles.playOverlay}>
          <Icon name="play-arrow" size={30} color="white" />
        </View>
      </View>
      
      <View style={styles.podcastInfo}>
        <Text style={styles.podcastTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.podcastAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        
        <View style={styles.podcastMeta}>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceText}>
              {item.source === 'reddit' ? 'Reddit' : 
               item.source === 'trending' ? 'Trending' : 'Popular'}
            </Text>
          </View>
          
          {item.redditScore && (
            <View style={styles.redditScore}>
              <Icon name="arrow-upward" size={12} color="#ff6b35" />
              <Text style={styles.scoreText}>{item.redditScore}</Text>
            </View>
          )}
        </View>
        
        {item.description && (
          <Text style={styles.podcastDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b35" />
        <Text style={styles.loadingText}>Discovering trending podcasts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Trending Podcasts */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Trending Now' : `${categories.find(c => c.id === selectedCategory)?.name} Podcasts`}
          </Text>
          <TouchableOpacity onPress={onRefresh}>
            <Icon name="refresh" size={24} color="#ff6b35" />
          </TouchableOpacity>
        </View>

        {trendingPodcasts.length > 0 ? (
          <FlatList
            data={trendingPodcasts}
            renderItem={renderPodcastItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#ff6b35']}
                tintColor="#ff6b35"
              />
            }
            contentContainerStyle={styles.podcastList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="explore-off" size={60} color="#666" />
            <Text style={styles.emptyText}>No podcasts found</Text>
            <Text style={styles.emptySubtext}>
              Try a different category or refresh
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 15,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#ff6b35',
  },
  categoryItemActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  categoryText: {
    color: '#ff6b35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  podcastList: {
    paddingBottom: 20,
  },
  podcastCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  podcastImageContainer: {
    position: 'relative',
  },
  podcastImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    padding: 16,
  },
  podcastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  podcastAuthor: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  podcastMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceTag: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  sourceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  redditScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  podcastDescription: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default DiscoverScreen;
