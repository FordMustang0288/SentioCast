# Voice-Driven Podcast Player

A mobile podcast player app with voice control capabilities, inspired by Pocket Casts UI.

## Features

- Voice-driven interface with minimal manual interaction
- Discover podcasts based on user requests or similar content to liked podcasts
- Integration with Reddit for trending podcast mentions
- Pocket Casts-inspired UI with dark theme
- Background audio playback with variable speed control
- Natural language voice commands for podcast discovery and playback control

## Platform Support

### Android
This app can be built and run on Android from any development environment (Linux, macOS, Windows).

To run on Android:
```bash
npx react-native run-android
```

### iOS
iOS development requires a macOS system with Xcode installed. This app cannot be built or run on Linux or Windows systems.

To run on iOS (macOS only):
```bash
npx react-native run-ios
```

## Dependencies

All required dependencies are listed in `package.json`. To install:

```bash
npm install
```

## iOS-Specific Setup (macOS only)

1. Navigate to the iOS directory:
   ```bash
   cd ios
   ```

2. Install CocoaPods dependencies:
   ```bash
   pod install
   ```

3. Add required permissions to `Info.plist`:
   - Microphone usage description
   - Speech recognition usage description

4. Configure vector icons/fonts for iOS

## Voice Commands

The app supports various voice commands for hands-free operation:

- "Play [podcast name]" - Search and play a specific podcast
- "Find podcasts about [topic]" - Discover podcasts on a specific topic
- "Play next" / "Play previous" - Navigate between episodes
- "Pause" / "Resume" - Control playback
- "Skip forward" / "Skip backward" - Jump 30s/15s in the episode
- "Volume up" / "Volume down" - Adjust audio volume

## Architecture

The app is structured with the following key components:

- `HomeScreen` - Main screen with voice control button and recent podcasts
- `DiscoverScreen` - Trending podcasts and category filtering
- `LibraryScreen` - User's listening history
- `PlayerScreen` - Full-screen audio player with playback controls
- `VoiceControlService` - Speech recognition and text-to-speech
- `PodcastMatchingService` - Multi-source podcast search and matching
- `PlaybackService` - Background audio playback handling

## API Integration

The app integrates with:

- Reddit API for trending podcast mentions
- Listen Notes API for podcast leaderboards (optional)

API keys should be added to the appropriate service files.

## Data Storage

User listening history is stored locally using AsyncStorage.

## Troubleshooting

### Android

If you encounter build issues on Android, try:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### iOS (macOS only)

If you encounter build issues on iOS, try:

```bash
cd ios
rm -rf build
pod install
cd ..
npx react-native run-ios
```
