# Next Steps When Moving to macOS

## Immediate Actions

1. **Transfer Project Files**
   - Copy the entire project directory to your Mac
   - Ensure all files are transferred correctly, especially:
     - `ios/` directory
     - `src/` directory
     - `package.json`
     - All configuration files

2. **Install Prerequisites**
   - Install Xcode from the Mac App Store
   - Install Xcode command line tools: `xcode-select --install`
   - Ensure Node.js is installed (version 16 or later)
   - Install CocoaPods: `sudo gem install cocoapods`

3. **Setup and Build**
   - Navigate to project root
   - Run `npm install`
   - Navigate to `ios/` directory
   - Run `pod install`
   - Open `VoicePodcastPlayer.xcworkspace` in Xcode

## Critical Configuration Steps

1. **Add Permissions to Info.plist**
   - Open `ios/VoicePodcastPlayer/Info.plist` in Xcode
   - Add microphone usage description:
     - Key: `NSMicrophoneUsageDescription`
     - Value: "This app needs access to the microphone for voice commands."
   - Add speech recognition usage description:
     - Key: `NSSpeechRecognitionUsageDescription`
     - Value: "This app needs access to speech recognition for voice commands."

2. **Configure Vector Icons**
   - In Xcode, select the project target
   - Go to "Build Phases" > "Copy Bundle Resources"
   - Add required font files from `node_modules/react-native-vector-icons/Fonts/`

## First Build and Test

1. **Build in Xcode**
   - Select a simulator (iPhone 14 or newer recommended)
   - Click the "Run" button or press Cmd+R

2. **Command Line Alternative**
   - From project root, run: `npx react-native run-ios`

## Expected Results

After completing these steps, you should have:

- A fully compiled iOS app running in the simulator
- Access to all UI screens via bottom tab navigation
- Voice control functionality (limited in simulator, full on physical device)
- Podcast discovery and playback features
- Background audio playback

## Troubleshooting Quick Reference

If you encounter issues:

1. **Podfile errors**: Check that the Podfile is compatible with your React Native version
2. **Permission crashes**: Ensure all required permissions are added to Info.plist
3. **Icon/font issues**: Verify all required font files are added to Xcode
4. **Build failures**: Clean build folder and re-run `pod install`

## Testing on Physical Device

For full voice functionality testing:

1. Connect an iOS device to your Mac
2. Select the device as the build target in Xcode
3. Ensure the device is trusted for development
4. Build and run the app
5. Test all voice commands in a quiet environment

## Timeline Estimate

The initial setup and first successful build should take approximately 30-60 minutes, depending on:
- Internet speed (for any additional downloads)
- Mac performance
- Xcode installation time (if not already installed)

Once the initial build is successful, subsequent builds will be much faster.
