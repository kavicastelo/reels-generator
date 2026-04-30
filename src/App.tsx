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
  Monitor,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import { SceneData } from './types';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'video' | 'image'>('video');
  const [scenes, setScenes] = useState<SceneData[]>([
    { text: "Believe", durationInFrames: 60 },
    { text: "In Yourself", durationInFrames: 60 },
    { text: "Start Now", durationInFrames: 60 },
  ]);
  const [backgroundColor, setBackgroundColor] = useState("#09090b");
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>("/background.png");
  const [fontSize, setFontSize] = useState(120);
  const [textColor, setTextColor] = useState("#ffffff");
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>("slide-up");
  const [overlay, setOverlay] = useState<OverlayStyle>("dark");
  const [sceneDuration, setSceneDuration] = useState(2);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | undefined>("/music.mp3");
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | undefined>(undefined);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [logoConfig, setLogoConfig] = useState({
    x: 10,
    y: 5,
    scale: 0.5,
    opacity: 0.8
  });

  const fps = 30;

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
    voiceoverUrl,
    backgroundMusicUrl,
    logoUrl,
    logoConfig,
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
    setVoiceoverUrl(undefined);
    setBackgroundMusicUrl("/music.mp3");
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
        setBackgroundMusicUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const speak = () => {
    window.speechSynthesis.cancel();
    const textToSpeak = scenes.map(s => s.text).join('. ');
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
        body: JSON.stringify({ text: scenes.map(s => s.text).join('. ') }),
      });

      const data = await response.json();
      if (data.success) {
        setVoiceoverUrl(data.audioUrl);
        
        // Auto-sync timings to scenes
        if (data.timings && data.timings.length > 0) {
          console.log('Syncing scenes with timings:', data.timings);
          const newScenes = [...scenes];
          let currentTimingIdx = 0;

          newScenes.forEach((scene, i) => {
            const words = scene.text.split(/\s+/).filter(w => w.length > 0);
            if (words.length === 0) return;

            // Find start time (first word match)
            let foundMatch = false;
            let startIdx = currentTimingIdx;
            
            while (currentTimingIdx < data.timings.length) {
              const timingWord = data.timings[currentTimingIdx].Text.toLowerCase().replace(/[^\w]/g, '');
              const sceneWord = words[0].toLowerCase().replace(/[^\w]/g, '');
              if (timingWord === sceneWord || sceneWord.includes(timingWord) || timingWord.includes(sceneWord)) {
                foundMatch = true;
                break;
              }
              currentTimingIdx++;
            }
            
            // If not found, use the last index we were at
            if (!foundMatch) currentTimingIdx = startIdx;
            
            const startTime = data.timings[currentTimingIdx]?.Offset || 0;
            
            // Advance to the end of the scene's words
            const wordCount = words.length;
            const expectedEndIdx = Math.min(currentTimingIdx + wordCount - 1, data.timings.length - 1);
            currentTimingIdx = expectedEndIdx;
            
            // The duration is the time until the NEXT word starts (or a bit after the last word)
            let endTime;
            if (i === newScenes.length - 1) {
              // Last scene: add more buffer or look for the very last timing
              endTime = data.timings[data.timings.length - 1]?.Offset + 1500;
            } else {
              endTime = data.timings[currentTimingIdx + 1]?.Offset || (data.timings[currentTimingIdx]?.Offset + 1000);
            }
            
            const durationMs = Math.max(800, endTime - startTime);
            scene.durationInFrames = Math.ceil((durationMs / 1000) * fps);
            
            // Move to next timing for next scene
            currentTimingIdx++;
          });

          setScenes(newScenes);
        }

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

  const generateAIScript = async () => {
    if (!aiTopic) return;
    setIsGeneratingScript(true);
    setRenderStatus('AI is brainstorming your script...');
    try {
      const response = await fetch('http://localhost:3001/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: aiTopic }),
      });

      const data = await response.json();
      if (data.success) {
        const newScenes = data.script.split('\n').map((line: string) => ({
          text: line.trim(),
          durationInFrames: sceneDuration * fps,
        }));
        setScenes(newScenes);
        setRenderStatus('Script generated!');
        setTimeout(() => setRenderStatus(null), 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error(error);
      alert('AI Generation failed. Make sure Ollama is running with "llama3" model.');
    } finally {
      setIsGeneratingScript(false);
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
              <label className="section-title"><Sparkles size={14} /> AI Assistant</label>
              <span className="input-label">What is your reel about?</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Morning Routine"
                  style={{
                    flex: 1,
                    background: 'var(--secondary)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  onClick={generateAIScript}
                  disabled={isGeneratingScript || !aiTopic}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isGeneratingScript ? <Loader2 size={16} className="spinner" /> : <Sparkles size={16} />}
                </button>
              </div>
            </div>

            <div className="control-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="section-title" style={{ margin: 0 }}><Type size={14} /> Scenes</label>
                <button
                  onClick={() => setScenes([...scenes, { text: "New Scene", durationInFrames: sceneDuration * fps }])}
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'white', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={12} /> Add
                </button>
              </div>

              <div className="scenes-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {scenes.map((scene, idx) => (
                  <div key={idx} className="scene-card" style={{ background: 'var(--secondary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted)' }}>SCENE {idx + 1}</span>
                      <button
                        onClick={() => setScenes(scenes.filter((_, i) => i !== idx))}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={scene.text}
                      onChange={(e) => {
                        const newScenes = [...scenes];
                        newScenes[idx].text = e.target.value;
                        setScenes(newScenes);
                      }}
                      style={{ height: '60px', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Duration (s)</span>
                        <input
                          type="number"
                          value={(scene.durationInFrames / fps).toFixed(2)}
                          step="0.1"
                          min="0.1"
                          onChange={(e) => {
                            const newScenes = [...scenes];
                            newScenes[idx].durationInFrames = Math.ceil(Number(e.target.value) * fps);
                            setScenes(newScenes);
                          }}
                          style={{
                            width: '100%',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '4px',
                            color: 'white'
                          }}
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Background Asset</span>
                        <button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const newScenes = [...scenes];
                                  newScenes[idx].backgroundImage = event.target?.result as string;
                                  setScenes(newScenes);
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          style={{
                            width: '100%',
                            fontSize: '0.7rem',
                            padding: '6px',
                            background: scene.backgroundImage ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${scene.backgroundImage ? '#10b981' : 'var(--card-border)'}`,
                            borderRadius: '4px',
                            color: scene.backgroundImage ? '#10b981' : 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <ImageIcon size={12} />
                          {scene.backgroundImage ? 'Image Attached' : 'Attach BG'}
                        </button>
                      </div>
                      {scene.backgroundImage && (
                        <button
                          onClick={() => {
                            const newScenes = [...scenes];
                            newScenes[idx].backgroundImage = undefined;
                            setScenes(newScenes);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', alignSelf: 'flex-end', paddingBottom: '8px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                Background Music (MP3)
                {backgroundMusicUrl?.startsWith('data') && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
              </span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }} />

              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                padding: '10px', 
                borderRadius: '8px', 
                border: '1px solid var(--card-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Volume2 size={14} color={voiceoverUrl ? '#10b981' : 'var(--muted)'} />
                  <span style={{ color: voiceoverUrl ? 'white' : 'var(--muted)' }}>
                    {voiceoverUrl ? 'Voiceover Ready' : 'No Voiceover'}
                  </span>
                </div>
                {voiceoverUrl && (
                  <button 
                    onClick={() => setVoiceoverUrl(undefined)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span className="input-label">
                  Brand Logo Overlay
                  {logoUrl && <span style={{ color: '#10b981', marginLeft: '4px' }}>✓</span>}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setLogoUrl(event.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }} 
                />
                
                {logoUrl && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                    <div className="grid-2" style={{ marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>X Position (%)</span>
                        <input type="number" value={logoConfig.x} onChange={(e) => setLogoConfig({...logoConfig, x: Number(e.target.value)})} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Y Position (%)</span>
                        <input type="number" value={logoConfig.y} onChange={(e) => setLogoConfig({...logoConfig, y: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Scale</span>
                        <input type="range" min="0.1" max="2" step="0.1" value={logoConfig.scale} onChange={(e) => setLogoConfig({...logoConfig, scale: Number(e.target.value)})} style={{ width: '100%' }} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Opacity</span>
                        <input type="range" min="0" max="1" step="0.1" value={logoConfig.opacity} onChange={(e) => setLogoConfig({...logoConfig, opacity: Number(e.target.value)})} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <button 
                      onClick={() => setLogoUrl(undefined)}
                      style={{ width: '100%', marginTop: '8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', padding: '4px' }}
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>
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
