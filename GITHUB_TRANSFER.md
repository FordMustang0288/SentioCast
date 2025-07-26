# GitHub Transfer Instructions

This document provides step-by-step instructions for transferring your Voice-Driven Podcast Player project to GitHub and then cloning it on your Mac.

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Fill in the repository details:
   - Repository name: `SentioCast`
   - Description: `Voice-driven podcast player app with Pocket Casts-inspired UI`
   - Public (as requested)
   - Do NOT initialize with a README (we already have one)
   - Do NOT add .gitignore or license (we already have our files)
3. Click "Create repository"

## Step 2: Push Local Repository to GitHub

Run these commands in your terminal on the Linux/WSL system:

```bash
# Navigate to your project directory
cd /home/erik/projects/voice-podcast-player

# Add the remote origin (replace FordMustang0288 with your actual GitHub username)
git remote add origin https://github.com/FordMustang0288/SentioCast.git

# Verify the remote was added correctly
git remote -v

# Push all branches to GitHub
git push -u origin --all

# Push all tags to GitHub (if any)
git push -u origin --tags
```

## Step 3: Clone Repository on Mac

On your Mac, run these commands:

```bash
# Clone the repository
git clone https://github.com/FordMustang0288/SentioCast.git

cd SentioCast

# Install Node dependencies
npm install

# Navigate to iOS directory
cd ios

# Install CocoaPods dependencies
pod install

# Return to project root
cd ..

# You're now ready to open the project in Xcode
# Open VoicePodcastPlayer.xcworkspace (NOT .xcodeproj) in Xcode
```

## Troubleshooting

### Authentication Issues

If you encounter authentication issues when pushing to GitHub, you may need to set up a Personal Access Token:

1. Go to GitHub Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with "repo" permissions
3. Use the token instead of your password when prompted

### Branch Name Issues

If you prefer to use "main" as your default branch instead of "master":

```bash
# Rename local master branch to main
git branch -m master main

# Push main branch and set upstream
git push -u origin main

# On GitHub, go to Settings > Branches and change the default branch to main

# Delete the master branch on GitHub
git push origin --delete master
```

## Repository Structure

After pushing, your GitHub repository will contain:

- All source code in `src/` directory
- iOS project files in `ios/` directory
- All documentation files (README.md, MAC_SETUP_CHECKLIST.md, etc.)
- Complete git history with all commits
- Package.json with all dependencies
- Configuration files (babel.config.js, metro.config.js, etc.)

## Next Steps

Once you've successfully pushed to GitHub and cloned on your Mac:

1. Follow the instructions in `NEXT_STEPS_ON_MAC.md` to set up the iOS development environment
2. Open the project in Xcode and build the app
3. Test all functionality, especially voice control features
4. Share the repository with friends if desired (it's public)

The complete project history and all documentation will be preserved in the GitHub repository, making it easy to continue development or share with others.
