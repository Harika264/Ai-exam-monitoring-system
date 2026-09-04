import { describe, expect, it } from 'vitest';
import { computeMonitoringScore, riskBand } from '@/lib/scoring';

describe('computeMonitoringScore', () => {
  it('returns 0 when there are no events', () => {
    expect(computeMonitoringScore([])).toBe(0);
  });

  it('sums the configured weight of each event', () => {
    const score = computeMonitoringScore([
      { eventType: 'LOOKING_AWAY' }, // 1
      { eventType: 'FACE_MISSING' }, // 2
      { eventType: 'MULTIPLE_FACES' }, // 5
    ]);
    expect(score).toBe(8);
  });
});

describe('riskBand', () => {
  it('classifies scores per the configured thresholds', () => {
    expect(riskBand(0).label).toBe('Normal');
    expect(riskBand(4).label).toBe('Normal');
    expect(riskBand(5).label).toBe('Needs Review');
    expect(riskBand(9).label).toBe('Needs Review');
    expect(riskBand(10).label).toBe('High Suspicion');
    expect(riskBand(50).label).toBe('High Suspicion');
  });
});
