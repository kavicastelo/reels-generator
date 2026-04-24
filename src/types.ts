export type AnimationStyle = 'fade' | 'slide-up' | 'zoom-in';
export type TransitionStyle = 'fade' | 'cut';
export type OverlayStyle = 'none' | 'dark' | 'light';

export interface SceneData {
  text: string;
  durationInFrames: number;
}

export interface ReelSchema {
  scenes: SceneData[];
  backgroundColor: string;
  backgroundImage?: string;
  fontSize: number;
  textColor: string;
  animationStyle: AnimationStyle;
  transitionStyle: TransitionStyle;
  overlay: OverlayStyle;
  fps: number;
  audioUrl?: string;
}
