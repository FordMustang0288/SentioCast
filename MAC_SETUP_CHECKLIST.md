# macOS Setup Checklist for iOS App

This checklist outlines the steps needed to build and run the Voice-Driven Podcast Player app on macOS for iOS development.

## Prerequisites

1. [ ] macOS system (10.15 or later recommended)
2. [ ] Xcode installed from the Mac App Store (12.0 or later)
3. [ ] Xcode command line tools installed
4. [ ] Node.js installed (16 or later)
5. [ ] npm or yarn installed
6. [ ] CocoaPods installed (`sudo gem install cocoapods`)

## Setup Steps

### 1. Verify Codebase
- [ ] Clone or copy the project to your Mac
- [ ] Ensure all files are present, especially:
  - [ ] `ios/` directory with all iOS project files
  - [ ] `src/` directory with all React Native components and services
  - [ ] `package.json` with all dependencies

### 2. Install Dependencies
- [ ] Navigate to project root directory
- [ ] Run `npm install` to install all Node.js dependencies

### 3. iOS-Specific Setup
- [ ] Navigate to `ios/` directory
- [ ] Run `pod install` to install CocoaPods dependencies
- [ ] Open `VoicePodcastPlayer.xcworkspace` (NOT .xcodeproj) in Xcode

### 4. Configure Permissions
- [ ] In Xcode, navigate to the project settings
- [ ] Add microphone usage description to `Info.plist`:
  - Key: `NSMicrophoneUsageDescription`
  - Value: "This app needs access to the microphone for voice commands."
- [ ] Add speech recognition usage description to `Info.plist`:
  - Key: `NSSpeechRecognitionUsageDescription`
  - Value: "This app needs access to speech recognition for voice commands."

### 5. Configure Vector Icons
- [ ] In Xcode, navigate to the project settings
- [ ] Go to "Build Phases" > "Copy Bundle Resources"
- [ ] Add the following font files from `node_modules/react-native-vector-icons/Fonts/`:
  - `MaterialIcons.ttf`
  - `Ionicons.ttf`
  - Any other icon font files used in the app

### 6. Build and Run
- [ ] Select a simulator or connected device in Xcode
- [ ] Build and run the app using Xcode (Cmd+R)
- [ ] Alternatively, from the command line in the project root:
  - Run `npx react-native run-ios`

## Troubleshooting

### Common Issues

1. **Podfile issues**: If you encounter issues with the Podfile, you may need to update it to match your React Native version.

2. **Permission errors**: Ensure all permissions are properly added to `Info.plist`.

3. **Font/icon issues**: Make sure all required font files are added to the Xcode project.

4. **Build failures**: Try cleaning the build folder:
   - In Xcode: Product > Clean Build Folder (Shift+Cmd+K)
   - Delete `ios/build` folder
   - Run `pod install` again in the `ios/` directory

### Testing Voice Features

1. **Simulator limitations**: The iOS simulator has limited support for speech recognition. For full testing, use a physical device.

2. **Microphone access**: Ensure the app has permission to access the microphone in the iOS Settings.

3. **Voice commands**: Test all voice commands listed in the main README.md.

## Next Steps

Once the app is running successfully on your Mac:

- [ ] Test all voice control features on a physical device
- [ ] Verify podcast discovery and playback functionality
- [ ] Test background audio playback
- [ ] Validate UI on different iOS device sizes
- [ ] Prepare for App Store deployment if desired
