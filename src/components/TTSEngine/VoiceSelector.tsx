import React from 'react';
import { Mic, Check, Music } from 'lucide-react';

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  style: 'cinematic' | 'energetic' | 'documentary' | 'motivational';
  color: string;
}

const VOICES: VoiceProfile[] = [
  { id: 'dark-cinematic', name: 'Shadow Narrator', description: 'Deep, mysterious, perfect for horror/drama', style: 'cinematic', color: '#7c3aed' },
  { id: 'energetic', name: 'Pulse Viral', description: 'Fast-paced, high energy for TikTok trends', style: 'energetic', color: '#f43f5e' },
  { id: 'documentary', name: 'Historian', description: 'Clear, authoritative, educational style', style: 'documentary', color: '#0ea5e9' },
  { id: 'motivational', name: 'The Mentor', description: 'Inspiring, steady pacing, heavy emphasis', style: 'motivational', color: '#f59e0b' },
  { id: 'futuristic', name: 'Cyber Oracle', description: 'Clean, neutral, perfect for tech content', style: 'documentary', color: '#10b981' },
  { id: 'whisper', name: 'Whispering Soul', description: 'Intimate, low volume, emotional depth', style: 'cinematic', color: '#ec4899' },
  { id: 'corporate', name: 'Corporate Sage', description: 'Professional, calm, and reliable', style: 'motivational', color: '#64748b' },
];

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelect: (id: string) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onSelect }) => {
  return (
    <div className="voice-selector-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
        <Mic size={18} className="text-primary" />
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Voice Profile</h3>
      </div>
      
      <div className="voices-grid">
        {VOICES.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`voice-card ${selectedVoice === voice.id ? 'selected' : ''}`}
            style={{
              '--voice-color': voice.color
            } as any}
          >
            <div className="voice-icon">
              {selectedVoice === voice.id ? <Check size={16} /> : <Music size={16} />}
            </div>
            <div className="voice-info">
              <span className="voice-name">{voice.name}</span>
              <span className="voice-desc">{voice.description}</span>
            </div>
            {selectedVoice === voice.id && <div className="active-glow" />}
          </button>
        ))}
      </div>

      <style>{`
        .voice-selector-container {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1.25rem;
        }
        .voices-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .voice-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #09090b;
          border: 1px solid var(--card-border);
          border-radius: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          overflow: hidden;
        }
        .voice-card:hover {
          border-color: var(--voice-color);
          background: rgba(255,255,255,0.02);
        }
        .voice-card.selected {
          border-color: var(--voice-color);
          background: rgba(var(--voice-color-rgb), 0.1);
        }
        .voice-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--voice-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .voice-info {
          display: flex;
          flex-direction: column;
        }
        .voice-name {
          font-weight: 700;
          font-size: 0.85rem;
          color: white;
        }
        .voice-desc {
          font-size: 0.65rem;
          color: var(--muted);
          line-height: 1.3;
        }
        .active-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--voice-color), transparent 70%);
          opacity: 0.05;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default VoiceSelector;
