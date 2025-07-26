import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PodcastMatchingService from '../services/PodcastMatchingService';
import VoiceControlService from '../services/VoiceControlService';

const LibraryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const userHistory = PodcastMatchingService.getUserHistory();
    setHistory(sortHistory(userHistory, sortBy));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const sortHistory = (historyData, sortType) => {
    const sorted = [...historyData];
    
    switch (sortType) {
      case 'recent':
        return sorted.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
      case 'plays':
        return sorted.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
      case 'alphabetical':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  };

  const changeSortOrder = (newSortBy) => {
    setSortBy(newSortBy);
    setHistory(sortHistory(history, newSortBy));
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

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your listening history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await PodcastMatchingService.clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const formatLastPlayed = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderHistoryItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => playPodcast(item)}
    >
      <View style={styles.rankContainer}>
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </View>
      
      <View style={styles.podcastImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.podcastImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="podcasts" size={25} color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.podcastInfo}>
        <Text style={styles.podcastTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.podcastAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        
        <View style={styles.podcastMeta}>
          <View style={styles.metaItem}>
            <Icon name="play-circle-outline" size={14} color="#888" />
            <Text style={styles.metaText}>
              {item.playCount || 1} plays
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Icon name="access-time" size={14} color="#888" />
            <Text style={styles.metaText}>
              {formatLastPlayed(item.lastPlayed)}
            </Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => playPodcast(item)}
      >
        <Icon name="play-arrow" size={24} color="#ff6b35" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
        <TouchableOpacity onPress={clearHistory}>
          <Icon name="delete-outline" size={24} color="#ff6b35" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {history.length > 0 ? (
          <>
            <Text style={styles.statsText}>
              {history.length} podcasts • {history.reduce((sum, item) => sum + (item.playCount || 1), 0)} total plays
            </Text>
            
            <FlatList
              data={history}
              renderItem={renderHistoryItem}
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
              contentContainerStyle={styles.historyList}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="library-music" size={60} color="#666" />
            <Text style={styles.emptyText}>No listening history</Text>
            <Text style={styles.emptySubtext}>
              Start discovering podcasts to build your library
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={() => navigation.navigate('Discover')}
            >
              <Text style={styles.discoverButtonText}>Discover Podcasts</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  statsText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  podcastImageContainer: {
    marginRight: 15,
  },
  podcastImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    flex: 1,
  },
  podcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  podcastAuthor: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  podcastMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  playButton: {
    padding: 8,
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
    marginBottom: 20,
  },
  discoverButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LibraryScreen;
