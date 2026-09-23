import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-erro";

// DataLoader batch functions must return one result per key, in key order.
export function orderByKeys<K, T>(keys: readonly K[], rows: T[], keyOf: (row: T) => K): (T | null)[] {
  const rowsByKey = new Map(rows.map((row) => [keyOf(row), row]));
  return keys.map((key) => rowsByKey.get(key) ?? null);
}

export function orderByKeysOrError<K, T>(keys: readonly K[], rows: T[], keyOf: (row: T) => K): (T | Error)[] {
  return orderByKeys(keys, rows, keyOf).map((row) => row ?? new ResourceNotFoundError());
}
