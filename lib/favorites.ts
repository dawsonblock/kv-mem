import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface FavoriteItem {
  id: string;
  itemId: string;
  itemType: 'subsystem' | 'benchmark' | 'rc_gate' | 'profile' | 'code_snippet';
  title: string;
  category: string;
  summary: string;
  createdAt?: string | number | Date;
}

const LOCAL_STORAGE_FAVORITES_KEY = 'kvmem_guest_favorites';

export function getLocalFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read local favorites', err);
    return [];
  }
}

export function saveLocalFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save local favorites', err);
  }
}

export async function addFavoriteToFirestore(userId: string, item: Omit<FavoriteItem, 'id'>): Promise<void> {
  const safeDocId = item.itemId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/favorites/${safeDocId}`;
  try {
    const favRef = doc(db, 'users', userId, 'favorites', safeDocId);
    await setDoc(favRef, {
      userId,
      itemId: item.itemId,
      itemType: item.itemType,
      title: item.title,
      category: item.category || 'General',
      summary: item.summary || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeFavoriteFromFirestore(userId: string, itemId: string): Promise<void> {
  const safeDocId = itemId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/favorites/${safeDocId}`;
  try {
    const favRef = doc(db, 'users', userId, 'favorites', safeDocId);
    await deleteDoc(favRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToFavorites(
  userId: string,
  onUpdate: (items: FavoriteItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/favorites`;
  const favsCol = collection(db, 'users', userId, 'favorites');
  
  return onSnapshot(
    favsCol,
    (snapshot) => {
      const results: FavoriteItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let createdStr = new Date().toISOString();
        if (data.createdAt instanceof Timestamp) {
          createdStr = data.createdAt.toDate().toISOString();
        } else if (data.createdAt) {
          createdStr = String(data.createdAt);
        }

        results.push({
          id: docSnap.id,
          itemId: data.itemId || docSnap.id,
          itemType: data.itemType || 'subsystem',
          title: data.title || 'Untitled item',
          category: data.category || '',
          summary: data.summary || '',
          createdAt: createdStr,
        });
      });
      onUpdate(results);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        if (onError) onError(e as Error);
      }
    }
  );
}
