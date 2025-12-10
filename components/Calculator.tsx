
import React, { useState, useEffect } from 'react';
import { ProductItem, CalculatorMode, AppSettings, SimulationItem } from '../types';
import { Input } from './Input';
import { fetchCurrentExchangeRate } from '../services/geminiService';
import { Calculator, RefreshCw, Loader2, Sparkles, AlertCircle, CreditCard, Box, Edit3, Share2, MessageCircle, CheckCircle2, Circle, User, Save, Smartphone, ChevronDown } from 'lucide-react';

interface CalculatorProps {
  inventory: ProductItem[];
  settings: AppSettings;
  onSaveSimulation?: (simulation: SimulationItem) => void;
  initialData?: SimulationItem | null;
}

export const CalculatorComponent: React.FC<CalculatorProps> = ({ inventory, settings, onSaveSimulation, initialData }) => {
  const [mode, setMode] = useState<CalculatorMode>(CalculatorMode.FROM_STOCK);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Simulation State
  const [simCostUsd, setSimCostUsd] = useState('');
  const [simFeeUsd, setSimFeeUsd] = useState('');
  const [simRate, setSimRate] = useState('');
  const [simSpread, setSimSpread] = useState('');
  const [simTax, setSimTax] = useState('');
  const [margin, setMargin] = useState('20');
  
  // Manual Product Details State
  const [manualName, setManualName] = useState('');
  const [manualMemory, setManualMemory] = useState('');
  const [manualColor, setManualColor] = useState('');
  
  // Customer Data for Simulation
  const [customerName, setCustomerName] = useState('');
  const [customerSurname, setCustomerSurname] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [loadingRate, setLoadingRate] = useState(false);
  const [rateSource, setRateSource] = useState<string | null>(null);

  // Installment Selection State
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);

  // Initialize defaults only if NOT loading initialData
  useEffect(() => {
    if (mode === CalculatorMode.SIMULATION && !initialData) {
      if (settings.defaultFeeUsd > 0 && !simFeeUsd) setSimFeeUsd(settings.defaultFeeUsd.toString());
      if (settings.defaultSpread > 0 && !simSpread) setSimSpread(settings.defaultSpread.toString());
      if (settings.defaultImportTax > 0 && !simTax) setSimTax(settings.defaultImportTax.toString());
    }
  }, [mode, settings, initialData]);

  // Load Initial Data when provided (e.g., from History)
  useEffect(() => {
      if (initialData) {
          setMode(CalculatorMode.SIMULATION);
          setCustomerName(initialData.customerName || '');
          setCustomerSurname(initialData.customerSurname || '');
          setCustomerPhone(initialData.customerPhone || '');
          
          // Pre-fill manual name with the full product name from history
          setManualName(initialData.productName || '');
          setManualMemory('');
          setManualColor('');
          
          setSimCostUsd(initialData.costUsd.toString());
          setSimFeeUsd(initialData.feeUsd.toString());
          setSimRate(initialData.exchangeRate.toString()); // Effective rate
          setSimSpread('0'); // Spread is already inside exchangeRate in history item
          
          // Reverse calculate Tax: Total - (Base * Rate)
          const baseUsd = initialData.costUsd + initialData.feeUsd;
          const calculatedTax = initialData.totalCostBrl - (baseUsd * initialData.exchangeRate);
          setSimTax(Math.max(0, calculatedTax).toFixed(2));

          // Reverse calculate Margin: ((Sell / Cost) - 1) * 100
          if (initialData.totalCostBrl > 0) {
              const calculatedMargin = ((initialData.sellingPrice / initialData.totalCostBrl) - 1) * 100;
              setMargin(calculatedMargin.toFixed(2));
          }
          
          // Scroll to top
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [initialData]);

  // Initialize all installments as selected by default when settings change
  useEffect(() => {
    if (settings.installmentRules.length > 0) {
      setSelectedInstallments(settings.installmentRules.map(r => r.installments));
    }
  }, [settings.installmentRules]);

  // Reset selected product when mode changes
  useEffect(() => {
    setSelectedProductId('');
  }, [mode]);

  const handleFetchRate = async () => {
    setLoadingRate(true);
    setRateSource(null);
    const result = await fetchCurrentExchangeRate();
    if (result) {
      setSimRate(result.rate.toString());
      setRateSource(result.source || "Google Search");
    }
    setLoadingRate(false);
  };

  const getCalculation = () => {
    let costBrl = 0;
    let baseUsd = 0;
    let prodUsd = 0;
    let feeUsd = 0;
    let effectiveRate = 0;
    let importTax = 0;
    let productName = "Orçamento Personalizado";

    if (mode === CalculatorMode.FROM_STOCK || mode === CalculatorMode.FROM_USED_STOCK) {
      const item = inventory.find(i => i.id === selectedProductId);
      if (item) {
        costBrl = item.totalCostBrl;
        
        // For used items, we usually don't have USD breakdown, so we keep 0 or use stored if any
        prodUsd = item.costUsd;
        feeUsd = item.feeUsd;
        baseUsd = prodUsd + feeUsd;
        effectiveRate = item.exchangeRate > 0 ? (item.exchangeRate + item.spread) : 0;
        importTax = item.importTaxBrl;
        
        let nameInfo = `${item.name} ${item.memory} ${item.color}`;
        if (item.isUsed) {
            nameInfo += " (USADO)";
            if (item.batteryHealth) nameInfo += ` Bat. ${item.batteryHealth}%`;
        }
        productName = nameInfo;
      }
    } else {
      // Manual Mode
      prodUsd = parseFloat(simCostUsd) || 0;
      feeUsd = parseFloat(simFeeUsd) || 0;
      const r = parseFloat(simRate) || 0;
      const s = parseFloat(simSpread) || 0;
      const t = parseFloat(simTax) || 0;

      baseUsd = prodUsd + feeUsd;
      effectiveRate = r + s;
      costBrl = (baseUsd * effectiveRate) + t;
      importTax = t;
      
      // Construct Product Name from Manual Fields
      const parts = [manualName, manualMemory, manualColor].filter(p => p && p.trim() !== '');
      if (parts.length > 0) {
          productName = parts.join(' ');
      }
    }

    const marginPercent = parseFloat(margin) || 0;
    const sellPrice = costBrl * (1 + marginPercent / 100);
    const profit = sellPrice - costBrl;

    return { costBrl, sellPrice, profit, baseUsd, prodUsd, feeUsd, effectiveRate, importTax, productName };
  };

  const { costBrl, sellPrice, profit, baseUsd, prodUsd, feeUsd, effectiveRate, importTax, productName } = getCalculation();

  const toggleInstallment = (installments: number) => {
    setSelectedInstallments(prev => 
      prev.includes(installments) 
        ? prev.filter(i => i !== installments)
        : [...prev, installments]
    );
  };

  const toggleAllInstallments = () => {
    if (selectedInstallments.length === settings.installmentRules.length) {
      setSelectedInstallments([]);
    } else {
      setSelectedInstallments(settings.installmentRules.map(r => r.installments));
    }
  };

  const handleWhatsAppShare = () => {
    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    // Generate Installment List String based on SELECTION
    const installmentLines = settings.installmentRules
        .filter(rule => selectedInstallments.includes(rule.installments))
        .map(rule => {
            const totalWithInterest = sellPrice * (1 + (rule.rate / 100));
            const installmentValue = totalWithInterest / rule.installments;
            return `${rule.installments}x de ${formatCurrency(installmentValue)}`;
        }).join('\n');

    let message = settings.whatsappTemplate || "";
    
    // Replace Variables
    // Logic: If in Manual mode and we have initialData but no manual typing yet, use initial data name. 
    // Otherwise rely on calculated productName
    message = message.replace(/{produto}/g, productName);
    message = message.replace(/{preco}/g, formatCurrency(sellPrice));
    message = message.replace(/{parcelas}/g, installmentLines || "(Consulte condições)");

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSaveClick = () => {
      // Validate customer name regardless of mode
      if (!customerName) {
          alert("Por favor, preencha o nome do cliente.");
          return;
      }

      if (onSaveSimulation) {
          const simItem: SimulationItem = {
              id: '', // Will be generated by Firestore
              customerName: customerName || "Cliente",
              customerSurname: customerSurname || "",
              customerPhone: customerPhone || "",
              productName: productName,
              costUsd: prodUsd,
              feeUsd: feeUsd,
              exchangeRate: effectiveRate,
              totalCostBrl: costBrl,
              sellingPrice: sellPrice,
              createdAt: Date.now()
          };
          onSaveSimulation(simItem);
      }
  };

  // Filter products based on selected mode
  const filteredInventory = inventory.filter(item => {
    if (mode === CalculatorMode.FROM_USED_STOCK) {
        return item.isUsed === true;
    }
    if (mode === CalculatorMode.FROM_STOCK) {
        return item.isUsed !== true;
    }
    return true;
  });
  
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      
      {/* iOS Style Segmented Control */}
      <div className="bg-gray-200 p-1 rounded-xl flex shadow-inner overflow-x-auto no-scrollbar">
        <button
          onClick={() => setMode(CalculatorMode.FROM_STOCK)}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.FROM_STOCK ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Box className="w-4 h-4" />
          Novos
        </button>
        <button
          onClick={() => setMode(CalculatorMode.FROM_USED_STOCK)}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.FROM_USED_STOCK ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Usados
        </button>
        <button
          onClick={() => setMode(CalculatorMode.SIMULATION)}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.SIMULATION ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Manual
        </button>
      </div>
      
      {initialData && mode === CalculatorMode.SIMULATION && (
         <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 flex items-center gap-2 text-sm">
             <Edit3 className="w-4 h-4" />
             Editando orçamento de: <strong>{initialData.productName}</strong>
         </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            
            {/* Customer Data Section - Always Visible */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
               <div className="flex items-center gap-2 text-gray-800 font-medium pb-2 border-b border-gray-200">
                   <User className="w-4 h-4" />
                   Dados do Cliente
               </div>
               <Input 
                    label="Nome" 
                    placeholder="Nome do cliente" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
               />
               <div className="grid grid-cols-2 gap-3">
                   <Input 
                        label="Sobrenome" 
                        placeholder="Sobrenome" 
                        value={customerSurname}
                        onChange={(e) => setCustomerSurname(e.target.value)}
                   />
                   <Input 
                        label="Telefone" 
                        placeholder="(00) 00000-0000" 
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                   />
               </div>
            </div>

            {(mode === CalculatorMode.FROM_STOCK || mode === CalculatorMode.FROM_USED_STOCK) ? (
              <div className="pt-2 border-t border-gray-100 animate-fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                    {mode === CalculatorMode.FROM_USED_STOCK ? "Selecionar Aparelho Usado" : "Selecionar Produto Novo"}
                </label>
                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none bg-white text-base"
                  >
                    <option value="">Selecione um item...</option>
                    {filteredInventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.memory} - {item.color}) {item.isUsed ? `[Bateria: ${item.batteryHealth}%]` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                
                {filteredInventory.length === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {mode === CalculatorMode.FROM_USED_STOCK 
                        ? "Nenhum aparelho usado cadastrado." 
                        : "Sem produtos novos cadastrados."}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-gray-100 animate-fade-in">
                
                {/* Manual Product Details */}
                <div className="space-y-3">
                    <Input 
                        label="Nome do Produto" 
                        placeholder="Ex: iPhone 15 Pro Max" 
                        value={manualName} 
                        onChange={(e) => setManualName(e.target.value)} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Memória" 
                            placeholder="Ex: 256GB" 
                            value={manualMemory} 
                            onChange={(e) => setManualMemory(e.target.value)} 
                        />
                        <Input 
                            label="Cor" 
                            placeholder="Ex: Titânio Natural" 
                            value={manualColor} 
                            onChange={(e) => setManualColor(e.target.value)} 
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Valor Produto" subLabel="(USD)" value={simCostUsd} onChange={(e) => setSimCostUsd(e.target.value)} type="number" placeholder="0.00" />
                    <Input label="Taxa" subLabel="(USD)" value={simFeeUsd} onChange={(e) => setSimFeeUsd(e.target.value)} type="number" placeholder="0.00" />
                </div>
                
                <div className="bg-apple-50/50 p-4 rounded-xl border border-apple-100">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 ml-1">Dólar Hoje (R$)</label>
                      <button 
                          onClick={handleFetchRate}
                          disabled={loadingRate}
                          className="text-xs bg-apple-600 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium hover:bg-apple-700 disabled:opacity-50"
                      >
                          {loadingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Atualizar
                      </button>
                  </div>
                  <input 
                      type="number" 
                      value={simRate} 
                      onChange={(e) => setSimRate(e.target.value)}
                      placeholder="Ex: 5.50"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none text-base bg-white"
                  />
                  {rateSource && <p className="text-xs text-apple-700 mt-1 ml-1">Fonte: {rateSource}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Input label="Spread" subLabel="(R$)" value={simSpread} onChange={(e) => setSimSpread(e.target.value)} type="number" placeholder="0.10" />
                    </div>
                    <Input label="Taxa Imp." subLabel="(R$)" value={simTax} onChange={(e) => setSimTax(e.target.value)} type="number" placeholder="0.00" />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <Input 
                  label="Margem de Lucro" 
                  subLabel="(%)" 
                  value={margin} 
                  onChange={(e) => setMargin(e.target.value)} 
                  type="number"
                  placeholder="20"
                  className="text-lg font-bold text-apple-700"
              />
            </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl space-y-6">
          <div>
              <div className="flex items-center gap-2 mb-4 opacity-70">
                  <Calculator className="w-5 h-5" />
                  <h3 className="text-sm font-medium uppercase tracking-wider">Resultado</h3>
              </div>
              
              <div className="text-center py-2">
                  <span className="text-apple-300 text-sm font-bold uppercase tracking-wide block mb-1">Preço Sugerido (À Vista)</span>
                  <span className="text-5xl font-bold tracking-tighter">R$ {sellPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <div className="flex justify-center mt-2">
                   <span className="inline-flex items-center bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-bold border border-green-500/30">
                      Lucro: + R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </span>
              </div>
          </div>

          <div className="border-t border-gray-800 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                 <span>Custo Total (BRL)</span>
                 <span className="text-white font-medium">R$ {costBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              {effectiveRate > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Dólar Efetivo</span>
                    <span>R$ {effectiveRate.toFixed(3)}</span>
                </div>
              )}
              {baseUsd > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                    <span>Total USD</span>
                    <span>$ {baseUsd.toFixed(2)}</span>
                </div>
              )}
              
              {/* Show constructed product name in result for verification */}
              <div className="flex justify-between text-xs text-gray-500 border-t border-gray-800 pt-2 mt-2">
                 <span>Item:</span>
                 <span className="text-gray-300 max-w-[200px] truncate text-right">{productName}</span>
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
              {sellPrice > 0 && (
                <button 
                    onClick={handleSaveClick}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
                >
                    <Save className="w-5 h-5" />
                    Salvar
                </button>
              )}
              
              {sellPrice > 0 && (
                <button 
                    onClick={handleWhatsAppShare}
                    className={`bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all`}
                >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                </button>
              )}
          </div>
      </div>

      {/* Installment Table Section */}
      {sellPrice > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Parcelamento</h3>
              </div>
              <button 
                onClick={toggleAllInstallments}
                className="text-xs text-apple-600 font-medium hover:underline"
              >
                {selectedInstallments.length === settings.installmentRules.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded-lg">
                Selecione as opções abaixo para incluir na mensagem do WhatsApp.
            </p>

            <div className="divide-y divide-gray-100">
              {settings.installmentRules.map((rule) => {
                const totalWithInterest = sellPrice * (1 + (rule.rate / 100));
                const installmentValue = totalWithInterest / rule.installments;
                const isSelected = selectedInstallments.includes(rule.installments);

                return (
                  <div 
                    key={rule.installments} 
                    className="flex justify-between items-center py-3 cursor-pointer"
                    onClick={() => toggleInstallment(rule.installments)}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-apple-500 border-apple-500' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{rule.installments}x</span>
                            <span className="text-xs text-gray-400">{rule.rate > 0 ? `+${rule.rate}%` : 'Sem juros'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="font-bold text-apple-700">R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                         <div className="text-xs text-gray-400">Total: R$ {totalWithInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
};
