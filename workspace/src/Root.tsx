import React from 'react';
import { Composition } from 'remotion';
import {
  TitleCard,
  titleCardSchema,
  defaultTitleCardProps,
} from './compositions/TitleCard';
import {
  LowerThird,
  lowerThirdSchema,
  defaultLowerThirdProps,
} from './compositions/LowerThird';
import {
  KineticText,
  kineticTextSchema,
  defaultKineticTextProps,
} from './compositions/KineticText';
import {
  LogoReveal,
  logoRevealSchema,
  defaultLogoRevealProps,
} from './compositions/LogoReveal';
import {
  Countdown,
  countdownSchema,
  defaultCountdownProps,
} from './compositions/Countdown';
import {
  ThreeDTorus,
  threeDTorusSchema,
  defaultThreeDTorusProps,
} from './compositions/ThreeDTorus';
import {
  ThreeDCubeGrid,
  threeDCubeGridSchema,
  defaultThreeDCubeGridProps,
} from './compositions/ThreeDCubeGrid';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        schema={titleCardSchema}
        defaultProps={defaultTitleCardProps}
      />
      <Composition
        id="LowerThird"
        component={LowerThird}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={lowerThirdSchema}
        defaultProps={defaultLowerThirdProps}
      />
      <Composition
        id="KineticText"
        component={KineticText}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={kineticTextSchema}
        defaultProps={defaultKineticTextProps}
      />
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        schema={logoRevealSchema}
        defaultProps={defaultLogoRevealProps}
      />
      <Composition
        id="Countdown"
        component={Countdown}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={countdownSchema}
        defaultProps={defaultCountdownProps}
      />
      <Composition
        id="ThreeDTorus"
        component={ThreeDTorus}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={threeDTorusSchema}
        defaultProps={defaultThreeDTorusProps}
      />
      <Composition
        id="ThreeDCubeGrid"
        component={ThreeDCubeGrid}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={threeDCubeGridSchema}
        defaultProps={defaultThreeDCubeGridProps}
      />
    </>
  );
};
