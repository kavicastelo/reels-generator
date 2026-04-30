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
    voiceoverUrl,
    backgroundMusicUrl,
  } = props;

  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const resolvedBg = backgroundImage?.startsWith('data:') 
    ? backgroundImage 
    : (backgroundImage ? staticFile(backgroundImage) : undefined);

  // Background Music Ducking Logic
  // Duck to 0.2 during the first 90% of the video (assuming that's the voiceover duration)
  // or simply duck if voiceoverUrl exists.
  const musicVolume = interpolate(
    frame,
    [0, 30, durationInFrames - 60, durationInFrames - 30], // Intro/Outro transitions
    [1, 0.2, 0.2, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
        {scenes.map((scene, i) => {
          const resolvedSceneBg = scene.backgroundImage?.startsWith('data:') 
            ? scene.backgroundImage 
            : (scene.backgroundImage ? staticFile(scene.backgroundImage) : undefined);

          return (
            <Series.Sequence key={i} durationInFrames={scene.durationInFrames}>
              <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                {resolvedSceneBg && (
                  <Img
                    src={resolvedSceneBg}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                    }}
                  />
                )}
                <TextAnimation
                  text={scene.text}
                  style={animationStyle}
                  fontSize={fontSize}
                  textColor={textColor}
                />
              </AbsoluteFill>
            </Series.Sequence>
          );
        })}
      </Series>

      {voiceoverUrl && <Audio src={voiceoverUrl} volume={1.0} />}
      {backgroundMusicUrl && (
        <Audio 
          src={backgroundMusicUrl} 
          volume={voiceoverUrl ? musicVolume : 1.0} 
          loop
        />
      )}
    </AbsoluteFill>
  );
};
