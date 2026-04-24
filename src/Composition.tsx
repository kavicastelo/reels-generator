import { AbsoluteFill, Series, interpolate, useCurrentFrame, useVideoConfig, staticFile, Audio, Img } from 'remotion';
import { ReelSchema, AnimationStyle } from './types';

const TextAnimation: React.FC<{
  text: string;
  style: AnimationStyle;
  fontSize: number;
  textColor: string;
}> = ({ text, style, fontSize, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let opacity = 1;
  let translateY = 0;
  let scale = 1;

  if (style === 'fade') {
    opacity = interpolate(frame, [0, 15], [0, 1], {
      extrapolateRight: 'clamp',
    });
  } else if (style === 'slide-up') {
    opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    translateY = interpolate(frame, [0, 15], [50, 0], {
      extrapolateRight: 'clamp',
    });
  } else if (style === 'zoom-in') {
    opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
    scale = interpolate(frame, [0, 15], [0.8, 1], {
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        padding: '0 40px',
        color: textColor,
        fontSize: `${fontSize}px`,
        fontWeight: 'bold',
        textShadow: '0 4px 10px rgba(0,0,0,0.5)',
        fontFamily: "'Inter', sans-serif",
        lineHeight: 1.2,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
};

export const ReelComposition: React.FC<ReelSchema> = (props) => {
  const {
    scenes,
    backgroundColor,
    backgroundImage,
    fontSize,
    textColor,
    animationStyle,
    overlay,
    audioUrl,
  } = props;

  const resolvedBg = backgroundImage?.startsWith('data:') 
    ? backgroundImage 
    : (backgroundImage ? staticFile(backgroundImage) : undefined);

  const resolvedAudio = audioUrl || staticFile('music.mp3');

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {resolvedBg && (
        <Img
          src={resolvedBg}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {overlay === 'dark' && (
        <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      )}
      {overlay === 'light' && (
        <AbsoluteFill style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
      )}

      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationInFrames}>
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
              <TextAnimation
                text={scene.text}
                style={animationStyle}
                fontSize={fontSize}
                textColor={textColor}
              />
            </AbsoluteFill>
          </Series.Sequence>
        ))}
      </Series>

      <Audio src={resolvedAudio} volume={1.0} />
    </AbsoluteFill>
  );
};
