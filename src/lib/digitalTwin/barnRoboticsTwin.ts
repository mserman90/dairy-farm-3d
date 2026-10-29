
import { BarnRoboticsFleetState } from './types';

export class BarnRoboticsFleetEngine {
  public static createInitialFleet(): BarnRoboticsFleetState {
    return {
      feedPusher: {
        id: 'robot_juno_x',
        name: 'Juno-X Otonom Yem İtici',
        type: 'FEED_PUSHER',
        status: 'RUNNING',
        batteryPct: 88,
        hopperFillPct: 0,
        position: [-10, 0.25, 1.7],
        routeProgressPct: 45,
        cyclesCompletedToday: 12,
      },
      manureCleaner: {
        id: 'robot_discovery_vac',
        name: 'Discovery-Vac Gübre Vakumu',
        type: 'MANURE_CLEANER',
        status: 'RUNNING',
        batteryPct: 74,
        hopperFillPct: 32,
        position: [-16, 0.25, -5.8],
        routeProgressPct: 60,
        cyclesCompletedToday: 8,
      },
      dockingStationPos: [12, 0.2, 0],
    };
  }

  public static stepFleet(
    fleet: BarnRoboticsFleetState,
    deltaSeconds: number
  ): BarnRoboticsFleetState {
    const next: BarnRoboticsFleetState = JSON.parse(JSON.stringify(fleet));

    if (next.feedPusher.status === 'RUNNING') {
      next.feedPusher.batteryPct = Math.max(15, next.feedPusher.batteryPct - (deltaSeconds / 180));
      next.feedPusher.routeProgressPct = (next.feedPusher.routeProgressPct + (deltaSeconds * 2.0)) % 100;
      if (next.feedPusher.batteryPct <= 20) next.feedPusher.status = 'DOCKING';
    } else if (next.feedPusher.status === 'CHARGING') {
      next.feedPusher.batteryPct = Math.min(100, next.feedPusher.batteryPct + (deltaSeconds / 30));
      if (next.feedPusher.batteryPct >= 95) {
        next.feedPusher.status = 'RUNNING';
        next.feedPusher.cyclesCompletedToday += 1;
      }
    } else if (next.feedPusher.status === 'DOCKING') {
      next.feedPusher.status = 'CHARGING';
    }

    if (next.manureCleaner.status === 'RUNNING') {
      next.manureCleaner.batteryPct = Math.max(15, next.manureCleaner.batteryPct - (deltaSeconds / 150));
      next.manureCleaner.hopperFillPct = Math.min(100, next.manureCleaner.hopperFillPct + (deltaSeconds / 60));
      next.manureCleaner.routeProgressPct = (next.manureCleaner.routeProgressPct + (deltaSeconds * 1.8)) % 100;
      if (next.manureCleaner.hopperFillPct >= 90 || next.manureCleaner.batteryPct <= 20) {
        next.manureCleaner.status = 'DOCKING';
      }
    } else if (next.manureCleaner.status === 'CHARGING') {
      next.manureCleaner.batteryPct = Math.min(100, next.manureCleaner.batteryPct + (deltaSeconds / 30));
      next.manureCleaner.hopperFillPct = Math.max(0, next.manureCleaner.hopperFillPct - (deltaSeconds * 10));
      if (next.manureCleaner.batteryPct >= 90 && next.manureCleaner.hopperFillPct === 0) {
        next.manureCleaner.status = 'RUNNING';
        next.manureCleaner.cyclesCompletedToday += 1;
      }
    } else if (next.manureCleaner.status === 'DOCKING') {
      next.manureCleaner.status = 'CHARGING';
    }

    return next;
  }
}
