// Framework-agnostic monitoring types.
// IMPORTANT: this module must stay free of any server-only or Prisma imports so
// it can be safely bundled into the browser-side detection engine.

/** Suspicious-activity categories. Mirrors the Prisma `EventType` enum. */
export type EventType =
  | 'FACE_MISSING'
  | 'MULTIPLE_FACES'
  | 'PHONE_DETECTED'
  | 'LOOKING_AWAY'
  | 'PERSON_ABSENT';

/** Event severity. Mirrors the Prisma `Severity` enum. */
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

/** Payload the browser sends to the backend for a single (debounced) event. */
export interface MonitoringEventInput {
  eventType: EventType;
  severity: Severity;
  /** Model confidence in [0,1] when the detector exposes it. */
  confidence?: number | null;
  /** ISO-8601 timestamp when the condition began. */
  startedAt: string;
  /** ISO-8601 timestamp when the condition cleared, if known. */
  endedAt?: string | null;
  /** Whole seconds the condition persisted, if known. */
  durationSeconds?: number | null;
}
