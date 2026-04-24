import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Download, 
  Move, 
  RotateCcw, 
  Maximize, 
  Trash2, 
  Image as ImageIcon,
  CheckCircle2,
  Undo2
} from 'lucide-react';

interface LogoState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  width: number;
  height: number;
}

const ImageEditor: React.FC = () => {
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoState, setLogoState] = useState<LogoState>({
    x: 50,
    y: 50,
    scale: 0.2,
    rotation: 0,
    opacity: 1,
    width: 0,
    height: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [baseImageDims, setBaseImageDims] = useState({ width: 0, height: 0 });

  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  // Load base image
  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBaseImageDims({ width: img.width, height: img.height });
          baseImgRef.current = img;
          setBaseImage(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Load logo image
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          logoImgRef.current = img;
          setLogoState(prev => ({
            ...prev,
            width: img.width,
            height: img.height
          }));
          setLogoImage(event.target?.result as string);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImgRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base image
    ctx.drawImage(baseImgRef.current, 0, 0, canvas.width, canvas.height);

    // Draw logo if exists
    if (logoImgRef.current) {
      ctx.save();
      ctx.globalAlpha = logoState.opacity;
      
      const logoW = logoState.width * logoState.scale;
      const logoH = logoState.height * logoState.scale;
      
      // Calculate center for rotation
      const centerX = logoState.x + logoW / 2;
      const centerY = logoState.y + logoH / 2;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((logoState.rotation * Math.PI) / 180);
      ctx.drawImage(
        logoImgRef.current, 
        -logoW / 2, 
        -logoH / 2, 
        logoW, 
        logoH
      );
      
      // Draw selection border in preview (not in export)
      // Actually we'll draw it separately or just use CSS overlays for interaction
      
      ctx.restore();
    }
  }, [logoState, baseImage]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!logoImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Convert client coordinates to canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const logoW = logoState.width * logoState.scale;
    const logoH = logoState.height * logoState.scale;

    // Check if clicked near resize handle (bottom right)
    const handleSize = 30; // pixels in canvas space
    if (
      x >= logoState.x + logoW - handleSize &&
      x <= logoState.x + logoW + handleSize &&
      y >= logoState.y + logoH - handleSize &&
      y <= logoState.y + logoH + handleSize
    ) {
      setIsResizing(true);
      setDragStart({ x, y });
      return;
    }

    // Check if clicked inside logo
    if (
      x >= logoState.x &&
      x <= logoState.x + logoW &&
      y >= logoState.y &&
      y <= logoState.y + logoH
    ) {
      setIsDragging(true);
      setDragStart({ x: x - logoState.x, y: y - logoState.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !isResizing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    if (isDragging) {
      setLogoState(prev => ({
        ...prev,
        x: x - dragStart.x,
        y: y - dragStart.y
      }));
    } else if (isResizing) {
      const dx = x - (logoState.x + logoState.width * logoState.scale);
      const dy = y - (logoState.y + logoState.height * logoState.scale);
      
      // Use the larger delta to maintain aspect ratio
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const newScale = Math.max(0.01, logoState.scale + delta / logoState.width);
      
      setLogoState(prev => ({
        ...prev,
        scale: newScale
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResetLogo = () => {
    setLogoState({
      x: 50,
      y: 50,
      scale: 0.2,
      rotation: 0,
      opacity: 1,
      width: logoImgRef.current?.width || 0,
      height: logoImgRef.current?.height || 0
    });
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'exported-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="image-editor-container" style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div className="sidebar" style={{ width: '380px', flexShrink: 0 }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1>Image Editor</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>Logo Overlay Extension</p>
        </div>

        <div className="control-group">
          <label className="section-title"><ImageIcon size={14} /> Base Image</label>
          <div className="upload-box" onClick={() => document.getElementById('base-upload')?.click()}>
            <Upload size={20} />
            <span>{baseImage ? 'Change Image' : 'Upload Image'}</span>
            <input 
              id="base-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleBaseImageUpload} 
              style={{ display: 'none' }} 
            />
          </div>
        </div>

        {baseImage && (
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <label className="section-title"><Maximize size={14} /> Logo Overlay</label>
            {!logoImage ? (
              <div className="upload-box secondary" onClick={() => document.getElementById('logo-upload')?.click()}>
                <Upload size={20} />
                <span>Upload Logo (PNG)</span>
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  style={{ display: 'none' }} 
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--secondary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                  <div style={{ width: 40, height: 40, background: '#000', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={logoImage} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Logo Active</p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted)', margin: 0 }}>PNG Overlay</p>
                  </div>
                  <button onClick={() => setLogoImage(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className="input-label" style={{ margin: 0 }}>Scale</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{Math.round(logoState.scale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.01" 
                    max="1" 
                    step="0.01" 
                    value={logoState.scale} 
                    onChange={(e) => setLogoState(prev => ({ ...prev, scale: Number(e.target.value) }))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="grid-2">
                  <div>
                    <span className="input-label">Rotation</span>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        value={logoState.rotation} 
                        onChange={(e) => setLogoState(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                      />
                      <RotateCcw size={12} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    </div>
                  </div>
                  <div>
                    <span className="input-label">Opacity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={logoState.opacity} 
                        onChange={(e) => setLogoState(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleResetLogo}
                  style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--card-border)', 
                    borderRadius: '8px', 
                    padding: '8px', 
                    fontSize: '0.75rem', 
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Undo2 size={14} />
                  Reset Logo Position
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="generate-button" 
            onClick={handleExport} 
            disabled={!baseImage}
          >
            <Download size={18} />
            Export Image
          </button>
        </div>
      </div>

      <div className="preview-area" style={{ flex: 1 }}>
        {baseImage ? (
          <div 
            ref={containerRef}
            className="canvas-container"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            style={{ 
              position: 'relative', 
              boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.7)',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : (isResizing ? 'nwse-resize' : 'default')
            }}
          >
            <canvas 
              ref={canvasRef}
              width={baseImageDims.width}
              height={baseImageDims.height}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{ 
                display: 'block', 
                maxWidth: '100%', 
                maxHeight: '80vh',
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
            />
            
            {/* Interaction Layer (Visual Helpers) */}
            {logoImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}>
                {/* We could render a CSS box here for better drag feedback, but canvas is more direct for now */}
              </div>
            )}

            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'var(--glass)',
              padding: '6px 12px',
              borderRadius: '100px',
              fontSize: '0.7rem',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle2 size={12} color="#10b981" />
              {baseImageDims.width} x {baseImageDims.height} px
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'var(--secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              border: '1px solid var(--card-border)'
            }}>
              <ImageIcon size={32} />
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No image selected</h3>
            <p style={{ fontSize: '0.9rem' }}>Upload a base image to start editing</p>
          </div>
        )}
      </div>

      <style>{`
        .upload-box {
          border: 2px dashed var(--card-border);
          border-radius: var(--radius);
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--muted);
          background: rgba(255,255,255,0.02);
        }
        .upload-box:hover {
          border-color: var(--primary);
          color: var(--foreground);
          background: rgba(59, 130, 246, 0.05);
        }
        .upload-box.secondary {
          padding: 1.5rem 1rem;
          background: var(--secondary);
          border-style: solid;
          border-width: 1px;
        }
        .image-editor-container {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ImageEditor;
