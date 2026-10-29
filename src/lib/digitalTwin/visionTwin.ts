
import { VisionTwinData } from './types';

export class ComputerVisionTwinEngine {
  public static assessCowVision(
    bcsScore: number = 3.25,
    locomotionScore: number = 1
  ): VisionTwinData {
    const spineProfile: Array<{ xMeters: number; zMeters: number }> = [];
    const baseHeight = 1.45;
    const archFactor = (locomotionScore - 1) * 0.045;

    for (let i = 0; i < 9; i++) {
      const x = -1.2 + i * 0.3;
      const normalDip = Math.sin((i / 8) * Math.PI) * 0.04;
      const lameArch = Math.sin((i / 8) * Math.PI) * archFactor;
      const z = baseHeight - normalDip + lameArch;

      spineProfile.push({
        xMeters: Math.round(x * 100) / 100,
        zMeters: Math.round(z * 1000) / 1000,
      });
    }

    const curvatureIndex = archFactor;
    const pelvicAngleDegrees = 18.2 - (bcsScore - 3.0) * 3.5;

    let sprecherScore: 1 | 2 | 3 | 4 | 5 = 1;
    if (locomotionScore >= 5) sprecherScore = 5;
    else if (locomotionScore === 4) sprecherScore = 4;
    else if (locomotionScore === 3) sprecherScore = 3;
    else if (locomotionScore === 2) sprecherScore = 2;

    return {
      spineProfile,
      curvatureIndex: Math.round(curvatureIndex * 100) / 100,
      sprecherLamenessScore: sprecherScore,
      pelvicAngleDegrees: Math.round(pelvicAngleDegrees * 10) / 10,
      elancoBcsScore: Math.round(bcsScore * 100) / 100,
    };
  }
}
