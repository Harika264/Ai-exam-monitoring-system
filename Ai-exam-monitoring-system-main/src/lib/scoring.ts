import { MONITORING_CONFIG } from '@/monitoring/config';
import type { EventType, Severity } from '@/monitoring/types';

export interface ScorableEvent {
  eventType: EventType;
}

/**
 * Authoritative monitoring risk score: the sum of configured per-event weights.
 * Computed on the server from persisted events — never trusted from the client.
 */
export function computeMonitoringScore(events: ScorableEvent[]): number {
  return events.reduce(
    (total, event) => total + (MONITORING_CONFIG.weights[event.eventType] ?? 0),
    0,
  );
}

export interface RiskBand {
  label: string;
  level: Severity;
}

/** Maps a numeric monitoring score to its configured risk band. */
export function riskBand(score: number): RiskBand {
  const bands = MONITORING_CONFIG.riskBands;
  const match = bands.find((band) => score <= band.maxScore) ?? bands[bands.length - 1];
  return { label: match.label, level: match.level };
}
