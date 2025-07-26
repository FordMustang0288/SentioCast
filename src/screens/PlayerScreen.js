import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Slider,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import TrackPlayer, { useTrackPlayerEvents, Event } from 'react-native-track-player';
import VoiceControlService from '../services/VoiceControlService';

const { width } = Dimensions.get('window');

const PlayerScreen = ({ navigation }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackState) {
      setIsPlaying(event.state === 'playing');
    }
    
    if (event.type === Event.PlaybackTrackChanged) {
      const track = await TrackPlayer.getCurrentTrack();
      if (track) {
        const trackObject = await TrackPlayer.getTrack(track);
        setCurrentTrack(trackObject);
      }
    }
  });

  useEffect(() => {
    setupPlayer();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  const setupPlayer = async () => {
    try {
      const track = await TrackPlayer.getCurrentTrack();
      if (track) {
        const trackObject = await TrackPlayer.getTrack(track);
        setCurrentTrack(trackObject);
        
        const playerPosition = await TrackPlayer.getPosition();
        const playerDuration = await TrackPlayer.getDuration();
        
        setPosition(playerPosition);
        setDuration(playerDuration);
        
        const state = await TrackPlayer.getState();
        setIsPlaying(state === 'playing');
      }
    } catch (error) {
      console.error('Setup player error:', error);
    }
  };

  const updateProgress = async () => {
    try {
      const playerPosition = await TrackPlayer.getPosition();
      const playerDuration = await TrackPlayer.getDuration();
      
      setPosition(playerPosition);
      setDuration(playerDuration);
    } catch (error) {
      // Player might not be ready
    }
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not control playback');
    }
  };

  const seekTo = async (value) => {
    try {
      await TrackPlayer.seekTo(value);
      setPosition(value);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  const skipForward = async () => {
    try {
      const newPosition = Math.min(position + 30, duration);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Skip forward error:', error);
    }
  };

  const skipBackward = async () => {
    try {
      const newPosition = Math.max(position - 15, 0);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Skip backward error:', error);
    }
  };

  const changePlaybackRate = async () => {
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    
    try {
      await TrackPlayer.setRate(nextRate);
      setPlaybackRate(nextRate);
    } catch (error) {
      console.error('Rate change error:', error);
    }
  };

  const handleVoicePress = async () => {
    if (isListening) {
      await VoiceControlService.stopListening();
      setIsListening(false);
    } else {
      setIsListening(true);
      await VoiceControlService.startListening();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (isListening) {
          VoiceControlService.stopListening();
          setIsListening(false);
        }
      }, 5000);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="music-off" size={60} color="#666" />
        <Text style={styles.emptyText}>No podcast playing</Text>
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => navigation.navigate('Discover')}
        >
          <Text style={styles.discoverButtonText}>Discover Podcasts</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="keyboard-arrow-down" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <TouchableOpacity>
          <Icon name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View style={styles.artworkContainer}>
        {currentTrack.artwork ? (
          <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
        ) : (
          <View style={styles.placeholderArtwork}>
            <Icon name="podcasts" size={80} color="#666" />
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {currentTrack.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Slider
          style={styles.progressBar}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={seekTo}
          minimumTrackTintColor="#ff6b35"
          maximumTrackTintColor="#333"
          thumbStyle={styles.sliderThumb}
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Main Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
          <Icon name="replay-15" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          <LinearGradient
            colors={['#ff6b35', '#d63031']}
            style={styles.playButtonGradient}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play-arrow'}
              size={40}
              color="white"
            />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
          <Icon name="forward-30" size={32} color="white" />
        </TouchableOpacity>
      </View>

      {/* Secondary Controls */}
      <View style={styles.secondaryControls}>
        <TouchableOpacity style={styles.secondaryButton} onPress={changePlaybackRate}>
          <Text style={styles.rateText}>{playbackRate}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
          onPress={handleVoicePress}
        >
          <Icon
            name={isListening ? 'mic' : 'mic-none'}
            size={24}
            color={isListening ? '#ff6b35' : 'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Icon name="queue-music" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Voice Status */}
      {isListening && (
        <View style={styles.voiceStatus}>
          <Text style={styles.voiceStatusText}>Listening for voice commands...</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '600',
  },
  discoverButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  discoverButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  artwork: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  placeholderArtwork: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBar: {
    flex: 1,
    height: 40,
    marginHorizontal: 15,
  },
  sliderThumb: {
    backgroundColor: '#ff6b35',
    width: 20,
    height: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    padding: 15,
    marginHorizontal: 20,
  },
  playButton: {
    marginHorizontal: 30,
  },
  playButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  secondaryButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  rateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  voiceButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  voiceStatus: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  voiceStatusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PlayerScreen;
