import React from 'react';
import {Composition} from 'remotion';
import {Behind} from './Behind';
import {DURATION, FPS, H, W} from './common';
import {Front} from './Front';

const frames = Math.round(DURATION * FPS);

export const Root: React.FC = () => (
  <>
    <Composition id="Behind" component={Behind} durationInFrames={frames} fps={FPS} width={W} height={H} />
    <Composition id="Front" component={Front} durationInFrames={frames} fps={FPS} width={W} height={H} />
  </>
);
