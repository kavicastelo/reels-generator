import ollama from 'ollama';

export interface AnnotatedScript {
  text: string;
  markers: Marker[];
  hookScore: number;
  suggestions: string[];
}

export interface Marker {
  type: 'emotion' | 'pause' | 'emphasis' | 'pacing';
  value: string;
  position: number;
}

export class NarratorService {
  static async analyzeScript(text: string): Promise<AnnotatedScript> {
    console.log('Analyzing script with AI Narration Director...');

    const prompt = `
      You are an expert AI Narration Director for high-retention social media content (TikTok, Reels).
      Analyze the following script and enhance it with cinematic markers.
      
      Markers to use:
      - [EMOTION:style] where style is (energetic, dramatic, whisper, cinematic, documentary)
      - [PAUSE:duration] where duration is in seconds (e.g. 0.5s, 1.2s)
      - [EMPHASIS]word[/EMPHASIS] for key words
      - [PACING:speed] where speed is (slow, fast, normal)

      Also provide:
      1. A Hook Intensity Score (0-100)
      2. 3 Suggestions for better retention.

      Return ONLY a JSON object with the following structure:
      {
        "annotatedText": "script with markers",
        "hookScore": 85,
        "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
      }

      Script:
      ${text}
    `;

    try {
      const response = await ollama.chat({
        model: 'llama3',
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
      });

      const data = JSON.parse(response.message.content);
      
      return {
        text: data.annotatedText,
        markers: this.extractMarkers(data.annotatedText),
        hookScore: data.hookScore,
        suggestions: data.suggestions
      };
    } catch (error) {
      console.error('Narrator analysis failed:', error);
      return {
        text: text,
        markers: [],
        hookScore: 50,
        suggestions: ['Could not analyze script. Proceeding with raw text.']
      };
    }
  }

  private static extractMarkers(text: string): Marker[] {
    const markers: Marker[] = [];
    
    // Emotion markers
    const emotionRegex = /\[EMOTION:(\w+)\]/g;
    let match;
    while ((match = emotionRegex.exec(text)) !== null) {
      markers.push({ type: 'emotion', value: match[1], position: match.index });
    }

    // Pause markers
    const pauseRegex = /\[PAUSE:([\d.]+)s\]/g;
    while ((match = pauseRegex.exec(text)) !== null) {
      markers.push({ type: 'pause', value: match[1], position: match.index });
    }

    return markers;
  }
}
