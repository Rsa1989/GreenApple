import React, { useState, useEffect } from 'react';
import { Inventory } from './components/Inventory';
import { CalculatorComponent } from './components/Calculator';
import { Configuration } from './components/Configuration';
import { SimulationHistory } from './components/SimulationHistory';
import { Reports } from './components/Reports';
import { Login } from './components/Login';
import { ProductItem, AppSettings, SimulationItem, Transaction } from './types';
import { LayoutList, Calculator as CalcIcon, Settings, Package2, WifiOff, AlertTriangle, ExternalLink, History, TrendingUp } from 'lucide-react';
import { 
  subscribeToInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem, 
  subscribeToSettings, 
  saveSettings,
  addSimulation,
  updateSimulation,
  subscribeToSimulations,
  deleteSimulation,
  registerSale,
  subscribeToTransactions,
  clearTransactions,
  deleteTransaction
} from './services/firestoreService';

// Helper to convert Hex to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [56, 168, 120]; // Default green
};

const mix = (color: [number, number, number], mixColor: [number, number, number], weight: number) => {
  return [
    Math.round(color[0] * (1 - weight) + mixColor[0] * weight),
    Math.round(color[1] * (1 - weight) + mixColor[1] * weight),
    Math.round(color[2] * (1 - weight) + mixColor[2] * weight),
  ];
};

