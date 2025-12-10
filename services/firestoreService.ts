
import { db } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc,
  FirestoreError,
  updateDoc
} from "firebase/firestore";
import { ProductItem, AppSettings } from "../types";

// --- INVENTORY OPERATIONS ---

export const subscribeToInventory = (
  onData: (items: ProductItem[]) => void,
  onError: (error: FirestoreError) => void
) => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, {
    next: (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ProductItem[];
      onData(items);
    },
    error: (error) => {
      console.error("Firestore Inventory Subscription Error:", error);
      onError(error);
    }
  });
};

export const addInventoryItem = async (item: ProductItem) => {
  try {
    const itemRef = doc(db, "products", item.id);
    await setDoc(itemRef, item);
  } catch (error) {
    console.error("Erro ao adicionar item:", error);
    throw error;
  }
};

export const updateInventoryItem = async (item: ProductItem) => {
  try {
    // We use setDoc with merge: true or just overwrite since we are passing the full object
    // Or specifically updateDoc if we want to be partial, but here we replace the data except ID
    const itemRef = doc(db, "products", item.id);
    await setDoc(itemRef, item, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar item:", error);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error("Erro ao deletar item:", error);
    throw error;
  }
};

// --- SETTINGS OPERATIONS ---

const SETTINGS_DOC_ID = "global_settings";

export const saveSettings = async (settings: AppSettings) => {
  try {
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), settings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    throw error;
  }
};

export const fetchSettings = async (): Promise<AppSettings | null> => {
  try {
    const docRef = doc(db, "settings", SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return null;
  }
};

export const subscribeToSettings = (
  onData: (settings: AppSettings) => void,
  onError?: (error: FirestoreError) => void
) => {
    return onSnapshot(doc(db, "settings", SETTINGS_DOC_ID), {
      next: (doc) => {
        if (doc.exists()) {
            onData(doc.data() as AppSettings);
        }
      },
      error: (error) => {
        console.error("Firestore Settings Subscription Error:", error);
        if (onError) onError(error);
      }
    });
}
