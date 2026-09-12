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

export interface SimulationSnapshotItem {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  turnIndex: number;
  turnAction: string;
  tokensCount: number;
  vramPages: number;
  dramPages: number;
  nvmePages: number;
  nodeCount: number;
  imageData?: string;
  createdAt: string;
}

const LOCAL_STORAGE_SNAPSHOTS_KEY = 'kvmem_simulation_history_snapshots';

export function getLocalSnapshots(): SimulationSnapshotItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SNAPSHOTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read local snapshots', err);
    return [];
  }
}

export function saveLocalSnapshots(items: SimulationSnapshotItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SNAPSHOTS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save local snapshots', err);
  }
}

export async function addSnapshotToFirestore(
  userId: string, 
  item: Omit<SimulationSnapshotItem, 'createdAt'>
): Promise<void> {
  const safeDocId = item.id.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/snapshots/${safeDocId}`;
  try {
    const snapRef = doc(db, 'users', userId, 'snapshots', safeDocId);
    await setDoc(snapRef, {
      userId,
      scenarioId: item.scenarioId,
      scenarioTitle: item.scenarioTitle,
      turnIndex: item.turnIndex,
      turnAction: item.turnAction,
      tokensCount: item.tokensCount || 0,
      vramPages: item.vramPages || 0,
      dramPages: item.dramPages || 0,
      nvmePages: item.nvmePages || 0,
      nodeCount: item.nodeCount || 0,
      imageData: item.imageData || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeSnapshotFromFirestore(userId: string, snapshotId: string): Promise<void> {
  const safeDocId = snapshotId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const path = `users/${userId}/snapshots/${safeDocId}`;
  try {
    const snapRef = doc(db, 'users', userId, 'snapshots', safeDocId);
    await deleteDoc(snapRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToSnapshots(
  userId: string,
  onUpdate: (items: SimulationSnapshotItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `users/${userId}/snapshots`;
  const snapCol = collection(db, 'users', userId, 'snapshots');
  
  return onSnapshot(
    snapCol,
    (snapshot) => {
      const results: SimulationSnapshotItem[] = [];
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
          scenarioId: data.scenarioId || 'unknown',
          scenarioTitle: data.scenarioTitle || 'Untitled Scenario',
          turnIndex: typeof data.turnIndex === 'number' ? data.turnIndex : 0,
          turnAction: data.turnAction || 'Simulation Snapshot',
          tokensCount: data.tokensCount || 0,
          vramPages: data.vramPages || 0,
          dramPages: data.dramPages || 0,
          nvmePages: data.nvmePages || 0,
          nodeCount: data.nodeCount || 0,
          imageData: data.imageData || undefined,
          createdAt: createdStr,
        });
      });

      // Sort descending by creation date
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

/**
 * Serializes the rendered D3 SVG graph element into a PNG data URL.
 */
export async function captureSvgAsPng(
  svgElement: SVGSVGElement, 
  width = 800, 
  height = 520
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      
      clonedSvg.setAttribute('width', String(width));
      clonedSvg.setAttribute('height', String(height));
      
      // Inline background rect
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#020617'); // Dark slate-950 backdrop
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

      const xml = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);
      
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URLObj.revokeObjectURL(blobURL);
            resolve(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`);
            return;
          }
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          URLObj.revokeObjectURL(blobURL);
          const pngUrl = canvas.toDataURL('image/png', 0.85);
          resolve(pngUrl);
        } catch {
          URLObj.revokeObjectURL(blobURL);
          resolve(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`);
        }
      };
      image.onerror = () => {
        URLObj.revokeObjectURL(blobURL);
        resolve(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`);
      };
      image.src = blobURL;
    } catch (e) {
      console.warn('SVG snapshot serialization fallback:', e);
      resolve('');
    }
  });
}
