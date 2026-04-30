import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { ReelComposition } from './Composition';
import { ReelSchema } from './types';

const defaultProps: ReelSchema = {
  scenes: [
    { text: 'Believe', durationInFrames: 60 },
    { text: 'In Yourself', durationInFrames: 60 },
    { text: 'Start Now', durationInFrames: 60 },
  ],
  backgroundColor: '#111111',
  fontSize: 120,
  textColor: '#ffffff',
  animationStyle: 'slide-up',
  transitionStyle: 'fade',
  overlay: 'dark',
  fps: 30,
  voiceoverUrl: undefined,
};

const RemotionVideo: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={ReelComposition as any}
        calculateMetadata={({ props }) => {
          const typedProps = props as any as ReelSchema;
          const duration = typedProps.scenes.reduce(
            (acc, scene) => acc + (scene.durationInFrames || 0),
            0
          );
          return {
            durationInFrames: Math.max(1, duration),
          };
        }}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as any}
      />
    </>
  );
};

registerRoot(RemotionVideo);
