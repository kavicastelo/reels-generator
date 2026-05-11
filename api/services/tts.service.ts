import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  emotion?: string;
}

export interface WordTiming {
  text: string;
  start: number;
  end: number;
}

export class TTSService {
  /**
   * Generates audio for a script with markers.
   * Handles [PAUSE] markers by splitting text and merging audio.
   */
  static async generateCinematicAudio(
    textWithMarkers: string, 
    voiceProfile: string,
    options: TTSOptions = {}
  ): Promise<{ audioUrl: string, timings: WordTiming[] }> {
    const segments = this.parseMarkers(textWithMarkers);
    const id = Date.now();
    const tempDir = path.resolve('tmp', `tts-${id}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const audioPaths: string[] = [];
    let totalOffset = 0;
    const allTimings: WordTiming[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment.type === 'text') {
        const segmentPath = path.join(tempDir, `segment-${i}.wav`);
        const timingPath = path.join(tempDir, `timing-${i}.json`);
        
        await this.generateBasicAudio(segment.value, segmentPath, timingPath, voiceProfile, options);
        
        if (fs.existsSync(timingPath)) {
          const timingContent = fs.readFileSync(timingPath, 'utf8').replace(/^\uFEFF/, '');
          if (timingContent.trim()) {
            const segmentTimings = JSON.parse(timingContent);
            segmentTimings.forEach((t: any) => {
              allTimings.push({
                text: t.Text,
                start: totalOffset + t.Offset,
                end: totalOffset + t.Offset + 100
              });
            });
            
            const duration = this.getAudioDuration(segmentPath);
            totalOffset += duration;
          }
        }
        audioPaths.push(segmentPath);
      } else if (segment.type === 'pause') {
        const pausePath = path.join(tempDir, `pause-${i}.wav`);
        execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${segment.value} "${pausePath}" -y`);
        audioPaths.push(pausePath);
        totalOffset += parseFloat(segment.value) * 1000;
      }
    }

    const outputPath = path.resolve(`public/output-${id}.mp3`);
    const fileListPath = path.join(tempDir, 'files.txt');
    const fileListContent = audioPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(fileListPath, fileListContent);

    execSync(`ffmpeg -f concat -safe 0 -i "${fileListPath}" -acodec libmp3lame "${outputPath}" -y`);

    return {
      audioUrl: `/public/output-${id}.mp3`,
      timings: allTimings
    };
  }

  private static parseMarkers(text: string) {
    const segments: { type: 'text' | 'pause', value: string }[] = [];
    const parts = text.split(/(\[PAUSE:[\d.]+s\])/);
    
    parts.forEach(part => {
      if (part.startsWith('[PAUSE:')) {
        const duration = part.match(/[\d.]+/)?.[0] || '0.5';
        segments.push({ type: 'pause', value: duration });
      } else if (part.trim()) {
        // Strip other markers for TTS engine
        const cleanText = part.replace(/\[EMOTION:\w+\]/g, '')
                             .replace(/\[\/?EMPHASIS\]/g, '')
                             .replace(/\[PACING:\w+\]/g, '');
        segments.push({ type: 'text', value: cleanText.trim() });
      }
    });
    
    return segments;
  }

  private static getAudioDuration(filePath: string): number {
    try {
      const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`).toString();
      return parseFloat(output) * 1000;
    } catch {
      return 0;
    }
  }

  private static async generateBasicAudio(
    text: string, 
    wavPath: string, 
    timingPath: string, 
    voiceProfile: string,
    options: TTSOptions = {}
  ): Promise<void> {
    const textBase64 = Buffer.from(text).toString('base64');
    
    // Stability simulation: Jitter the rate slightly if stability is low
    const stabilityJitter = options.stability !== undefined ? (1 - options.stability) * 2 : 0;
    const baseRate = options.speed !== undefined ? Math.round((options.speed - 1) * 10) : 0;
    const finalRate = baseRate + (Math.random() > 0.5 ? stabilityJitter : -stabilityJitter);

    const psScript = `
      $ProgressPreference = 'SilentlyContinue';
      Add-Type -AssemblyName System.Speech;
      $synth = New-Object -TypeName System.Speech.Synthesis.SpeechSynthesizer;
      $synth.SetOutputToWaveFile('${wavPath.replace(/'/g, "''")}');
      
      $timings = New-Object System.Collections.Generic.List[PSObject];
      $handler = {
          param($sender, $e);
          $timings.Add([PSCustomObject]@{
              Text = $e.Text;
              Offset = $e.AudioPosition.TotalMilliseconds;
          });
      };
      
      $synth.add_SpeakProgress($handler);
      
      # Voice Mapping
      $v = $null;
      switch ('${voiceProfile}') {
        'dark-cinematic' { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = -2 }
        'energetic'      { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = 2 }
        'documentary'    { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = 0 }
        'motivational'   { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male, [System.Speech.Synthesis.VoiceAge]::Senior); $synth.Rate = -1 }
        'futuristic'     { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Child); $synth.Rate = 1 }
        'whisper'        { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female, [System.Speech.Synthesis.VoiceAge]::Adult); $synth.Rate = -3; $synth.Volume = 50 }
        default          { $synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Male, [System.Speech.Synthesis.VoiceAge]::Adult) }
      }

      # Apply Overrides
      if ($null -ne ${options.speed}) { $synth.Rate = [Math]::Max(-10, [Math]::Min(10, ${Math.round(finalRate)})) }
      
      $text = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${textBase64}'));
      $synth.Speak($text);
      $synth.Dispose();
      
      $timings | ConvertTo-Json | Out-File -FilePath '${timingPath.replace(/'/g, "''")}' -Encoding utf8;
    `.trim();

    const psScriptPath = path.join(path.dirname(wavPath), `script-${Date.now()}.ps1`);
    fs.writeFileSync(psScriptPath, psScript, { encoding: 'utf8' });

    try {
      execSync(`powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psScriptPath}"`);
    } finally {
      if (fs.existsSync(psScriptPath)) fs.unlinkSync(psScriptPath);
    }
  }
}
