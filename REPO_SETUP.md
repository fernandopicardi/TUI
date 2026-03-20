# Repository Setup Instructions

## Make repository private

1. Go to https://github.com/fernandopicardi/TUI/settings
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Select "Private"
5. Confirm

## Rename repository (recommended)

1. Go to https://github.com/fernandopicardi/TUI/settings
2. Under "Repository name", change "TUI" to "regent"
3. Click "Rename"
4. Update your local remote:
   ```bash
   git remote set-url origin https://github.com/fernandopicardi/regent.git
   ```

## Add .gitignore entries

Ensure these are in .gitignore:
- release/
- dist/
- node_modules/
- *.env
- .env.local
