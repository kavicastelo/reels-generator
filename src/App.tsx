import React, { useState, useMemo } from 'react';
import { Player } from '@remotion/player';
import { ReelComposition } from './Composition';
import { ReelSchema, AnimationStyle, OverlayStyle } from './types';
import ImageEditor from './ImageEditor';
import { 
  Play, 
  Download, 
  Type, 
  Image as ImageIcon, 
  Sparkles, 
  Volume2, 
  Palette, 
  Settings, 
  Layers,
  Loader2,
  Video,
  Monitor
} from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'video' | 'image'>('video');
  const [inputText, setInputText] = useState("Believe\nIn Yourself\nStart Now");
  const [backgroundColor, setBackgroundColor] = useState("#09090b");
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>("/background.png");
  const [fontSize, setFontSize] = useState(120);
  const [textColor, setTextColor] = useState("#ffffff");
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>("slide-up");
  const [overlay, setOverlay] = useState<OverlayStyle>("dark");
  const [sceneDuration, setSceneDuration] = useState(2);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);

  const fps = 30;

  const scenes = useMemo(() => {
    return inputText
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => ({
        text: line.trim(),
        durationInFrames: sceneDuration * fps,
      }));
  }, [inputText, sceneDuration, fps]);

  const totalDurationInFrames = Math.max(1, scenes.reduce((acc, scene) => acc + scene.durationInFrames, 0));

  const inputProps: ReelSchema = {
    scenes,
    backgroundColor,
    backgroundImage,
    fontSize,
    textColor,
    animationStyle,
    transitionStyle: 'fade',
    overlay,
    fps,
    audioUrl,
  };

  const templates = [
    { name: 'Dark Motivation', bg: '#09090b', text: '#ffffff', animation: 'slide-up', overlay: 'dark' },
    { name: 'Clean White', bg: '#ffffff', text: '#09090b', animation: 'fade', overlay: 'none' },
    { name: 'Night Cyber', bg: '#050510', text: '#00ccff', animation: 'zoom-in', overlay: 'dark' },
    { name: 'Gold Luxury', bg: '#0a0a0a', text: '#d4af37', animation: 'slide-up', overlay: 'dark' },
  ];

  const resetToDefaults = () => {
    setBackgroundColor("#09090b");
    setTextColor("#ffffff");
    setFontSize(120);
    setAnimationStyle("slide-up");
    setOverlay("dark");
    setBackgroundImage("/background.png");
    setAudioUrl(undefined);
    setSceneDuration(2);
  };

  const applyTemplate = (t: typeof templates[0]) => {
    setBackgroundColor(t.bg);
    setTextColor(t.text);
    setAnimationStyle(t.animation as AnimationStyle);
    setOverlay(t.overlay as OverlayStyle);
    setBackgroundImage(t.name === 'Clean White' ? undefined : "/background.png");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAudioUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const speak = () => {
    window.speechSynthesis.cancel();
    const textToSpeak = inputText.replace(/\n/g, '. ');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const generateTTS = async () => {
    setIsRendering(true);
    setRenderStatus('Generating high-quality narration...');
    try {
      const response = await fetch('http://localhost:3001/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText.replace(/\n/g, '. ') }),
      });

      const data = await response.json();
      if (data.success) {
        setAudioUrl(data.audioUrl);
        setRenderStatus('Narration synced!');
        setTimeout(() => setRenderStatus(null), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('TTS Generation failed. Make sure the render server is running.');
    } finally {
      setIsRendering(false);
    }
  };

  const handleExport = async () => {
    setIsRendering(true);
    setRenderStatus('Initializing render...');
    
    try {
      const isProd = window.location.hostname !== 'localhost';
      const apiUrl = isProd ? '/api/render' : 'http://localhost:3001/render';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputProps }),
      });

      const data = await response.json();
      if (data.success) {
        if (isProd) {
          alert(`Render started on Vercel! Your Render ID is: ${data.renderId}. Check your Vercel Blob storage for the result.`);
          setRenderStatus('Export triggered on Cloud!');
        } else {
          alert(`Export successful!\n\nVideo saved to: ${data.url}\n\nCheck the 'out' folder.`);
          setRenderStatus('Export complete!');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('Export failed. Make sure the render server is running (npm run server).');
      setRenderStatus('Export failed.');
    } finally {
      setIsRendering(false);
      setTimeout(() => setRenderStatus(null), 3000);
    }
  };

  return (
    <div className="app-container" style={{ gridTemplateColumns: activeMode === 'video' ? '380px 1fr' : '1fr' }}>
      {isRendering && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p style={{ marginTop: '1.5rem', fontWeight: 600 }}>{renderStatus}</p>
        </div>
      )}

      {/* Mode Switcher Floating Toggle */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        background: 'var(--glass)',
        padding: '0.4rem',
        borderRadius: '100px',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        gap: '0.25rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <button 
          onClick={() => setActiveMode('video')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '100px',
            border: 'none',
            background: activeMode === 'video' ? 'var(--primary)' : 'transparent',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Video size={16} />
          Reel Generator
        </button>
        <button 
          onClick={() => setActiveMode('image')}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: '100px',
            border: 'none',
            background: activeMode === 'image' ? 'var(--primary)' : 'transparent',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Monitor size={16} />
          Image Editor
        </button>
      </div>

      {activeMode === 'video' ? (
        <>
          <div className="sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1>ReelGen</h1>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>Create viral content in seconds</p>
              </div>
              <button 
                onClick={resetToDefaults}
                style={{ 
                  background: 'transparent', 
                  border: '1px solid var(--card-border)', 
                  borderRadius: '6px', 
                  padding: '4px 8px', 
                  fontSize: '0.7rem', 
                  color: 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </div>

            <div className="control-group">
              <label className="section-title"><Sparkles size={14} /> Presets</label>
              <div className="templates-grid">
                {templates.map(t => (
                  <button key={t.name} className="template-btn" onClick={() => applyTemplate(t)}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <label className="section-title"><Type size={14} /> Script</label>
              <span className="input-label">One line per scene</span>
              <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your script here..."
              />
            </div>

            <div className="control-group">
              <label className="section-title"><Settings size={14} /> Configuration</label>
              <div className="grid-2">
                <div>
                  <span className="input-label">Duration (s)</span>
                  <input 
                    type="number" 
                    value={sceneDuration} 
                    onChange={(e) => setSceneDuration(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <span className="input-label">Font Size</span>
                  <input 
                    type="number" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="control-group">
              <label className="section-title"><Palette size={14} /> Appearance</label>
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <span className="input-label">BG Color</span>
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
                <div>
                  <span className="input-label">Text Color</span>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
              </div>
              <div>
                <span className="input-label">Animation Style</span>
                <select value={animationStyle} onChange={(e) => setAnimationStyle(e.target.value as AnimationStyle)}>
                  <option value="fade">Smooth Fade</option>
                  <option value="slide-up">Classic Slide Up</option>
                  <option value="zoom-in">Dynamic Zoom</option>
                </select>
              </div>
            </div>

            <div className="control-group">
              <label className="section-title"><Layers size={14} /> Overlay & Media</label>
              <div className="tabs" style={{ marginBottom: '1rem' }}>
                {['none', 'dark', 'light'].map((o) => (
                  <div 
                    key={o}
                    className={`tab ${overlay === o ? 'active' : ''}`} 
                    onClick={() => setOverlay(o as OverlayStyle)}
                  >{o.charAt(0).toUpperCase() + o.slice(1)}</div>
                ))}
              </div>
              <span className="input-label">
                Upload Custom Background (Image) 
                {backgroundImage?.startsWith('data') && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
              </span>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }} />
              
              <span className="input-label">
                Upload Background Music (MP3)
                {audioUrl?.startsWith('data') && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
              </span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ fontSize: '0.75rem' }} />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="grid-2">
                <button className="generate-button secondary-button" onClick={speak} style={{ padding: '0.6rem' }}>
                  <Play size={16} />
                  Quick Voice
                </button>
                <button className="generate-button secondary-button" onClick={generateTTS} style={{ padding: '0.6rem' }}>
                  <Volume2 size={16} />
                  Sync Audio
                </button>
              </div>

              <button className="generate-button" onClick={handleExport} disabled={isRendering}>
                {isRendering ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
                {isRendering ? 'Processing...' : 'Export High Quality MP4'}
              </button>
            </div>
          </div>

          <div className="preview-area">
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', zIndex: 10 }}>
              <div style={{ 
                background: 'var(--glass)', 
                padding: '10px 18px', 
                borderRadius: '100px', 
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--glass-border)',
                fontSize: '0.85rem',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></div>
                Live Preview (9:16)
              </div>
            </div>

            <div className="preview-container">
              <div className="player-wrapper">
                <Player
                  component={ReelComposition as any}
                  durationInFrames={totalDurationInFrames}
                  fps={fps}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{ width: '100%', height: '100%' }}
                  inputProps={inputProps as any}
                  controls
                  loop
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <ImageEditor />
      )}
    </div>
  );
};

export default App;
