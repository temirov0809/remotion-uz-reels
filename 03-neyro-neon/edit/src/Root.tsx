import React from 'react';
import {Composition} from 'remotion';
import {DURATION, Edit, FPS} from './Edit';

export const Root: React.FC = () => (
  <Composition id="Edit" component={Edit} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={1080} height={1920} />
);
