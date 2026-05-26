import { useMemo } from "react";

import { storageKey, useStoredState } from "./storage";

export function favoriteKey(examSlug: string, number: number): string {
  return `${examSlug}:${number}`;
}

export function useFavorites(sessionId: string) {
  const favorites = useStoredState<string[]>(storageKey(sessionId, "favorites"), []);
  const favoriteSet = useMemo(() => new Set(favorites.value), [favorites.value]);

  return {
    favorites: favoriteSet,
    isFavorite: (examSlug: string, number: number) => favoriteSet.has(favoriteKey(examSlug, number)),
    toggleFavorite: (examSlug: string, number: number) => {
      const key = favoriteKey(examSlug, number);
      favorites.setValue((current) =>
        current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
      );
    },
  };
}

