import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const port = 3001;

app.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) throw new Error('Text is required');

    console.log('Generating TTS for:', text.substring(0, 50) + '...');
    
    const id = Date.now();
    const wavPath = path.resolve(`tmp-${id}.wav`);
    const mp3Path = path.resolve(`tmp-${id}.mp3`);
    
    // 1. Generate WAV using Windows Native TTS
    const psScript = `
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object -TypeName System.Speech.Synthesis.SpeechSynthesizer;
      $synth.SetOutputToWaveFile('${wavPath}');
      $synth.Speak('${text.replace(/'/g, "''")}');
      $synth.Dispose();
    `.replace(/\n/g, ' ');

    execSync(`powershell -Command "${psScript}"`);

    // 2. Convert to MP3 using FFmpeg
    execSync(`ffmpeg -i "${wavPath}" -acodec libmp3lame "${mp3Path}" -y`);

    // 3. Read and convert to base64
    const buffer = fs.readFileSync(mp3Path);
    const base64 = buffer.toString('base64');
    
    // Cleanup
    fs.unlinkSync(wavPath);
    fs.unlinkSync(mp3Path);

    res.json({ 
      success: true, 
      audioUrl: `data:audio/mp3;base64,${base64}` 
    });
  } catch (error) {
    console.error('TTS Generation failed:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/render', async (req, res) => {
  try {
    const { inputProps } = req.body;
    const id = Date.now();
    const entry = path.resolve('src/index.tsx');
    console.log(`[${id}] Bundling...`);
    const bundleLocation = await bundle({
      entryPoint: entry,
      publicDir: path.resolve('public'),
    });

    const compositions = await getCompositions(bundleLocation, { inputProps });
    const composition = compositions.find((c) => c.id === 'Reel');
    if (!composition) throw new Error('Composition "Reel" not found');

    const outputLocation = path.resolve(`out/video-${id}.mp4`);
    if (!fs.existsSync(path.resolve('out'))) fs.mkdirSync(path.resolve('out'));

    console.log(`[${id}] Rendering...`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      inputProps,
      codec: 'h264',
    });

    console.log(`[${id}] Success:`, outputLocation);
    res.json({ success: true, url: outputLocation });
  } catch (error) {
    console.error('Render failed:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Render server listening at http://localhost:${port}`);
});
