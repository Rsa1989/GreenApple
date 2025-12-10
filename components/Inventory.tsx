
import React, { useState, useEffect } from 'react';
import { ProductItem, AppSettings } from '../types';
import { Input } from './Input';
import { Plus, Trash2, Search, X, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface InventoryProps {
  items: ProductItem[];
  settings: AppSettings;
  onAddItem: (item: ProductItem) => void;
  onDeleteItem: (id: string) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, settings, onAddItem, onDeleteItem }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    memory: '',
    color: '',
    costUsd: '',
    feeUsd: '',
    exchangeRate: '',
    spread: '',
    importTaxBrl: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Initialize defaults
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      feeUsd: settings.defaultFeeUsd > 0 ? settings.defaultFeeUsd.toString() : prev.feeUsd,
      spread: settings.defaultSpread > 0 ? settings.defaultSpread.toString() : prev.spread,
      importTaxBrl: settings.defaultImportTax > 0 ? settings.defaultImportTax.toString() : prev.importTaxBrl,
    }));
  }, [settings]);

  const calculateCost = () => {
    const costUsd = parseFloat(formData.costUsd) || 0;
    const feeUsd = parseFloat(formData.feeUsd) || 0;
    const rate = parseFloat(formData.exchangeRate) || 0;
    const spread = parseFloat(formData.spread) || 0;
    const tax = parseFloat(formData.importTaxBrl) || 0;

    const baseUsd = costUsd + feeUsd;
    const effectiveRate = rate + spread;
    const totalBrl = (baseUsd * effectiveRate) + tax;

    return { totalBrl, effectiveRate, baseUsd };
  };

  const { totalBrl, effectiveRate } = calculateCost();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { totalBrl } = calculateCost();

    const newItem: ProductItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      memory: formData.memory,
      color: formData.color,
      costUsd: parseFloat(formData.costUsd) || 0,
      feeUsd: parseFloat(formData.feeUsd) || 0,
      exchangeRate: parseFloat(formData.exchangeRate) || 0,
      spread: parseFloat(formData.spread) || 0,
      importTaxBrl: parseFloat(formData.importTaxBrl) || 0,
      totalCostBrl: totalBrl,
      createdAt: Date.now(),
    };

    onAddItem(newItem);
    setIsFormOpen(false); // Close form on success
    
    // Reset form but keep default settings
    setFormData({
      name: '', 
      memory: '', 
      color: '', 
      costUsd: '', 
      feeUsd: settings.defaultFeeUsd.toString(), 
      exchangeRate: '', 
      spread: settings.defaultSpread.toString(), 
      importTaxBrl: settings.defaultImportTax.toString()
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.memory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.color.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Search Bar */}
      <div className="sticky top-16 z-10 bg-gray-50 pb-2">
        <div className="relative shadow-sm">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar no estoque..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 text-base border-none rounded-2xl bg-white focus:ring-0 shadow-sm"
          />
        </div>
      </div>

      {/* Add New Item Button (Collapsible Trigger) */}
      <button 
        onClick={() => setIsFormOpen(!isFormOpen)}
        className="w-full bg-apple-600 active:bg-apple-700 text-white p-4 rounded-2xl font-medium shadow-md shadow-apple-200 flex items-center justify-between transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg">
                <Plus className="w-5 h-5" />
            </div>
            <span className="text-lg">Cadastrar Novo</span>
        </div>
        {isFormOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Form Section */}
      {isFormOpen && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <Input name="name" label="Nome do Produto" placeholder="Ex: iPhone 15" value={formData.name} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-4">
                 <Input name="memory" label="Memória" placeholder="128GB" value={formData.memory} onChange={handleChange} required />
                 <Input name="color" label="Cor" placeholder="Cor" value={formData.color} onChange={handleChange} required />
              </div>
            </div>

            <hr className="border-gray-100 my-2" />
            
            <div className="grid grid-cols-2 gap-4">
               <Input name="costUsd" label="Custo (USD)" type="number" step="0.01" placeholder="0.00" value={formData.costUsd} onChange={handleChange} required />
               <Input name="feeUsd" label="Taxa (USD)" type="number" step="0.01" placeholder="0.00" value={formData.feeUsd} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input name="exchangeRate" label="Dólar Dia (R$)" type="number" step="0.001" placeholder="5.50" value={formData.exchangeRate} onChange={handleChange} required />
                <div className="relative">
                   <Input name="spread" label="Spread (R$)" type="number" step="0.01" placeholder="0.10" value={formData.spread} onChange={handleChange} required />
                </div>
            </div>

            <Input name="importTaxBrl" label="Taxa Importação (R$)" type="number" step="0.01" placeholder="0.00" value={formData.importTaxBrl} onChange={handleChange} required />
            
            <div className="bg-apple-50 p-4 rounded-xl border border-apple-100 flex flex-col items-center text-center gap-2">
               <span className="text-xs text-gray-500 uppercase tracking-wide">Custo Final Estimado</span>
               <span className="font-bold text-3xl text-apple-700">R$ {totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               <span className="text-xs text-gray-400">Taxa Efetiva: R$ {effectiveRate.toFixed(3)}</span>
            </div>
            
            <button type="submit" className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium text-lg shadow-lg active:scale-[0.98] transition-transform">
               Confirmar Cadastro
            </button>
          </form>
        </div>
      )}

      {/* Product List - Cards */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhum item encontrado.</p>
            </div>
        ) : (
            filteredItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mt-1 font-medium">
                                {item.memory} • {item.color}
                            </span>
                        </div>
                        <button 
                            onClick={() => onDeleteItem(item.id)}
                            className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-50 pt-3">
                         <div>
                            <span className="text-xs text-gray-400 block mb-0.5">Custo USD</span>
                            <div className="font-medium text-gray-700">
                                ${item.costUsd} <span className="text-xs text-gray-400">+ ${item.feeUsd}</span>
                            </div>
                         </div>
                         <div className="text-right">
                             <span className="text-xs text-gray-400 block mb-0.5">Custo Total (BRL)</span>
                             <div className="font-bold text-xl text-gray-900">
                                R$ {item.totalCostBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </div>
                         </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
