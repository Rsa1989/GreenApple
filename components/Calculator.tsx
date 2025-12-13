
import React, { useState, useEffect } from 'react';
import { ProductItem, CalculatorMode, AppSettings, SimulationItem } from '../types';
import { Input } from './Input';
import { fetchCurrentExchangeRate } from '../services/geminiService';
import { Calculator, Loader2, Sparkles, AlertCircle, CreditCard, Box, Edit3, MessageCircle, CheckCircle2, User, Save, Smartphone, ChevronDown, X, Repeat } from 'lucide-react';

interface CalculatorProps {
  inventory: ProductItem[];
  settings: AppSettings;
  onSaveSimulation?: (simulation: SimulationItem) => void;
  initialData?: SimulationItem | null;
  onCancelEdit?: () => void;
}

export const CalculatorComponent: React.FC<CalculatorProps> = ({ inventory, settings, onSaveSimulation, initialData, onCancelEdit }) => {
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

  // Trade-In State
  const [hasTradeIn, setHasTradeIn] = useState(false);
  const [tradeInName, setTradeInName] = useState('');
  const [tradeInValue, setTradeInValue] = useState('');
  const [tradeInMemory, setTradeInMemory] = useState('');
  const [tradeInColor, setTradeInColor] = useState('');
  const [tradeInBattery, setTradeInBattery] = useState('');

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
          // Check if it's from stock and the product still exists
          let restoredMode = CalculatorMode.SIMULATION;
          let restoredProductId = '';

          if (initialData.mode && (initialData.mode === CalculatorMode.FROM_STOCK || initialData.mode === CalculatorMode.FROM_USED_STOCK)) {
             if (initialData.productId && inventory.find(i => i.id === initialData.productId)) {
                 restoredMode = initialData.mode;
                 restoredProductId = initialData.productId;
             }
          }

          setMode(restoredMode);
          setSelectedProductId(restoredProductId);

          setCustomerName(initialData.customerName || '');
          setCustomerSurname(initialData.customerSurname || '');
          setCustomerPhone(initialData.customerPhone || '');

          if (initialData.tradeInName) {
              setHasTradeIn(true);
              setTradeInName(initialData.tradeInName);
              setTradeInValue(initialData.tradeInValue?.toString() || '');
              setTradeInMemory(initialData.tradeInMemory || '');
              setTradeInColor(initialData.tradeInColor || '');
              setTradeInBattery(initialData.tradeInBattery?.toString() || '');
          } else {
              setHasTradeIn(false);
              setTradeInName('');
              setTradeInValue('');
              setTradeInMemory('');
              setTradeInColor('');
              setTradeInBattery('');
          }
          
          if (restoredMode === CalculatorMode.SIMULATION) {
              // Populate manual fields
              setManualName(initialData.productNameOnly || initialData.productName || '');
              setManualMemory(initialData.productMemory || '');
              setManualColor(initialData.productColor || '');
              
              setSimCostUsd(initialData.costUsd.toString());
              setSimFeeUsd(initialData.feeUsd.toString());
              setSimRate(initialData.exchangeRate.toString());
              setSimSpread(initialData.spread?.toString() || settings.defaultSpread.toString()); 
              setSimTax(initialData.importTaxBrl?.toString() || settings.defaultImportTax.toString());
          }

          if (initialData.totalCostBrl > 0) {
              const calculatedMargin = ((initialData.sellingPrice / initialData.totalCostBrl) - 1) * 100;
              setMargin(calculatedMargin.toFixed(2));
          }
          
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  }, [initialData, inventory]);

  // Initialize all installments as selected by default when settings change
  useEffect(() => {
    if (settings.installmentRules.length > 0) {
      setSelectedInstallments(settings.installmentRules.map(r => r.installments));
    }
  }, [settings.installmentRules]);

  const handleFetchRate = async () => {
    setLoadingRate(true);
    setRateSource(null);
    try {
        const result = await fetchCurrentExchangeRate();
        if (result) {
          setSimRate(result.rate.toString());
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
      
      const parts = [manualName, manualMemory, manualColor].filter(p => p && p.trim() !== '');
      if (parts.length > 0) {
          productName = parts.join(' ');
      }
    }

    const marginPercent = parseFloat(margin) || 0;
    const sellPrice = costBrl * (1 + marginPercent / 100);
    
    // Trade In Deduction Logic
    const tradeInVal = hasTradeIn ? (parseFloat(tradeInValue) || 0) : 0;
    const finalPriceToPay = Math.max(0, sellPrice - tradeInVal);

    // Ajuste solicitado: Lucro = Total a Pagar - Custo Total
    const profit = finalPriceToPay - costBrl;

    return { costBrl, sellPrice, profit, baseUsd, prodUsd, feeUsd, effectiveRate, importTax, productName, tradeInVal, finalPriceToPay };
  };

  const { costBrl, sellPrice, profit, baseUsd, prodUsd, feeUsd, effectiveRate, importTax, productName, tradeInVal, finalPriceToPay } = getCalculation();

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
    
    // Installments calculated on FINAL price (after trade-in)
    const installmentLines = settings.installmentRules
        .filter(rule => selectedInstallments.includes(rule.installments))
        .map(rule => {
            const totalWithInterest = finalPriceToPay * (1 + (rule.rate / 100));
            const installmentValue = totalWithInterest / rule.installments;
            return `${rule.installments}x de ${formatCurrency(installmentValue)}`;
        }).join('\n');
    
    // Trade-In details for message
    let tradeInDetails = "";
    
    // Use user-defined labels or fallbacks
    const labelTradeIn = settings.whatsappTradeInLabel || "Troca";
    const labelValue = settings.whatsappTradeInValueLabel || "Valor Avaliado";
    const labelTotal = settings.whatsappTotalLabel || "Total a pagar";

    if (hasTradeIn && tradeInVal > 0) {
        // Build the string carefully to avoid empty parenthesis
        const specs = [tradeInMemory, tradeInColor].filter(s => s && s.trim() !== '').join(' ');
        const details = specs ? ` (${specs})` : '';
        
        tradeInDetails = `\n🔄 *${labelTradeIn}:* ${tradeInName}${details}\n📉 *${labelValue}:* - ${formatCurrency(tradeInVal)}`;
    }

    let message = settings.whatsappTemplate || "";
    message = message.replace(/{produto}/g, productName);
    
    // Logic: If trade-in, show breakdown. If not, show normal price.
    // The asterisk bolding is added dynamically here based on whether we are expanding the block or not.
    // If user's template has *{preco}*, we need to be careful. The App.tsx defaults no longer have asterisks around {preco}.
    
    // We assume the user's template uses {preco} without asterisks, so we add them here.
    // If the user added asterisks in the template around {preco}, we might get double asterisks, but we tried to clean that up in App.tsx defaults.
    // To be safe, we'll assume {preco} is just a placeholder and we provide the bolded values.
    
    // Check if the placeholder is wrapped in asterisks in the template
    const isWrappedInAsterisks = /\*{preco}\*/.test(message);
    const placeholder = isWrappedInAsterisks ? "*{preco}*" : "{preco}";

    if (hasTradeIn && tradeInVal > 0) {
         // Show Base Price, Trade In Info, and Final Price
         // Note: We don't want double asterisks if the user wrapped {preco} in asterisks.
         const priceBlock = `*${formatCurrency(sellPrice)}*${tradeInDetails}\n\n💰 *${labelTotal}: ${formatCurrency(finalPriceToPay)}*`;
         message = message.replace(placeholder, priceBlock);
    } else {
         message = message.replace(placeholder, `*${formatCurrency(sellPrice)}*`);
    }
    
    message = message.replace(/{parcelas}/g, installmentLines || "(Consulte condições)");

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handleSaveClick = () => {
      if (!customerName) {
          alert("Por favor, preencha o nome do cliente.");
          return;
      }

      if (onSaveSimulation) {
          const simItem: SimulationItem = {
              id: initialData?.id || '', // Preserve ID if editing
              customerName: customerName || "Cliente",
              customerSurname: customerSurname || "",
              customerPhone: customerPhone || "",
              productName: productName,
              // Save granular details for manual mode
              productNameOnly: mode === CalculatorMode.SIMULATION ? manualName : undefined,
              productMemory: mode === CalculatorMode.SIMULATION ? manualMemory : undefined,
              productColor: mode === CalculatorMode.SIMULATION ? manualColor : undefined,

              costUsd: prodUsd,
              feeUsd: feeUsd,
              exchangeRate: effectiveRate,
              // NEW: Save spread and import tax so they can be carried over to Orders
              spread: mode === CalculatorMode.SIMULATION ? (parseFloat(simSpread) || 0) : undefined,
              importTaxBrl: mode === CalculatorMode.SIMULATION ? (parseFloat(simTax) || 0) : importTax,

              totalCostBrl: costBrl,
              sellingPrice: sellPrice, // We save the FULL selling price for profit calc
              createdAt: Date.now(),
              mode: mode,
              productId: selectedProductId,
              // Add Trade In Info if enabled
              tradeInName: hasTradeIn ? tradeInName : undefined,
              tradeInValue: hasTradeIn ? tradeInVal : undefined,
              tradeInMemory: hasTradeIn ? tradeInMemory : undefined,
              tradeInColor: hasTradeIn ? tradeInColor : undefined,
              tradeInBattery: hasTradeIn ? (parseFloat(tradeInBattery) || undefined) : undefined,
          };
          onSaveSimulation(simItem);
      }
  };

  // Filter inventory logic updated:
  // 1. Show available items AND ordered items.
  // 2. Hide items that have a "Promessa de venda" (Reservation) in observation.
  const filteredInventory = inventory.filter(item => {
    // Exclude items that are explicitly reserved for someone
    const isReserved = item.observation && item.observation.toLowerCase().includes('promessa de venda para');
    if (isReserved) return false;

    // Filter by Type (Used vs New)
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
      
      <div className="bg-gray-200 p-1 rounded-xl flex shadow-inner overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
              setMode(CalculatorMode.FROM_STOCK);
              setSelectedProductId('');
              setHasTradeIn(false); // Reset trade in on mode change
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.FROM_STOCK ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Box className="w-4 h-4" />
          Novos
        </button>
        <button
          onClick={() => {
              setMode(CalculatorMode.FROM_USED_STOCK);
              setSelectedProductId('');
              setHasTradeIn(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.FROM_USED_STOCK ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Usados
        </button>
        <button
          onClick={() => {
              setMode(CalculatorMode.SIMULATION);
              setSelectedProductId('');
              setHasTradeIn(false);
          }}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap ${
            mode === CalculatorMode.SIMULATION ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Manual
        </button>
      </div>
      
      {initialData && (
         <div className="bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100 flex items-center justify-between text-sm">
             <div className="flex items-center gap-2">
                 <Edit3 className="w-4 h-4" />
                 <span>Editando orçamento de: <strong>{initialData.productName}</strong></span>
             </div>
             {onCancelEdit && (
                 <button onClick={onCancelEdit} className="p-1 hover:bg-blue-100 rounded-lg">
                     <X className="w-4 h-4" />
                 </button>
             )}
         </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            
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
                    <option value="">Selecione um item disponível...</option>
                    {filteredInventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.memory} - {item.color})
                        {item.status === 'ordered' ? ' [A CAMINHO]' : ''} 
                        {item.isUsed ? ` [Bateria: ${item.batteryHealth}%]` : ''}
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
                        ? "Nenhum aparelho usado disponível." 
                        : "Sem produtos novos disponíveis."}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-gray-100 animate-fade-in">
                
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
                          type="button"
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

            {/* Trade-In Section (Available for ALL modes) */}
            {(mode === CalculatorMode.FROM_STOCK || mode === CalculatorMode.SIMULATION || mode === CalculatorMode.FROM_USED_STOCK) && (
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input 
                                type="checkbox" 
                                name="toggle" 
                                id="trade-in-toggle" 
                                checked={hasTradeIn}
                                onChange={(e) => setHasTradeIn(e.target.checked)}
                                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-apple-500"
                                style={{ right: hasTradeIn ? '0' : 'auto', left: hasTradeIn ? 'auto' : '0' }}
                            />
                            <label htmlFor="trade-in-toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${hasTradeIn ? 'bg-apple-500' : 'bg-gray-300'}`}></label>
                        </div>
                        <label htmlFor="trade-in-toggle" className="text-sm font-medium text-gray-700 flex items-center gap-1.5 cursor-pointer">
                            <Repeat className="w-4 h-4 text-apple-600" />
                            Aceitar usado na troca?
                        </label>
                    </div>

                    {hasTradeIn && (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-fade-in">
                            <Input 
                                label="Modelo do Aparelho" 
                                placeholder="Ex: iPhone 11"
                                value={tradeInName}
                                onChange={(e) => setTradeInName(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input 
                                    label="Memória" 
                                    placeholder="Ex: 64GB"
                                    value={tradeInMemory}
                                    onChange={(e) => setTradeInMemory(e.target.value)}
                                />
                                <Input 
                                    label="Cor" 
                                    placeholder="Ex: Preto"
                                    value={tradeInColor}
                                    onChange={(e) => setTradeInColor(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input 
                                    label="Saúde Bateria (%)" 
                                    placeholder="Ex: 85"
                                    type="number"
                                    value={tradeInBattery}
                                    onChange={(e) => setTradeInBattery(e.target.value)}
                                />
                                <Input 
                                    label="Valor de Avaliação (R$)" 
                                    type="number"
                                    placeholder="0.00"
                                    value={tradeInValue}
                                    onChange={(e) => setTradeInValue(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <Input 
                  label="Margem de Lucro" 
                  subLabel="(%)" 
                  value={margin} 
                  onChange={(e) => setMargin(e.target.value)} 
                  type="number"
                  placeholder="20"
                  className="text-lg font-bold text-apple-700"
              />
              <Input 
                  label="Preço Sugerido" 
                  subLabel="(R$)" 
                  value={sellPrice > 0 ? sellPrice.toFixed(2) : ''} 
                  onChange={(e) => {
                      // Reverse calculation: Update Margin based on Price
                      const newPrice = parseFloat(e.target.value);
                      if (!isNaN(newPrice) && costBrl > 0) {
                          const newMargin = ((newPrice / costBrl) - 1) * 100;
                          setMargin(newMargin.toFixed(2));
                      }
                  }}
                  type="number"
                  placeholder="0.00"
                  disabled={costBrl === 0}
                  className="text-lg font-bold text-gray-900 bg-gray-50"
              />
            </div>
      </div>

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
              
              {hasTradeIn && tradeInVal > 0 && (
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-red-300">
                        <span>(-) {settings.whatsappTradeInLabel || 'Troca'}: {tradeInName}</span>
                        <span>- R$ {tradeInVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-white border-t border-white/20 pt-1 mt-1">
                        <span>{settings.whatsappTotalLabel || 'Total a pagar'}:</span>
                        <span>R$ {finalPriceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
              )}

              <div className="flex justify-center mt-2">
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${
                       profit >= 0 
                       ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                       : 'bg-red-500/20 text-red-300 border-red-500/30'
                   }`}>
                      Lucro: {profit >= 0 ? '+' : ''} R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    {initialData ? "Atualizar" : "Salvar"}
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
                Calculado sobre o valor a pagar (R$ {finalPriceToPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).
            </p>

            <div className="divide-y divide-gray-100">
              {settings.installmentRules.map((rule) => {
                const totalWithInterest = finalPriceToPay * (1 + (rule.rate / 100));
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
