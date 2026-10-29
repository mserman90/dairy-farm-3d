
import { SpatialRtlsGridState, SpatialZoneData } from './types';

export class SpatialRtlsEngine {
  public static calculateThi(tempC: number, rhPct: number): number {
    const t = tempC;
    const rh = rhPct;
    const thi = (1.8 * t + 32) - (0.55 - 0.0055 * rh) * (1.8 * t - 26);
    return Math.round(thi * 10) / 10;
  }

  public static createInitialGrid(
    ambientTempC: number = 22,
    ambientRhPct: number = 55,
    cows: Array<{ id: string; tag: number; position: [number, number, number] }> = []
  ): SpatialRtlsGridState {
    const zones: SpatialZoneData[] = [];

    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 5; z++) {
        const zoneId = `Z_${x}_${z}`;
        const microTemp = ambientTempC + (z === 2 ? 1.4 : 0.0) + (x > 3 ? 0.8 : -0.4);
        const microRh = ambientRhPct + (z === 2 ? 4.0 : 0.0);
        const thi = this.calculateThi(microTemp, microRh);

        const minX = -30 + x * 5;
        const maxX = minX + 5;
        const minZ = -15 + z * 6;
        const maxZ = minZ + 6;

        const count = cows.filter(
          (c) => c.position[0] >= minX && c.position[0] < maxX && c.position[2] >= minZ && c.position[2] < maxZ
        ).length;

        zones.push({
          zoneId,
          x,
          z,
          temperatureC: Math.round(microTemp * 10) / 10,
          relativeHumidityPct: Math.round(microRh),
          thi,
          cowCount: count,
        });
      }
    }

    return {
      gridDimensions: [8, 5],
      zones,
    };
  }

  public static updateCows(
    grid: SpatialRtlsGridState,
    cows: Array<{ id: string; tag: number; position: [number, number, number] }>
  ): SpatialRtlsGridState {
    const updatedZones = grid.zones.map((zone: SpatialZoneData) => {
      const minX = -30 + zone.x * 5;
      const maxX = minX + 5;
      const minZ = -15 + zone.z * 6;
      const maxZ = minZ + 6;

      const count = cows.filter(
        (c) => c.position[0] >= minX && c.position[0] < maxX && c.position[2] >= minZ && c.position[2] < maxZ
      ).length;

      return {
        ...zone,
        cowCount: count,
      };
    });

    return {
      ...grid,
      zones: updatedZones,
    };
  }
}
