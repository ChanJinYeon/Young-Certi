import { useCallback, useMemo, useState } from "react";

export type StorageState<T> = {
  value: T;
  setValue: (next: T | ((current: T) => T)) => void;
  isEphemeral: boolean;
};

const memory = new Map<string, string>();

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key) ?? memory.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): boolean {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return false;
  } catch {
    memory.set(key, serialized);
    return true;
  }
}

export function useStoredState<T>(key: string, fallback: T): StorageState<T> {
  const initial = useMemo(() => read(key, fallback), [key, fallback]);
  const [value, setLocalValue] = useState(initial);
  const [isEphemeral, setEphemeral] = useState(false);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      setLocalValue((current) => {
        const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
        setEphemeral(write(key, resolved));
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue, isEphemeral };
}

export function storageKey(sessionId: string, name: string): string {
  return `young-certi/v1/${sessionId}/${name}`;
}

