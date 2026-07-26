import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  doc, 
  updateDoc, 
  deleteDoc,
  increment,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Photo, GuestMessage } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || undefined);
export const auth = getAuth(app);

// Ensure anonymous authentication for guests if enabled in Firebase
export const initAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err: any) {
    // Ignore admin-restricted-operation if Anonymous auth is not enabled in Firebase console
    if (err?.code !== 'auth/admin-restricted-operation') {
      console.warn('Autenticação anônima opcional não concluída:', err?.message || err);
    }
  }
};

// Memory & Session Cache
let cachedPhotos: Photo[] | null = null;
let cachedMessages: GuestMessage[] | null = null;

// Fetch Photos Once (Optimized to reduce Firestore reads)
export const getPhotosOnce = async (forceRefresh = false): Promise<Photo[]> => {
  if (!forceRefresh && cachedPhotos) {
    return cachedPhotos;
  }
  try {
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const photosList: Photo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      }
      return {
        id: doc.id,
        photoUrl: data.photoUrl,
        authorName: data.authorName || 'Convidado Especial',
        caption: data.caption || '',
        likes: data.likes || 0,
        filter: data.filter || 'normal',
        createdAt: createdAtStr,
      };
    });
    cachedPhotos = photosList;
    return photosList;
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    return cachedPhotos || [];
  }
};

// Fetch Messages Once (Optimized to reduce Firestore reads)
export const getMessagesOnce = async (forceRefresh = false): Promise<GuestMessage[]> => {
  if (!forceRefresh && cachedMessages) {
    return cachedMessages;
  }
  try {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    const messagesList: GuestMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      }
      return {
        id: doc.id,
        authorName: data.authorName || 'Convidado(a)',
        content: data.content || '',
        category: (data.category as 'desejo' | 'lembranca' | 'carinho') || 'carinho',
        likes: data.likes || 0,
        createdAt: createdAtStr,
      };
    });
    cachedMessages = messagesList;
    return messagesList;
  } catch (error) {
    console.error('Erro ao buscar recados:', error);
    return cachedMessages || [];
  }
};

// Photos Realtime Listener (with limit to save reads)
export const subscribeToPhotos = (callback: (photos: Photo[]) => void) => {
  const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const photosList: Photo[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      }
      return {
        id: doc.id,
        photoUrl: data.photoUrl,
        authorName: data.authorName || 'Convidado Especial',
        caption: data.caption || '',
        likes: data.likes || 0,
        filter: data.filter || 'normal',
        createdAt: createdAtStr,
      };
    });
    cachedPhotos = photosList;
    callback(photosList);
  }, (error) => {
    console.error('Erro no listener de fotos:', error);
  });
};

// Messages Realtime Listener (with limit to save reads)
export const subscribeToMessages = (callback: (messages: GuestMessage[]) => void) => {
  const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const messagesList: GuestMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt;
      }
      return {
        id: doc.id,
        authorName: data.authorName || 'Convidado(a)',
        content: data.content || '',
        category: (data.category as 'desejo' | 'lembranca' | 'carinho') || 'carinho',
        likes: data.likes || 0,
        createdAt: createdAtStr,
      };
    });
    cachedMessages = messagesList;
    callback(messagesList);
  }, (error) => {
    console.error('Erro no listener de recados:', error);
  });
};

// Add Photo Document
export const addPhoto = async (photo: {
  photoUrl: string;
  authorName: string;
  caption?: string;
  filter?: string;
}) => {
  await initAuth();
  const docRef = await addDoc(collection(db, 'photos'), {
    photoUrl: photo.photoUrl,
    authorName: photo.authorName,
    caption: photo.caption || '',
    filter: photo.filter || 'normal',
    likes: 0,
    createdAt: Timestamp.now(),
  });
  return docRef;
};

// Add Message Document
export const addMessage = async (msg: {
  authorName: string;
  content: string;
  category: 'desejo' | 'lembranca' | 'carinho';
}) => {
  await initAuth();
  const docRef = await addDoc(collection(db, 'messages'), {
    authorName: msg.authorName,
    content: msg.content,
    category: msg.category,
    likes: 0,
    createdAt: Timestamp.now(),
  });
  return docRef;
};

// Like Photo
export const likePhoto = async (photoId: string) => {
  const photoRef = doc(db, 'photos', photoId);
  await updateDoc(photoRef, {
    likes: increment(1),
  });
};

// Like Message
export const likeMessage = async (messageId: string) => {
  const msgRef = doc(db, 'messages', messageId);
  await updateDoc(msgRef, {
    likes: increment(1),
  });
};

// Delete Photo Document
export const deletePhotoDoc = async (photoId: string) => {
  const photoRef = doc(db, 'photos', photoId);
  await deleteDoc(photoRef);
  if (cachedPhotos) {
    cachedPhotos = cachedPhotos.filter((p) => p.id !== photoId);
  }
};

// Update Photo URL Document (used when moving photo to Google Drive)
export const updatePhotoUrl = async (photoId: string, newPhotoUrl: string) => {
  const photoRef = doc(db, 'photos', photoId);
  await updateDoc(photoRef, {
    photoUrl: newPhotoUrl,
  });
  if (cachedPhotos) {
    cachedPhotos = cachedPhotos.map((p) => p.id === photoId ? { ...p, photoUrl: newPhotoUrl } : p);
  }
};

// Delete Message Document
export const deleteMessageDoc = async (messageId: string) => {
  const msgRef = doc(db, 'messages', messageId);
  await deleteDoc(msgRef);
  if (cachedMessages) {
    cachedMessages = cachedMessages.filter((m) => m.id !== messageId);
  }
};

