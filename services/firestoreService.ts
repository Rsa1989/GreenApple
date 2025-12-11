
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
  getDocs,
  FirestoreError,
  updateDoc,
  addDoc,
  writeBatch,
  where
} from "firebase/firestore";
import { ProductItem, AppSettings, SimulationItem, Transaction } from "../types";

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

export const addInventoryItem = async (item: ProductItem, customDescription?: string) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Add Product
    const itemRef = doc(db, "products", item.id);
    batch.set(itemRef, item);

    // 2. Add Transaction (Expense)
    const transactionRef = doc(collection(db, "transactions"));
    const transaction: Transaction = {
        id: transactionRef.id,
        type: 'STOCK_ENTRY',
        description: customDescription || `Entrada: ${item.name} ${item.memory} ${item.isUsed ? '(Usado)' : ''}`,
        amount: item.totalCostBrl,
        date: Date.now(),
        relatedId: item.id
    };
    batch.set(transactionRef, transaction);

    await batch.commit();
  } catch (error) {
    console.error("Erro ao adicionar item:", error);
    throw error;
  }
};

export const updateInventoryItem = async (item: ProductItem) => {
  try {
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

// --- SIMULATION & SALES OPERATIONS ---

export const subscribeToSimulations = (
  onData: (items: SimulationItem[]) => void,
  onError: (error: FirestoreError) => void
) => {
  const q = query(collection(db, "simulations"), orderBy("createdAt", "desc"));
  
  return onSnapshot(q, {
    next: (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SimulationItem[];
      onData(items);
    },
    error: (error) => {
      console.error("Firestore Simulation Subscription Error:", error);
      onError(error);
    }
  });
};

export const addSimulation = async (simulation: SimulationItem) => {
  try {
    // Remove undefined fields to prevent Firestore errors
    const cleanSimulation = JSON.parse(JSON.stringify(simulation));
    await addDoc(collection(db, "simulations"), cleanSimulation);
  } catch (error) {
    console.error("Erro ao salvar simulação:", error);
    throw error;
  }
};

export const updateSimulation = async (simulation: SimulationItem) => {
  try {
    if (!simulation.id) throw new Error("ID needed for update");
    const itemRef = doc(db, "simulations", simulation.id);
    // Remove the ID from the data payload so we don't duplicate it inside the doc
    const { id, ...data } = simulation;
    // Remove undefined fields
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(itemRef, cleanData, { merge: true });
  } catch (error) {
    console.error("Erro ao atualizar simulação:", error);
    throw error;
  }
};

export const deleteSimulation = async (id: string) => {
  try {
    await deleteDoc(doc(db, "simulations", id));
  } catch (error) {
    console.error("Erro ao deletar simulação:", error);
    throw error;
  }
};

export const registerSale = async (simulation: SimulationItem) => {
    try {
        const batch = writeBatch(db);

        // 1. Update Simulation Status to 'sold'
        if (simulation.id) {
            const simRef = doc(db, "simulations", simulation.id);
            batch.update(simRef, { status: 'sold', soldAt: Date.now() });
        }

        // 2. Remove from Inventory Logic
        
        // CASE A: Direct link (Simulation came FROM_STOCK)
        if (
            simulation.productId && 
            (simulation.mode === 'FROM_STOCK' || simulation.mode === 'FROM_USED_STOCK')
        ) {
            const prodRef = doc(db, "products", simulation.productId);
            batch.delete(prodRef);
        }
        
        // CASE B: Manual Simulation (Check if there is a reserved item in stock)
        // If the user made an order ("Fazer Pedido") from this simulation, it created an item 
        // with "Promessa de venda para: [Customer]" in observation.
        else if (simulation.mode === 'SIMULATION') {
            // We need to query to find if there is a matching reserved item
            // Use specific fields if available, otherwise name
            const searchName = simulation.productNameOnly || simulation.productName;
            
            // Query products with matching name
            const q = query(collection(db, "products"), where("name", "==", searchName));
            const querySnapshot = await getDocs(q);

            // Iterate to find the specific one reserved for this customer
            for (const docSnap of querySnapshot.docs) {
                const item = docSnap.data() as ProductItem;
                
                // Check if attributes match (Memory/Color)
                const isMemoryMatch = !simulation.productMemory || item.memory === simulation.productMemory;
                const isColorMatch = !simulation.productColor || item.color === simulation.productColor;
                
                // Check observation for reservation
                const reservationKey = `Promessa de venda para: ${simulation.customerName}`;
                const isReservedForClient = item.observation && item.observation.includes(reservationKey);

                if (isMemoryMatch && isColorMatch && isReservedForClient) {
                    // FOUND IT! Delete this stock item
                    batch.delete(docSnap.ref);
                    break; // Only delete one
                }
            }
        }

        // Calculate Net Sale Value (Price - Trade In)
        const tradeInValue = simulation.tradeInValue || 0;
        const netSaleAmount = simulation.sellingPrice - tradeInValue;

        // 3. Create Transaction (Revenue)
        // Note: The amount recorded is the Net amount paid by customer
        const transactionRef = doc(collection(db, "transactions"));
        const transaction: Transaction = {
            id: transactionRef.id,
            type: 'SALE',
            description: `Venda: ${simulation.productName} (${simulation.customerName})`,
            amount: netSaleAmount,
            cost: simulation.totalCostBrl, // Save the cost for profit reports
            date: Date.now(),
            relatedId: simulation.id,
            tradeInValue: tradeInValue // NEW: Save trade-in value for reports
        };
        batch.set(transactionRef, transaction);

        // 4. Handle Trade-In (Create new Used Product)
        if (simulation.tradeInName && simulation.tradeInValue && simulation.tradeInValue > 0) {
            const newProductRef = doc(collection(db, "products"));
            
            // Construct object carefully to avoid undefined values
            const tradeInItem: ProductItem = {
                id: newProductRef.id,
                name: simulation.tradeInName,
                memory: simulation.tradeInMemory || '',
                color: simulation.tradeInColor || '',
                costUsd: 0,
                feeUsd: 0,
                exchangeRate: 0,
                spread: 0,
                importTaxBrl: 0,
                totalCostBrl: simulation.tradeInValue,
                createdAt: Date.now(),
                isUsed: true
            };

            // Only add batteryHealth if it exists
            if (simulation.tradeInBattery !== undefined && simulation.tradeInBattery !== null) {
                tradeInItem.batteryHealth = simulation.tradeInBattery;
            }

            batch.set(newProductRef, tradeInItem);

            // 5. Create Transaction for Trade-In (Asset Entry)
            // User requested this to appear as POSITIVE (Green) in the report (as Asset Gain), but logicaly it is Stock Investment.
            const tradeInTransRef = doc(collection(db, "transactions"));
            const tradeInTransaction: Transaction = {
                id: tradeInTransRef.id,
                type: 'TRADE_IN_ENTRY', // Custom type to render as positive asset entry
                description: `Entrada (Troca): ${simulation.tradeInName}`,
                amount: simulation.tradeInValue, // Positive Value
                date: Date.now(),
                relatedId: newProductRef.id
            };
            batch.set(tradeInTransRef, tradeInTransaction);
        }

        await batch.commit();

    } catch (error) {
        console.error("Erro ao registrar venda:", error);
        throw error;
    }
};

// --- TRANSACTIONS / REPORTS ---

export const subscribeToTransactions = (
  onData: (items: Transaction[]) => void,
  onError: (error: FirestoreError) => void
) => {
  const q = query(collection(db, "transactions"), orderBy("date", "desc"));
  
  return onSnapshot(q, {
    next: (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Transaction[];
      onData(items);
    },
    error: (error) => {
      console.error("Firestore Transaction Subscription Error:", error);
      onError(error);
    }
  });
};

export const deleteTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, "transactions", id));
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    throw error;
  }
};

export const clearTransactions = async () => {
  try {
    const q = query(collection(db, "transactions"));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Erro ao limpar transações:", error);
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
