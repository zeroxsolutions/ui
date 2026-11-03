/**
 * A semantic status, read the same way on every surface. online: connected,
 * enabled, active. offline: disconnected, disabled. busy: an error,
 * unavailable. idle: pending, away.
 */
type StatusTone = 'online' | 'offline' | 'busy' | 'idle';

export type { StatusTone };
