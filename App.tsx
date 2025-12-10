
import React, { useState, useEffect } from 'react';
import { Inventory } from './components/Inventory';
import { CalculatorComponent } from './components/Calculator';
import { Configuration } from './components/Configuration';
import { ProductItem, AppSettings } from './types';
import { LayoutList, Calculator as CalcIcon, Settings, Package2 } from 'lucide-react';

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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'calculator' | 'settings'>('inventory');
  const [items, setItems] = useState<ProductItem[]>([]);
  
  const [settings, setSettings] = useState<AppSettings>({
    defaultFeeUsd: 0,
    defaultSpread: 0.10,
    defaultImportTax: 0,
    installmentRules: Array.from({ length: 12 }, (_, i) => ({
      installments: i + 1,
      rate: i === 0 ? 0 : (i * 1.5)
    })),
    themeColor: '#38a878',
    headerBackgroundColor: '#ffffff',
    backgroundColor: '#f9fafb', // Default gray-50
    logoUrl: null
  });

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

    // Apply background color to body to ensure overscroll matches
    document.body.style.backgroundColor = settings.backgroundColor;

  }, [settings.themeColor, settings.backgroundColor]);

  const handleAddItem = (item: ProductItem) => {
    setItems(prev => [item, ...prev]);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

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
                     <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GreenApple</h1>
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
            onDeleteItem={handleDeleteItem} 
          />
        )}
        
        {activeTab === 'calculator' && (
          <CalculatorComponent 
            inventory={items} 
            settings={settings}
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
              <span className="text-[10px] font-medium">Calculadora</span>
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
