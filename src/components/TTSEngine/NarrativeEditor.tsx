import React, { useState } from 'react';
import { Sparkles, Play, Clock, Info, AlertCircle, Quote } from 'lucide-react';

interface NarrativeEditorProps {
  script: string;
  setScript: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hookScore?: number;
  suggestions?: string[];
}

const NarrativeEditor: React.FC<NarrativeEditorProps> = ({
  script,
  setScript,
  onAnalyze,
  isAnalyzing,
  hookScore,
  suggestions
}) => {
  const [showTips, setShowTips] = useState(true);

  return (
    <div className="narrative-editor">
      <div className="editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Quote size={18} className="text-primary" />
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Storytelling Script</h3>
        </div>
        <button 
          onClick={onAnalyze} 
          disabled={isAnalyzing || !script}
          className="ai-btn"
        >
          {isAnalyzing ? 'Analyzing...' : <><Sparkles size={14} /> AI Director</>}
        </button>
      </div>

      <div className="editor-container">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste your raw script here... Use [PAUSE:1s] or [EMOTION:excited] for better control."
          className="script-textarea"
        />
        
        {hookScore !== undefined && (
          <div className="hook-score-badge" style={{
            borderColor: hookScore > 80 ? '#10b981' : hookScore > 60 ? '#f59e0b' : '#ef4444'
          }}>
            <div className="score-value">{hookScore}%</div>
            <div className="score-label">Hook Intensity</div>
          </div>
        )}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions-box">
          <div className="suggestion-title">
            <Info size={14} /> AI Suggestions
          </div>
          <ul className="suggestion-list">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {showTips && (
        <div className="marker-tips">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Marker Guide</span>
            <button onClick={() => setShowTips(false)} className="close-btn">×</button>
          </div>
          <div className="tips-grid">
            <div className="tip-item"><code>[PAUSE:0.5s]</code> Cinematic silence</div>
            <div className="tip-item"><code>[EMOTION:dark]</code> Tone shift</div>
            <div className="tip-item"><code>[EMPHASIS]word[/EMPHASIS]</code> Stress</div>
          </div>
        </div>
      )}

      <style>{`
        .narrative-editor {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-btn {
          background: linear-gradient(135deg, var(--primary), #8b5cf6);
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          alignItems: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .ai-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .editor-container {
          position: relative;
        }
        .script-textarea {
          width: 100%;
          height: 200px;
          background: #09090b;
          border: 1px solid var(--card-border);
          border-radius: 8px;
          padding: 1rem;
          color: #e4e4e7;
          font-family: 'Inter', sans-serif;
          font-size: 0.9rem;
          line-height: 1.6;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
        }
        .script-textarea:focus {
          border-color: var(--primary);
        }
        .hook-score-badge {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(0,0,0,0.8);
          border: 1px solid;
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(4px);
        }
        .score-value {
          font-weight: 800;
          font-size: 0.9rem;
        }
        .score-label {
          font-size: 0.6rem;
          color: var(--muted);
          text-transform: uppercase;
        }
        .suggestions-box {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          padding: 10px;
        }
        .suggestion-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #60a5fa;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .suggestion-list {
          margin: 0;
          padding-left: 1.25rem;
          font-size: 0.75rem;
          color: #a1a1aa;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .marker-tips {
          background: rgba(255,255,255,0.02);
          border: 1px dashed var(--card-border);
          border-radius: 8px;
          padding: 10px;
        }
        .tips-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 4px;
        }
        .tip-item {
          font-size: 0.65rem;
          color: var(--muted);
        }
        .tip-item code {
          color: var(--primary);
          background: rgba(99, 102, 241, 0.1);
          padding: 1px 4px;
          border-radius: 3px;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
};

export default NarrativeEditor;
