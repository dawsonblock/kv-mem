'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { 
  FavoriteItem, 
  getLocalFavorites, 
  saveLocalFavorites, 
  addFavoriteToFirestore, 
  removeFavoriteFromFirestore, 
  subscribeToFavorites 
} from './favorites';

interface FavoritesContextType {
  favorites: FavoriteItem[];
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (item: {
    itemId: string;
    itemType: 'subsystem' | 'benchmark' | 'rc_gate' | 'profile' | 'code_snippet';
    title: string;
    category: string;
    summary: string;
  }) => Promise<void>;
  removeFavorite: (itemId: string) => Promise<void>;
  count: number;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorited: () => false,
  toggleFavorite: async () => {},
  removeFavorite: async () => {},
  count: 0,
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => getLocalFavorites());

  // Sync favorites when auth state changes
  useEffect(() => {
    if (user) {
      // Subscribed to user's Firestore favorites collection
      const unsubscribe = subscribeToFavorites(
        user.uid,
        (items) => {
          setFavorites(items);
        },
        (err) => {
          console.error('Favorites subscription error:', err);
          // Fall back to local
          setFavorites(getLocalFavorites());
        }
      );

      // Auto-migrate any unauthenticated guest favorites into Firestore
      const localItems = getLocalFavorites();
      if (localItems.length > 0) {
        localItems.forEach(async (item) => {
          try {
            await addFavoriteToFirestore(user.uid, item);
          } catch (e) {
            console.warn('Could not migrate local favorite:', e);
          }
        });
        saveLocalFavorites([]); // clear migrated
      }

      return () => unsubscribe();
    } else {
      // Guest mode: update async if user just signed out
      const timer = setTimeout(() => {
        setFavorites(getLocalFavorites());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const isFavorited = (itemId: string): boolean => {
    return favorites.some((f) => f.itemId === itemId);
  };

  const toggleFavorite = async (item: {
    itemId: string;
    itemType: 'subsystem' | 'benchmark' | 'rc_gate' | 'profile' | 'code_snippet';
    title: string;
    category: string;
    summary: string;
  }) => {
    const exists = isFavorited(item.itemId);

    if (exists) {
      await removeFavorite(item.itemId);
    } else {
      const newItem: FavoriteItem = {
        id: item.itemId,
        itemId: item.itemId,
        itemType: item.itemType,
        title: item.title,
        category: item.category,
        summary: item.summary,
        createdAt: new Date().toISOString(),
      };

      if (user) {
        // Cloud Firestore
        await addFavoriteToFirestore(user.uid, newItem);
      } else {
        // Local Storage
        const updated = [...favorites, newItem];
        setFavorites(updated);
        saveLocalFavorites(updated);
      }
    }
  };

  const removeFavorite = async (itemId: string) => {
    if (user) {
      await removeFavoriteFromFirestore(user.uid, itemId);
    } else {
      const updated = favorites.filter((f) => f.itemId !== itemId);
      setFavorites(updated);
      saveLocalFavorites(updated);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorited,
        toggleFavorite,
        removeFavorite,
        count: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
