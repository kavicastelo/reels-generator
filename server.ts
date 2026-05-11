import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, getCompositions } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import ollama from 'ollama';
import { NarratorService } from './api/services/narrator.service';
import { TTSService } from './api/services/tts.service';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));
app.use('/public', express.static('public'));

const port = 3001;

app.post('/generate-script', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) throw new Error('Topic is required');

    console.log('Generating script for topic:', topic);

    const response = await ollama.chat({
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content: 'You are a viral social media scriptwriter. Generate a 3-scene script for a short reel. Return only JSON with keys "hook", "value", and "cta". Each value should be a single punchy sentence.',
        },
        {
          role: 'user',
          content: `Topic: ${topic}`,
        },
      ],
      format: 'json',
    });

    const scriptData = JSON.parse(response.message.content);
    const scriptText = `${scriptData.hook}\n${scriptData.value}\n${scriptData.cta}`;

    res.json({ success: true, script: scriptText });
  } catch (error) {
    console.error('Script generation failed:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/analyze-script', async (req, res) => {
  try {
    const { text } = req.body;
    const analysis = await NarratorService.analyzeScript(text);
    res.json({ success: true, ...analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/tts-advanced', async (req, res) => {
  try {
    const { text, voiceProfile, options } = req.body;
    if (!text) throw new Error('Text is required');

    console.log('Generating Advanced TTS for voice:', voiceProfile, 'with options:', options);
    const result = await TTSService.generateCinematicAudio(text, voiceProfile || 'default', options);

    res.json({ 
      success: true, 
      audioUrl: result.audioUrl,
      timings: result.timings 
    });
  } catch (error) {
    console.error('Advanced TTS Generation failed:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) throw new Error('Text is required');

    console.log('Generating TTS for:', text.substring(0, 50) + '...');
    
    const id = Date.now();
    const wavPath = path.resolve(`tmp-${id}.wav`);
    const mp3Path = path.resolve(`tmp-${id}.mp3`);
    const timingPath = path.resolve(`tmp-${id}.json`);
    
    // 1. Generate WAV using Windows Native TTS with Progress Tracking
    const normalizedText = text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\.\s+\./g, '.')
      .trim();

    const textBase64 = Buffer.from(normalizedText).toString('base64');
    
    // This script captures the audio position of each word.
    // We'll use the position of the first word of each sentence to estimate scene boundaries.
    const psScript = `
      $ProgressPreference = 'SilentlyContinue';
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object -TypeName System.Speech.Synthesis.SpeechSynthesizer;
      $synth.SetOutputToWaveFile('${wavPath}');
      
      $timings = New-Object System.Collections.Generic.List[PSObject];
      $handler = {
          param($sender, $e);
          $timings.Add([PSCustomObject]@{
              Text = $e.Text;
              Offset = $e.AudioPosition.TotalMilliseconds;
          });
      };
      
      $synth.add_SpeakProgress($handler);
      
      try {
        $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male, [System.Speech.Synthesis.VoiceAge]::Adult);
      } catch {}
      
      $text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${textBase64}'));
      $synth.Speak($text);
      $synth.Dispose();
      
      $timings | ConvertTo-Json | Out-File -FilePath '${timingPath}' -Encoding utf8;
    `.trim();

    const psScriptPath = path.resolve(`script-${id}.ps1`);
    fs.writeFileSync(psScriptPath, psScript, { encoding: 'utf8' });

    try {
      execSync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psScriptPath}"`);
    } finally {
      if (fs.existsSync(psScriptPath)) fs.unlinkSync(psScriptPath);
    }

    // 2. Convert to MP3 using FFmpeg
    execSync(`ffmpeg -i "${wavPath}" -acodec libmp3lame "${mp3Path}" -y`);

    // 3. Process Timings
    let timings = [];
    if (fs.existsSync(timingPath)) {
      const timingContent = fs.readFileSync(timingPath, 'utf8');
      // Remove UTF-8 BOM if present
      const cleanContent = timingContent.replace(/^\uFEFF/, '');
      if (cleanContent.trim()) {
        timings = JSON.parse(cleanContent);
      }
      fs.unlinkSync(timingPath);
    }

    // 4. Read and convert to base64
    const buffer = fs.readFileSync(mp3Path);
    const base64 = buffer.toString('base64');
    
    // Cleanup
    fs.unlinkSync(wavPath);
    fs.unlinkSync(mp3Path);

    res.json({ 
      success: true, 
      audioUrl: `data:audio/mp3;base64,${base64}`,
      timings: timings 
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