const generateInstallmentRules = () => {
  const rules = Array.from({ length: 12 }, (_, i) => ({
    installments: i + 1,
    rate: i === 0 ? 0 : (i * 1.5)
  }));
  // Add 18x option
  rules.push({
    installments: 18,
    rate: 27 // Default logic: 1.5 * 18, user can change later
  });
  return rules;
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultFeeUsd: 0,
  defaultSpread: 0.10,
  defaultImportTax: 0,
  installmentRules: generateInstallmentRules(),
  themeColor: '#38a878',
  headerBackgroundColor: '#ffffff',
  backgroundColor: '#f9fafb',
  logoUrl: null,
  whatsappTemplate: `Olá, segue o orçamento conforme solicitado:

📱 *{produto}*
💵 À vista: {preco}

💳 Parcelamento:
{parcelas}

Para outras parcelas, peço que entre em contato diretamente por esse número.

Obrigado por escolher a GreenApple!!`,
  whatsappTradeInLabel: "Troca",
  whatsappTradeInValueLabel: "Valor Avaliado",
  whatsappTotalLabel: "Total a pagar",
  adminPassword: '1234'
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'calculator' | 'history' | 'reports' | 'settings'>('inventory');
  const [items, setItems] = useState<ProductItem[]>([]);
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // State for editing simulation
  const [simulationToEdit, setSimulationToEdit] = useState<SimulationItem | null>(null);

  // State for converting simulation to order (Inventory)
  const [simulationToOrder, setSimulationToOrder] = useState<SimulationItem | null>(null);
  
  // Database Error States
  const [dbError, setDbError] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);

  // Check Session Storage for Auth (SessionStorage clears when tab/browser closes)
  useEffect(() => {
    const auth = sessionStorage.getItem('greenapple_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('greenapple_auth', 'true');
  };

  // 1. Subscribe to Inventory Data
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: () => void;
    
    unsubscribe = subscribeToInventory(
      (data) => {
        setItems(data);
        setDbError(null);
        setIsPermissionError(false);
      },
      (error) => {
        console.error("App Inventory Error:", error);
        
        if (error.code === 'permission-denied') {
           setDbError("Permissão negada. O banco de dados não está acessível.");
           setIsPermissionError(true);
        } else if (error.message.includes("Cloud Firestore API has not been used")) {
           setDbError("A API do Firestore não foi ativada no projeto.");
           setIsPermissionError(true);
        } else {
           setDbError(`Erro de conexão: ${error.message}`);
        }
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // 2. Subscribe to Settings Data
  useEffect(() => {
    let unsubscribe: () => void;
    
    unsubscribe = subscribeToSettings(
      (data) => {
        // Handle migration for existing users: Ensure 18x rule exists if missing
        const mergedSettings = { ...DEFAULT_SETTINGS, ...data };
        
        const has18x = mergedSettings.installmentRules.some(r => r.installments === 18);
        if (!has18x) {
            mergedSettings.installmentRules = [
                ...mergedSettings.installmentRules,
                { installments: 18, rate: 27 } // 27% default for 18x
            ].sort((a, b) => a.installments - b.installments);
        }

        // Handle migration for new labels
        if (!mergedSettings.whatsappTradeInLabel) mergedSettings.whatsappTradeInLabel = "Troca";
        if (!mergedSettings.whatsappTradeInValueLabel) mergedSettings.whatsappTradeInValueLabel = "Valor Avaliado";
        if (!mergedSettings.whatsappTotalLabel) mergedSettings.whatsappTotalLabel = "Total a pagar";

        setSettings(mergedSettings);
      },
      (error) => {
          console.warn("Settings sync warning:", error.message);
      }
    );
    
    return () => {
        if (unsubscribe) unsubscribe();
    }
  }, []);

  // 3. Subscribe to Simulations Data
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: () => void;
    
    unsubscribe = subscribeToSimulations(
      (data) => {
        setSimulations(data);
      },
      (error) => {
        console.error("Simulation Subscription Error:", error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);

  // 4. Subscribe to Transactions Data
  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: () => void;
    
    unsubscribe = subscribeToTransactions(
      (data) => {
        setTransactions(data);
      },
      (error) => {
        console.error("Transaction Subscription Error:", error);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);


  // Update Theme CSS Variables
  useEffect(() => {
    const baseColor = hexToRgb(settings.themeColor);
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];

    const palette = {
      50: mix(baseColor, white, 0.95),
      100: mix(baseColor, white, 0.8),
      200: mix(baseColor, white, 0.6),
      300: mix(baseColor, white, 0.4),
      400: mix(baseColor, white, 0.2),
      500: baseColor,
      600: mix(baseColor, black, 0.1),
      700: mix(baseColor, black, 0.3),
      800: mix(baseColor, black, 0.5),
      900: mix(baseColor, black, 0.7),
    };

    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--color-apple-${key}`, value.join(' '));
    });

    if (document.body) {
        document.body.style.backgroundColor = settings.backgroundColor;
    }

  }, [settings.themeColor, settings.backgroundColor]);

  const handleAddItem = async (item: ProductItem, customDescription?: string) => {
    try {
        await addInventoryItem(item, customDescription);
    } catch (error: any) {
        alert("Erro ao salvar: " + error.message);
    }
  };

  const handleUpdateItem = async (item: ProductItem) => {
    try {
        await updateInventoryItem(item);
    } catch (error: any) {
        alert("Erro ao atualizar: " + error.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
        await deleteInventoryItem(id);
    } catch (error: any) {
        alert("Erro ao deletar item: " + error.message);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
        await saveSettings(newSettings);
    } catch (error: any) {
        alert("Erro ao salvar configurações: " + error.message);
    }
  };

  const handleSaveSimulation = async (simulation: SimulationItem) => {
    try {
        if (simulation.id && simulation.id !== '') {
            // Update existing
             await updateSimulation(simulation);
        } else {
            // Create new
            await addSimulation(simulation);
        }
        // Switch to history tab to show success/result
        setActiveTab('history');
        // Clear edit state
        setSimulationToEdit(null);
    } catch (error: any) {
        alert("Erro ao salvar simulação: " + error.message);
    }
  };

  const handleDeleteSimulation = async (id: string) => {
      try {
          await deleteSimulation(id);
      } catch (error: any) {
          alert("Erro ao apagar simulação: " + error.message);
      }
  };

  const handleSellSimulation = async (simulation: SimulationItem) => {
      try {
          await registerSale(simulation);
      } catch (error: any) {
          alert("Erro ao registrar venda: " + error.message);
      }
  };

  const handleClearReports = async () => {
      try {
          await clearTransactions();
      } catch (error: any) {
          alert("Erro ao limpar relatórios: " + error.message);
      }
  };

  const handleDeleteTransactionRow = async (id: string) => {
    try {
        await deleteTransaction(id);
    } catch (error: any) {
        alert("Erro ao excluir transação: " + error.message);
    }
  };
  
  const handleEditSimulation = (simulation: SimulationItem) => {
      setSimulationToEdit(simulation);
      setActiveTab('calculator');
  };

  const handleCancelEdit = () => {
    setSimulationToEdit(null);
  };

  const handleOrderProduct = async (simulation: SimulationItem) => {
    if (simulation.id) {
        try {
            // Mark as ordered in DB to prevent duplicates
            await updateSimulation({ ...simulation, status: 'ordered' });
        } catch (error) {
            console.error("Failed to update status to ordered", error);
        }
    }
    setSimulationToOrder(simulation);
    setActiveTab('inventory');
  };

  const handleClearOrderData = () => {
    setSimulationToOrder(null);
  };

  // --- RENDER LOGIC ---

  if (!isAuthenticated) {
      return <Login settings={settings} onLogin={handleLogin} />;
  }

  if (isPermissionError) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
              <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
                  <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Configuração Pendente</h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                      O app está conectado ao Firebase, mas o <b>Banco de Dados (Firestore)</b> ainda não foi criado ou configurado corretamente.
                  </p>

                  <div className="text-left bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-3">
                      <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Como resolver:</h3>
                      <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                          <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 hover:underline">Console do Firebase</a>.</li>
                          <li>Clique no menu <b>Criação (Build)</b> &gt; <b>Firestore Database</b>.</li>
                          <li>Clique em <b>Criar banco de dados</b>.</li>
                          <li><span className="font-bold text-red-600">Importante:</span> Selecione <b>"Iniciar no modo de teste"</b> (Start in test mode) nas regras de segurança.</li>
                          <li>Aguarde 1 minuto e recarregue esta página.</li>
                      </ol>
                  </div>

                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Ir para o Console do Firebase
                    <ExternalLink className="w-4 h-4" />
                  </a>
              </div>
          </div>
      );
  }

  if (dbError && !isPermissionError) {
       return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50">
              <WifiOff className="w-12 h-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
              <p className="text-gray-600 mb-6 max-w-md">{dbError}</p>
              <button onClick={() => window.location.reload()} className="bg-gray-900 text-white px-6 py-2 rounded-lg">
                 Tentar Novamente
              </button>
          </div>
      );
  }

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      {/* Sticky Top Header */}
      <header 
        className="border-b border-gray-200 sticky top-0 z-30 transition-all duration-300 shadow-sm"
        style={{ backgroundColor: settings.headerBackgroundColor }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 min-h-[80px] flex items-center justify-center relative">
            <div className="flex items-center gap-2">
               {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain drop-shadow-sm transition-all hover:scale-105" />
               ) : (
                  <div className="flex items-center gap-3">
                     <div className="bg-apple-500 rounded-xl p-2.5 text-white shadow-md shadow-apple-200">
                        <Package2 className="w-8 h-8" />
                     </div>
                     <h1 className="text-2xl font-bold text-apple-700 tracking-tight">GreenApple</h1>
                  </div>
               )}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl mx-auto px-4 w-full py-6">
        {activeTab === 'inventory' && (
          <Inventory 
            items={items} 
            settings={settings}
            onAddItem={handleAddItem} 
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            initialOrderData={simulationToOrder}
            onClearOrderData={handleClearOrderData}
          />
        )}
        
        {activeTab === 'calculator' && (
          <CalculatorComponent 
            inventory={items} 
            settings={settings}
            onSaveSimulation={handleSaveSimulation}
            initialData={simulationToEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === 'history' && (
          <SimulationHistory 
            simulations={simulations}
            inventory={items}
            onDelete={handleDeleteSimulation}
            onSelect={handleEditSimulation}
            onSell={handleSellSimulation}
            onOrder={handleOrderProduct}
          />
        )}

        {activeTab === 'reports' && (
          <Reports 
            transactions={transactions}
            onClear={handleClearReports}
            onDeleteTransaction={handleDeleteTransactionRow}
          />
        )}

        {activeTab === 'settings' && (
          <Configuration 
            settings={settings}
            onSave={handleSaveSettings}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 shadow-lg">
        <div className="max-w-3xl mx-auto px-2 h-16 flex items-center justify-around">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${
                activeTab === 'inventory' ? 'text-apple-600' : 'text-gray-400'
              }`}
            >
              <LayoutList className={`w-6 h-6 ${activeTab === 'inventory' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'inventory' ? 2 : 1.5} />
              <span className="text-[10px] font-medium">Estoque</span>
            </button>
            
            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${
                activeTab === 'calculator' ? 'text-apple-600' : 'text-gray-400'
              }`}
            >
              <CalcIcon className={`w-6 h-6 ${activeTab === 'calculator' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'calculator' ? 2 : 1.5} />
              <span className="text-[10px] font-medium">Simular</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${
                activeTab === 'history' ? 'text-apple-600' : 'text-gray-400'
              }`}
            >
              <History className={`w-6 h-6 ${activeTab === 'history' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'history' ? 2 : 1.5} />
              <span className="text-[10px] font-medium">Histórico</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${
                activeTab === 'reports' ? 'text-apple-600' : 'text-gray-400'
              }`}
            >
              <TrendingUp className={`w-6 h-6 ${activeTab === 'reports' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'reports' ? 2 : 1.5} />
              <span className="text-[10px] font-medium">Relatórios</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 h-full transition-all ${
                activeTab === 'settings' ? 'text-apple-600' : 'text-gray-400'
              }`}
            >
              <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-current' : ''}`} strokeWidth={activeTab === 'settings' ? 2 : 1.5} />
              <span className="text-[10px] font-medium">Ajustes</span>
            </button>
        </div>
      </nav>

      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
        }
        .pb-safe {
            padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default App;