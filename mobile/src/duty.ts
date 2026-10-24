import { useSyncExternalStore } from 'react';

// Tiny shared flag so the app header can show On/Off duty; the Attendance screen sets it.
let onDuty = false;
const subs = new Set<() => void>();

export function setOnDuty(v: boolean) {
  if (v === onDuty) return;
  onDuty = v;
  subs.forEach((f) => f());
}

export const useOnDuty = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => onDuty,
  );
