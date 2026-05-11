import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, Volume2, Scissors } from 'lucide-react';

interface WaveformPreviewProps {
  audioUrl?: string;
  onExport: () => void;
}

const WaveformPreview: React.FC<WaveformPreviewProps> = ({ audioUrl, onExport }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 80,
      normalize: true,
      partialRender: true
    });

    wavesurfer.current.load(audioUrl);

    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current!.getDuration());
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  if (!audioUrl) {
    return (
      <div className="waveform-empty">
        <Volume2 size={48} className="empty-icon" />
        <p>No narration generated yet. Use the AI Director to start.</p>
      </div>
    );
  }

  return (
    <div className="waveform-card">
      <div className="waveform-header">
        <div className="status-badge">
          <div className="dot" /> Ready for Export
        </div>
        <div className="audio-meta">
          {duration.toFixed(1)}s Narration
        </div>
      </div>

      <div ref={containerRef} className="waveform-container" />

      <div className="waveform-controls">
        <button onClick={togglePlay} className="play-btn">
          {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
        </button>
        
        <div className="action-group">
          <button className="icon-btn"><Scissors size={18} /></button>
          <button onClick={onExport} className="export-btn">
            <Download size={16} /> Export MP3
          </button>
        </div>
      </div>

      <style>{`
        .waveform-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .waveform-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }
        .audio-meta {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .waveform-container {
          background: rgba(0,0,0,0.2);
          border-radius: 8px;
          padding: 10px;
        }
        .waveform-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--primary);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .play-btn:hover {
          transform: scale(1.05);
        }
        .action-group {
          display: flex;
          gap: 10px;
        }
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #18181b;
          border: 1px solid var(--card-border);
          color: var(--muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .export-btn {
          padding: 0 16px;
          height: 40px;
          border-radius: 8px;
          background: #18181b;
          border: 1px solid var(--card-border);
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .waveform-empty {
          height: 200px;
          background: rgba(255,255,255,0.01);
          border: 2px dashed var(--card-border);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          text-align: center;
          padding: 2rem;
        }
        .empty-icon {
          margin-bottom: 1rem;
          opacity: 0.2;
        }
      `}</style>
    </div>
  );
};

export default WaveformPreview;
