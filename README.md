# ReelGen - Premium Reel Generator

A high-performance, local-first web application for generating viral social media reels.

## Features
- **9:16 Format**: Perfect for Instagram, TikTok, and YouTube Shorts.
- **Premium UI**: Glassmorphic dark theme with professional controls.
- **Local Rendering**: Real MP4 export via a dedicated Node.js render server.
- **Narrator Preview**: Integrated TTS to test your script's flow.
- **Customizable**: Backgrounds, colors, animations, and typography.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install FFmpeg**
   The video renderer requires FFmpeg to be installed on your system.
   - **Windows**: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/download.html).
   - **Mac**: `brew install ffmpeg`
   - **Linux**: `sudo apt install ffmpeg`

3. **Start the Application**
   Open two terminals:

   **Terminal 1 (Frontend):**
   ```bash
   npm run web
   ```
   *Access at http://localhost:5173*

   **Terminal 2 (Render Server):**
   ```bash
   npm run server
   ```
   *This handles the actual MP4 file generation.*

## Exporting
Click the **"Export High Quality MP4"** button in the UI. The processed video will be saved in the `out/` directory of the project.

## Development
To open the Remotion Studio (visual editor for the video component):
```bash
npm run dev
```
