import type { EventType, Severity } from './types';

/**
 * Single source of truth for monitoring thresholds, severities, weights and
 * risk bands. Imported by BOTH the browser detection engine and the server-side
 * scorer, so detection behaviour and authoritative scoring never drift apart.
 *
 * Everything here is configurable in one place — no magic numbers scattered
 * across the codebase.
 */
export const MONITORING_CONFIG = {
  // Inference cadence: ms between analysed frames. Deliberately not max-FPS.
  sampleIntervalMs: 700,

  // Per-detector debounce settings.
  //  - persistenceMs: condition must hold this long before an event is emitted.
  //  - minConsecutive: condition must be seen on this many consecutive samples.
  //  - cooldownMs: min gap after an event clears before the same type can re-fire.
  detectors: {
    FACE_MISSING: { persistenceMs: 3_000, cooldownMs: 5_000 },
    MULTIPLE_FACES: { minConsecutive: 3, cooldownMs: 5_000 },
    PERSON_ABSENT: { persistenceMs: 15_000, cooldownMs: 10_000 },
    LOOKING_AWAY: { persistenceMs: 2_500, cooldownMs: 5_000 }, // P1
    PHONE_DETECTED: { minConsecutive: 3, cooldownMs: 8_000 }, // P1
  },

  // Severity per event type (§12 of the PRD).
  severity: {
    FACE_MISSING: 'MEDIUM',
    MULTIPLE_FACES: 'HIGH',
    PERSON_ABSENT: 'HIGH',
    LOOKING_AWAY: 'LOW',
    PHONE_DETECTED: 'HIGH',
  },

  // Risk-score weight per event type (§13 of the PRD).
  weights: {
    FACE_MISSING: 2,
    MULTIPLE_FACES: 5,
    PERSON_ABSENT: 4,
    LOOKING_AWAY: 1,
    PHONE_DETECTED: 5,
  },

  // Ascending bands; the first band whose `maxScore` >= score wins. The final
  // band is the catch-all (maxScore = Infinity).
  riskBands: [
    { maxScore: 4, label: 'Normal', level: 'LOW' },
    { maxScore: 9, label: 'Needs Review', level: 'MEDIUM' },
    { maxScore: Number.POSITIVE_INFINITY, label: 'High Suspicion', level: 'HIGH' },
  ],
} as const satisfies {
  sampleIntervalMs: number;
  detectors: Record<
    EventType,
    { persistenceMs?: number; minConsecutive?: number; cooldownMs: number }
  >;
  severity: Record<EventType, Severity>;
  weights: Record<EventType, number>;
  riskBands: ReadonlyArray<{ maxScore: number; label: string; level: Severity }>;
};
