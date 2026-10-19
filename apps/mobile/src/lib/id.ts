import * as Crypto from 'expo-crypto';

/** Client generated ids keep the outbox writable while offline. */
export function createId(): string {
  return Crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
