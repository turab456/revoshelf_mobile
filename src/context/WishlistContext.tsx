import React, { createContext, useContext, useState, useEffect } from 'react';
import { backendApi } from '../services/backendApi';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  savedBookIds: string[];
  isSaved: (bookId: string) => boolean;
  toggleSave: (bookId: string) => Promise<void>;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedBookIds, setSavedBookIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setSavedBookIds([]);
        setIsLoading(false);
        return;
      }
      try {
        const list = await backendApi.getWishlist();
        setSavedBookIds(list || []);
      } catch (err) {
        console.error('[Wishlist] Failed to load wishlist:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const toggleSave = async (bookId: string) => {
    if (!user) return;
    // Optimistic UI update
    const alreadySaved = savedBookIds.includes(bookId);
    setSavedBookIds((prev) =>
      alreadySaved ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );

    try {
      const isAdded = await backendApi.toggleWishlist(bookId);
      // Reconcile if needed
      setSavedBookIds((prev) => {
        const exists = prev.includes(bookId);
        if (isAdded && !exists) return [...prev, bookId];
        if (!isAdded && exists) return prev.filter((id) => id !== bookId);
        return prev;
      });
    } catch (err) {
      // Rollback on failure
      setSavedBookIds((prev) =>
        alreadySaved ? [...prev, bookId] : prev.filter((id) => id !== bookId)
      );
      throw err;
    }
  };

  const isSaved = (bookId: string) => savedBookIds.includes(bookId);

  return (
    <WishlistContext.Provider value={{ savedBookIds, isSaved, toggleSave, isLoading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
