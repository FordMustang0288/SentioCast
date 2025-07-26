import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import TrackPlayer from 'react-native-track-player';
import PodcastMatchingService from './PodcastMatchingService';
import { Alert } from 'react-native';

class VoiceControlService {
  constructor() {
    this.isListening = false;
    this.voiceCommands = {
      play: ['play', 'start', 'resume'],
      pause: ['pause', 'stop'],
      next: ['next', 'skip', 'forward'],
      previous: ['previous', 'back', 'last'],
      search: ['find', 'search', 'look for', 'play something about'],
      volume: ['volume', 'louder', 'quieter'],
    };
  }

  initialize() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;

    // Configure TTS
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
  }

  onSpeechStart = (e) => {
    console.log('Voice recognition started');
    this.isListening = true;
  };

  onSpeechRecognized = (e) => {
    console.log('Voice recognized');
  };

  onSpeechEnd = (e) => {
    console.log('Voice recognition ended');
    this.isListening = false;
  };

  onSpeechError = (e) => {
    console.log('Voice recognition error:', e.error);
    this.isListening = false;
  };

  onSpeechResults = (e) => {
    console.log('Voice results:', e.value);
    if (e.value && e.value.length > 0) {
      this.processVoiceCommand(e.value[0]);
    }
  };

  onSpeechPartialResults = (e) => {
    console.log('Partial results:', e.value);
  };

  async startListening() {
    try {
      if (!this.isListening) {
        await Voice.start('en-US');
      }
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  }

  async stopListening() {
    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  async processVoiceCommand(command) {
    const lowerCommand = command.toLowerCase();
    console.log('Processing command:', lowerCommand);

    try {
      // Basic playback controls
      if (this.containsWords(lowerCommand, this.voiceCommands.play)) {
        await TrackPlayer.play();
        this.speak('Playing');
        return;
      }

      if (this.containsWords(lowerCommand, this.voiceCommands.pause)) {
        await TrackPlayer.pause();
        this.speak('Paused');
        return;
      }

      if (this.containsWords(lowerCommand, this.voiceCommands.next)) {
        await TrackPlayer.skipToNext();
        this.speak('Next episode');
        return;
      }

      if (this.containsWords(lowerCommand, this.voiceCommands.previous)) {
        await TrackPlayer.skipToPrevious();
        this.speak('Previous episode');
        return;
      }

      // Search commands
      if (this.containsWords(lowerCommand, this.voiceCommands.search)) {
        await this.handleSearchCommand(lowerCommand);
        return;
      }

      // Volume commands
      if (this.containsWords(lowerCommand, ['louder', 'volume up'])) {
        await TrackPlayer.setVolume(Math.min(1.0, (await TrackPlayer.getVolume()) + 0.2));
        this.speak('Volume up');
        return;
      }

      if (this.containsWords(lowerCommand, ['quieter', 'volume down'])) {
        await TrackPlayer.setVolume(Math.max(0.0, (await TrackPlayer.getVolume()) - 0.2));
        this.speak('Volume down');
        return;
      }

      // If no command matched, treat as search
      await this.handleSearchCommand(lowerCommand);

    } catch (error) {
      console.error('Error processing voice command:', error);
      this.speak('Sorry, I couldn\'t process that command');
    }
  }

  async handleSearchCommand(command) {
    // Extract search terms from command
    let searchTerms = command;
    
    // Remove common command words
    const commandWords = ['find', 'search', 'look for', 'play something about', 'play', 'show me'];
    commandWords.forEach(word => {
      searchTerms = searchTerms.replace(new RegExp(word, 'gi'), '').trim();
    });

    if (searchTerms.length === 0) {
      this.speak('What would you like me to search for?');
      return;
    }

    this.speak(`Searching for ${searchTerms}`);
    
    try {
      const results = await PodcastMatchingService.searchPodcasts(searchTerms);
      if (results && results.length > 0) {
        // Play the first result
        const podcast = results[0];
        await this.playPodcast(podcast);
        this.speak(`Playing ${podcast.title}`);
      } else {
        this.speak('Sorry, I couldn\'t find any podcasts matching that search');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.speak('Sorry, there was an error searching for podcasts');
    }
  }

  async playPodcast(podcast) {
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: podcast.id,
        url: podcast.audioUrl,
        title: podcast.title,
        artist: podcast.author,
        artwork: podcast.image,
        duration: podcast.duration,
      });
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing podcast:', error);
      throw error;
    }
  }

  containsWords(text, words) {
    return words.some(word => text.includes(word));
  }

  speak(text) {
    Tts.speak(text);
  }

  destroy() {
    Voice.destroy().then(Voice.removeAllListeners);
  }
}

export default new VoiceControlService();
