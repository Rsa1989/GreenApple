
import React, { useState, useEffect } from 'react';
import { ProductItem, AppSettings, SimulationItem } from '../types';
import { Input } from './Input';
import { Plus, Trash2, Search, X, ChevronDown, ChevronUp, Package, Pencil, BatteryCharging, Smartphone, Box, Sparkles, Loader2, StickyNote, AlertCircle, Download } from 'lucide-react';
import { fetchCurrentExchangeRate } from '../services/geminiService';

interface InventoryProps {
  items: ProductItem[];
  settings: AppSettings;
  onAddItem: (item: ProductItem, customDescription?: string) => void;
  onUpdateItem: (item: ProductItem) => void;
  onDeleteItem: (id: string) => void;
  initialOrderData?: SimulationItem | null;
  onClearOrderData?: () => void;
}

export const Inventory: React.FC<InventoryProps> = ({ items, settings, onAddItem, onUpdateItem, onDeleteItem, initialOrderData, onClearOrderData }) => {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'used'>('new');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUsedFormOpen, setIsUsedFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Rate fetching state
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateSource, setRateSource] = useState<string | null>(null);
  
  // Form Data for NEW products
  const [formData, setFormData] = useState({
    name: '',
    memory: '',
    color: '',
    costUsd: '',
    feeUsd: '',
    exchangeRate: '',
    spread: '',
    importTaxBrl: '',
    observation: '',
  });

  // Form Data for USED products
  const [usedFormData, setUsedFormData] = useState({
    name: '',
    memory: '',
    color: '',
    batteryHealth: '',
    entryValueBrl: '',
    observation: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Initialize defaults for NEW products form
  useEffect(() => {
    if (!editingId && !initialOrderData) {
      setFormData(prev => ({
        ...prev,
        feeUsd: settings.defaultFeeUsd > 0 && !prev.feeUsd ? settings.defaultFeeUsd.toString() : prev.feeUsd,
        spread: settings.defaultSpread > 0 && !prev.spread ? settings.defaultSpread.toString() : prev.spread,
        importTaxBrl: settings.defaultImportTax > 0 && !prev.importTaxBrl ? settings.defaultImportTax.toString() : prev.importTaxBrl,
      }));
    }
  }, [settings, editingId, initialOrderData]);

  // Handle Initial Order Data from Simulation History
  useEffect(() => {
    if (initialOrderData) {
        setIsFormOpen(true);
        setIsUsedFormOpen(false);
        setActiveSubTab('new');
        setEditingId(null);
        
        // Use explicit fields if available, otherwise fallback to combined name
        const initialName = initialOrderData.productNameOnly || initialOrderData.productName || '';
        const initialMemory = initialOrderData.productMemory || '';
        const initialColor = initialOrderData.productColor || '';

        setFormData({
            name: initialName,
            memory: initialMemory,
            color: initialColor,
            costUsd: initialOrderData.costUsd?.toString() || '',
            feeUsd: initialOrderData.feeUsd?.toString() || settings.defaultFeeUsd.toString(),
            // REQUIREMENT: Exchange rate must be blank for new order
            exchangeRate: '',
            // REQUIREMENT: Spread and Tax must be pre-filled from simulation
            spread: initialOrderData.spread?.toString() || settings.defaultSpread.toString(),
            importTaxBrl: initialOrderData.importTaxBrl?.toString() || settings.defaultImportTax.toString(),
            // REQUIREMENT: Prefill observation with customer name
            observation: `Promessa de venda para: ${initialOrderData.customerName} ${initialOrderData.customerSurname}`.trim()
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Clear the data in parent so it doesn't persist on subsequent renders
        if (onClearOrderData) {
            onClearOrderData();
        }
    }
  }, [initialOrderData, settings]);

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

  const handleFetchRate = async () => {
    setLoadingRate(true);
    setRateSource(null);
    try {
        const result = await fetchCurrentExchangeRate();
        if (result) {
          setFormData(prev => ({
              ...prev,
              exchangeRate: result.rate.toString()
          }));
          setRateSource(result.source || "Google Search");
        } else {
            alert("Não foi possível obter a cotação automaticamente. Por favor, insira manualmente.");
        }
    } catch (e) {
        alert("Erro de conexão ao buscar dólar.");
    } finally {
        setLoadingRate(false);
    }
  };

  const handleEditClick = (item: ProductItem) => {
    setEditingId(item.id);
    
    // Ensure we switch to the correct tab when editing
    if (item.isUsed) {
        setActiveSubTab('used');
        setUsedFormData({
            name: item.name,
            memory: item.memory,
            color: item.color,
            batteryHealth: item.batteryHealth ? item.batteryHealth.toString() : '',
            entryValueBrl: item.totalCostBrl.toString(),
            observation: item.observation || '',
        });
        setIsUsedFormOpen(true);
        setIsFormOpen(false);
    } else {
        setActiveSubTab('new');
        setFormData({
            name: item.name,
            memory: item.memory,
            color: item.color,
            costUsd: item.costUsd.toString(),
            feeUsd: item.feeUsd.toString(),
            exchangeRate: item.exchangeRate.toString(),
            spread: item.spread.toString(),
            importTaxBrl: item.importTaxBrl.toString(),
            observation: item.observation || '',
        });
        setRateSource(null); // Reset source on edit
        setIsFormOpen(true);
        setIsUsedFormOpen(false);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRateSource(null);
    // Reset New Form
    setFormData({
      name: '', 
      memory: '', 
      color: '', 
      costUsd: '', 
      feeUsd: settings.defaultFeeUsd.toString(), 
      exchangeRate: '', 
      spread: settings.defaultSpread.toString(), 
      importTaxBrl: settings.defaultImportTax.toString(),
      observation: ''
    });
    // Reset Used Form
    setUsedFormData({
        name: '',
        memory: '',
        color: '',
        batteryHealth: '',
        entryValueBrl: '',
        observation: ''
    });
    setIsFormOpen(false);
    setIsUsedFormOpen(false);
  };

  const handleTabChange = (tab: 'new' | 'used') => {
      setActiveSubTab(tab);
      handleCancelEdit(); // Close forms when switching tabs
  };

  const handleExportCSV = () => {
      const isExportingUsed = activeSubTab === 'used';
      // Export all items of the current category (New or Used), ignoring current search filter to export full list
      const dataToExport = items.filter(item => isExportingUsed ? item.isUsed : !item.isUsed);

      if (dataToExport.length === 0) {
          alert(`Não há produtos ${isExportingUsed ? 'usados' : 'novos'} para exportar.`);
          return;
      }

      let csvContent = "";
      
      if (isExportingUsed) {
          // Headers for USED products
          const headers = ["Nome", "Memória", "Cor", "Saúde Bateria", "Valor Entrada (R$)", "Observações"];
          const rows = dataToExport.map(item => [
              `"${item.name.replace(/"/g, '""')}"`,
              item.memory,
              item.color,
              item.batteryHealth ? `${item.batteryHealth}%` : "",
              item.totalCostBrl.toFixed(2).replace('.', ','),
              `"${(item.observation || "").replace(/"/g, '""')}"`
          ].join(";"));
          csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
      } else {
          // Headers for NEW products
          const headers = ["Nome", "Memória", "Cor", "Custo (USD)", "Taxa (USD)", "Câmbio Dia (R$)", "Spread (R$)", "Taxa Imp. (R$)", "Custo Total (R$)", "Observações"];
          const rows = dataToExport.map(item => [
              `"${item.name.replace(/"/g, '""')}"`,
              item.memory,
              item.color,
              item.costUsd.toFixed(2).replace('.', ','),
              item.feeUsd.toFixed(2).replace('.', ','),
              item.exchangeRate.toFixed(2).replace('.', ','),
              item.spread.toFixed(2).replace('.', ','),
              item.importTaxBrl.toFixed(2).replace('.', ','),
              item.totalCostBrl.toFixed(2).replace('.', ','),
              `"${(item.observation || "").replace(/"/g, '""')}"`
          ].join(";"));
          csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
      }

      // Create Download Link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      link.href = url;
      link.setAttribute("download", `estoque_${isExportingUsed ? 'usados' : 'novos'}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDATION: Exchange Rate is mandatory
    if (!formData.exchangeRate || parseFloat(formData.exchangeRate) === 0) {
        alert("O campo Dólar Dia é obrigatório e deve ser maior que zero.");
        return;
    }

    const { totalBrl } = calculateCost();

    const itemData: ProductItem = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      memory: formData.memory,
      color: formData.color,
      costUsd: parseFloat(formData.costUsd) || 0,
      feeUsd: parseFloat(formData.feeUsd) || 0,
      exchangeRate: parseFloat(formData.exchangeRate) || 0,
      spread: parseFloat(formData.spread) || 0,
      importTaxBrl: parseFloat(formData.importTaxBrl) || 0,
      totalCostBrl: totalBrl,
      createdAt: editingId ? (items.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
      isUsed: false,
      observation: formData.observation
    };

    if (editingId) {
      onUpdateItem(itemData);
    } else {
      // Logic for reserved purchase description in transaction log
      const customDescription = initialOrderData 
        ? `Compra sob reserva de ${initialOrderData.customerName} ${initialOrderData.customerSurname}`.trim()
        : undefined;
      onAddItem(itemData, customDescription);
    }
    handleCancelEdit();
  };

  const handleSubmitUsed = (e: React.FormEvent) => {
      e.preventDefault();
      
      const itemData: ProductItem = {
          id: editingId || crypto.randomUUID(),
          name: usedFormData.name,
          memory: usedFormData.memory,
          color: usedFormData.color,
          costUsd: 0,
          feeUsd: 0,
          exchangeRate: 0,
          spread: 0,
          importTaxBrl: 0,
          totalCostBrl: parseFloat(usedFormData.entryValueBrl) || 0,
          createdAt: editingId ? (items.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
          isUsed: true,
          batteryHealth: parseInt(usedFormData.batteryHealth) || undefined,
          observation: usedFormData.observation
      };

      if (editingId) {
        onUpdateItem(itemData);
      } else {
        onAddItem(itemData);
      }
      handleCancelEdit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUsedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setUsedFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filter items based on Active Tab AND Search Term
  const filteredItems = items.filter(item => {
    // 1. Filter by Tab (New vs Used)
    if (activeSubTab === 'new' && item.isUsed) return false;
    if (activeSubTab === 'used' && !item.isUsed) return false;

    // 2. Filter by Search
    return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.memory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.color.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* Sub Tabs */}
      <div className="bg-gray-200 p-1 rounded-xl flex shadow-inner">
        <button
          onClick={() => handleTabChange('new')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
            activeSubTab === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Box className="w-4 h-4" />
          Produtos Novos
        </button>
        <button
          onClick={() => handleTabChange('used')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
            activeSubTab === 'used' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Produtos Usados
        </button>
      </div>

      {/* Search Bar & Export Button */}
      <div className="flex gap-2">
        <div className="relative shadow-sm flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder={`Buscar em ${activeSubTab === 'new' ? 'novos' : 'usados'}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 text-base border-none rounded-2xl bg-white focus:ring-0 shadow-sm"
            />
        </div>
        <button
            onClick={handleExportCSV}
            className="bg-white text-apple-700 border border-apple-100 px-4 rounded-2xl shadow-sm hover:bg-apple-50 transition-colors flex items-center justify-center"
            title="Exportar Lista"
        >
            <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons - Contextual based on Tab */}
      <div className="space-y-3">
        {/* NEW PRODUCT BUTTON - Only Show if on New Tab */}
        {activeSubTab === 'new' && (
            <button 
                onClick={() => {
                    if (editingId) handleCancelEdit();
                    setIsFormOpen(!isFormOpen);
                    setIsUsedFormOpen(false);
                }}
                className={`w-full text-white p-4 rounded-2xl font-medium shadow-md flex items-center justify-between transition-transform active:scale-[0.98] ${
                    editingId && !isUsedFormOpen ? 'bg-amber-600 shadow-amber-200' : 'bg-apple-600 shadow-apple-200 active:bg-apple-700'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        {editingId && !isUsedFormOpen ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </div>
                    <span className="text-lg">{editingId && !isUsedFormOpen ? "Editando Produto" : "Cadastrar Novo"}</span>
                </div>
                {isFormOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
        )}

        {/* USED PRODUCT BUTTON - Only Show if on Used Tab */}
        {activeSubTab === 'used' && (
            <button 
                onClick={() => {
                    if (editingId) handleCancelEdit();
                    setIsUsedFormOpen(!isUsedFormOpen);
                    setIsFormOpen(false);
                }}
                className={`w-full text-white p-4 rounded-2xl font-medium shadow-md flex items-center justify-between transition-transform active:scale-[0.98] ${
                    editingId && isUsedFormOpen ? 'bg-amber-600 shadow-amber-200' : 'bg-gray-700 shadow-gray-300 active:bg-gray-800'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        {editingId && isUsedFormOpen ? <Pencil className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <span className="text-lg">{editingId && isUsedFormOpen ? "Editando Usado" : "Cadastrar Usado"}</span>
                </div>
                {isUsedFormOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
        )}
      </div>

      {/* NEW Product Form */}
      {isFormOpen && activeSubTab === 'new' && (
        <div className={`bg-white p-5 rounded-2xl shadow-sm border animate-fade-in ${editingId ? 'border-amber-200' : 'border-gray-100'}`}>
          <form onSubmit={handleSubmitNew} className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              <Input 
                name="name" 
                label="Nome do Produto" 
                placeholder="Ex: iPhone 15" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
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
                {/* Custom Input Block for Exchange Rate with Fetch Button */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-sm font-medium text-gray-700">Dólar Dia (R$)</label>
                        <button 
                            type="button"
                            onClick={handleFetchRate}
                            disabled={loadingRate}
                            className="text-[10px] bg-apple-100 text-apple-700 px-2 py-1 rounded-md flex items-center gap-1 font-bold hover:bg-apple-200 disabled:opacity-50"
                        >
                            {loadingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Buscar
                        </button>
                    </div>
                    <input
                        name="exchangeRate"
                        type="number"
                        step="0.001"
                        placeholder="5.50"
                        value={formData.exchangeRate}
                        onChange={handleChange}
                        required
                        className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none transition-all text-base bg-gray-50/50 focus:bg-white"
                    />
                    {rateSource && <span className="text-[10px] text-apple-600 ml-1">Fonte: {rateSource}</span>}
                </div>

                <div className="relative">
                   <Input name="spread" label="Spread (R$)" type="number" step="0.01" placeholder="0.10" value={formData.spread} onChange={handleChange} required />
                </div>
            </div>

            <Input name="importTaxBrl" label="Taxa Importação (R$)" type="number" step="0.01" placeholder="0.00" value={formData.importTaxBrl} onChange={handleChange} required />
            
            <Input name="observation" label="Observações" placeholder="Ex: Promessa de venda para Ricardo..." value={formData.observation} onChange={handleChange} />

            <div className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 ${editingId ? 'bg-amber-50 border-amber-100' : 'bg-apple-50 border-apple-100'}`}>
               <span className="text-xs text-gray-500 uppercase tracking-wide">Custo Final Estimado</span>
               <span className={`font-bold text-3xl ${editingId ? 'text-amber-700' : 'text-apple-700'}`}>R$ {totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               <span className="text-xs text-gray-400">Taxa Efetiva: R$ {effectiveRate.toFixed(3)}</span>
            </div>
            
            <div className="flex gap-3">
                {editingId && (
                    <button 
                        type="button" 
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium text-lg active:scale-[0.98] transition-transform"
                    >
                        Cancelar
                    </button>
                )}
                <button 
                    type="submit" 
                    className={`flex-1 text-white py-4 rounded-xl font-medium text-lg shadow-lg active:scale-[0.98] transition-transform ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-900'}`}
                >
                    {editingId ? "Salvar Alterações" : "Confirmar Cadastro"}
                </button>
            </div>
          </form>
        </div>
      )}

      {/* USED Product Form */}
      {isUsedFormOpen && activeSubTab === 'used' && (
          <div className={`bg-white p-5 rounded-2xl shadow-sm border animate-fade-in ${editingId ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="mb-4 flex items-center gap-2 text-gray-600">
                <Smartphone className="w-5 h-5" />
                <span className="font-semibold">Cadastro de Seminovos/Usados</span>
            </div>
            <form onSubmit={handleSubmitUsed} className="space-y-5">
              <Input 
                name="name" 
                label="Nome do Produto" 
                placeholder="Ex: iPhone 13 Usado" 
                value={usedFormData.name} 
                onChange={handleUsedChange} 
                required 
              />
              
              <div className="grid grid-cols-2 gap-4">
                  <Input name="memory" label="Memória" placeholder="128GB" value={usedFormData.memory} onChange={handleUsedChange} required />
                  <Input name="color" label="Cor" placeholder="Ex: Azul" value={usedFormData.color} onChange={handleUsedChange} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                   <Input name="batteryHealth" label="Saúde Bateria (%)" type="number" placeholder="Ex: 92" value={usedFormData.batteryHealth} onChange={handleUsedChange} />
                   <Input name="entryValueBrl" label="Valor Entrada (R$)" type="number" step="0.01" placeholder="0.00" value={usedFormData.entryValueBrl} onChange={handleUsedChange} required />
              </div>
              
              <Input name="observation" label="Observações" placeholder="Ex: Reservado para cliente X..." value={usedFormData.observation} onChange={handleUsedChange} />

              <div className={`p-4 rounded-xl border flex flex-col items-center text-center gap-2 ${editingId ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-200'}`}>
                 <span className="text-xs text-gray-500 uppercase tracking-wide">Custo de Entrada</span>
                 <span className={`font-bold text-3xl ${editingId ? 'text-amber-700' : 'text-gray-800'}`}>
                    R$ {parseFloat(usedFormData.entryValueBrl || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
              </div>

              <div className="flex gap-3">
                  {editingId && (
                      <button 
                          type="button" 
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-medium text-lg active:scale-[0.98] transition-transform"
                      >
                          Cancelar
                      </button>
                  )}
                  <button 
                      type="submit" 
                      className={`flex-1 text-white py-4 rounded-xl font-medium text-lg shadow-lg active:scale-[0.98] transition-transform ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-800'}`}
                  >
                      {editingId ? "Salvar Usado" : "Confirmar Usado"}
                  </button>
              </div>
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
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden transition-all hover:shadow-md animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                                {item.isUsed && (
                                    <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">
                                        USADO
                                    </span>
                                )}
                            </div>
                            <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md mt-1 font-medium">
                                {item.memory} • {item.color}
                            </span>
                            {item.isUsed && item.batteryHealth && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-green-700 font-medium">
                                    <BatteryCharging className="w-3 h-3" />
                                    Bateria: {item.batteryHealth}%
                                </div>
                            )}
                            {item.observation && (
                                <div className="mt-2 bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded border border-amber-100 flex items-center gap-1.5 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="break-words leading-tight">{item.observation}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleEditClick(item)}
                                className="bg-gray-50 text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => onDeleteItem(item.id)}
                                className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2 border-t border-gray-50 pt-3">
                         <div>
                            <span className="text-xs text-gray-400 block mb-0.5">
                                {item.isUsed ? 'Tipo' : 'Custo USD'}
                            </span>
                            <div className="font-medium text-gray-700">
                                {item.isUsed ? (
                                    <span className="text-sm">Seminovo</span>
                                ) : (
                                    <>
                                        ${item.costUsd} <span className="text-xs text-gray-400">+ ${item.feeUsd}</span>
                                    </>
                                )}
                            </div>
                         </div>
                         <div className="text-right">
                             <span className="text-xs text-gray-400 block mb-0.5">
                                {item.isUsed ? 'Valor Entrada' : 'Custo Total (BRL)'}
                             </span>
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
