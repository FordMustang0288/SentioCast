import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import VoiceControlService from '../services/VoiceControlService';
import PodcastMatchingService from '../services/PodcastMatchingService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false);
  const [recentPodcasts, setRecentPodcasts] = useState([]);
  const [voiceStatus, setVoiceStatus] = useState('Tap to speak');

  useEffect(() => {
    loadRecentPodcasts();
    PodcastMatchingService.initialize();
  }, []);

  const loadRecentPodcasts = async () => {
    const history = PodcastMatchingService.getUserHistory();
    setRecentPodcasts(history.slice(0, 5));
  };

  const handleVoicePress = async () => {
    if (isListening) {
      await VoiceControlService.stopListening();
      setIsListening(false);
      setVoiceStatus('Tap to speak');
    } else {
      setIsListening(true);
      setVoiceStatus('Listening...');
      await VoiceControlService.startListening();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (isListening) {
          VoiceControlService.stopListening();
          setIsListening(false);
          setVoiceStatus('Tap to speak');
        }
      }, 5000);
    }
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

  const renderPodcastItem = ({ item }) => (
    <TouchableOpacity
      style={styles.podcastItem}
      onPress={() => playPodcast(item)}
    >
      <View style={styles.podcastImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.podcastImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="podcasts" size={30} color="#666" />
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
          <Icon name="play-circle-outline" size={16} color="#888" />
          <Text style={styles.playCount}>
            {item.playCount || 1} plays
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.header}
      >
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.subtitle}>What would you like to listen to?</Text>
        
        {/* Voice Control Button */}
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoicePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isListening ? ['#ff6b35', '#ff8c42'] : ['#ff6b35', '#d63031']}
            style={styles.voiceButtonGradient}
          >
            <Icon
              name={isListening ? 'mic' : 'mic-none'}
              size={40}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={styles.voiceStatus}>{voiceStatus}</Text>
      </LinearGradient>

      {/* Recent Podcasts */}
      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Played</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Library')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentPodcasts.length > 0 ? (
          <FlatList
            data={recentPodcasts}
            renderItem={renderPodcastItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.podcastList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="podcasts" size={60} color="#666" />
            <Text style={styles.emptyText}>No recent podcasts</Text>
            <Text style={styles.emptySubtext}>
              Use voice commands to discover new content
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Discover')}
        >
          <Icon name="explore" size={24} color="#ff6b35" />
          <Text style={styles.quickActionText}>Discover</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('Library')}
        >
          <Icon name="library-music" size={24} color="#ff6b35" />
          <Text style={styles.quickActionText}>Library</Text>
        </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 30,
  },
  voiceButton: {
    marginBottom: 15,
  },
  voiceButtonGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  voiceStatus: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  seeAll: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '600',
  },
  podcastList: {
    paddingBottom: 20,
  },
  podcastItem: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  podcastImageContainer: {
    marginRight: 15,
  },
  podcastImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastInfo: {
    flex: 1,
    justifyContent: 'space-between',
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
  playCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionText: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    fontWeight: '500',
  },
});

export default HomeScreen;
