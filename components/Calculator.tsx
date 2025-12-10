
import React, { useState, useEffect } from 'react';
import { ProductItem, CalculatorMode, AppSettings } from '../types';
import { Input } from './Input';
import { fetchCurrentExchangeRate } from '../services/geminiService';
import { Calculator, RefreshCw, Loader2, Sparkles, AlertCircle, CreditCard, Box, Edit3, Share2, MessageCircle, CheckCircle2, Circle } from 'lucide-react';

interface CalculatorProps {
  inventory: ProductItem[];
  settings: AppSettings;
}

export const CalculatorComponent: React.FC<CalculatorProps> = ({ inventory, settings }) => {
  const [mode, setMode] = useState<CalculatorMode>(CalculatorMode.FROM_STOCK);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Simulation State
  const [simCostUsd, setSimCostUsd] = useState('');
  const [simFeeUsd, setSimFeeUsd] = useState('');
  const [simRate, setSimRate] = useState('');
  const [simSpread, setSimSpread] = useState('');
  const [simTax, setSimTax] = useState('');
  const [margin, setMargin] = useState('20');
  
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateSource, setRateSource] = useState<string | null>(null);

  // Installment Selection State
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);

  // Initialize defaults
  useEffect(() => {
    if (mode === CalculatorMode.SIMULATION) {
      if (settings.defaultFeeUsd > 0 && !simFeeUsd) setSimFeeUsd(settings.defaultFeeUsd.toString());
      if (settings.defaultSpread > 0 && !simSpread) setSimSpread(settings.defaultSpread.toString());
      if (settings.defaultImportTax > 0 && !simTax) setSimTax(settings.defaultImportTax.toString());
    }
  }, [mode, settings]);

  // Initialize all installments as selected by default when settings change
  useEffect(() => {
    if (settings.installmentRules.length > 0) {
      setSelectedInstallments(settings.installmentRules.map(r => r.installments));
    }
  }, [settings.installmentRules]);

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

    if (mode === CalculatorMode.FROM_STOCK) {
      const item = inventory.find(i => i.id === selectedProductId);
      if (item) {
        costBrl = item.totalCostBrl;
        prodUsd = item.costUsd;
        feeUsd = item.feeUsd;
        baseUsd = prodUsd + feeUsd;
        effectiveRate = item.exchangeRate + item.spread;
        importTax = item.importTaxBrl;
        productName = `${item.name} ${item.memory} ${item.color}`;
      }
    } else {
      prodUsd = parseFloat(simCostUsd) || 0;
      feeUsd = parseFloat(simFeeUsd) || 0;
      const r = parseFloat(simRate) || 0;
      const s = parseFloat(simSpread) || 0;
      const t = parseFloat(simTax) || 0;

      baseUsd = prodUsd + feeUsd;
      effectiveRate = r + s;
      costBrl = (baseUsd * effectiveRate) + t;
      importTax = t;
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
    message = message.replace(/{produto}/g, productName);
    message = message.replace(/{preco}/g, formatCurrency(sellPrice));
    message = message.replace(/{parcelas}/g, installmentLines || "(Consulte condições)");

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20">
      
      {/* iOS Style Segmented Control */}
      <div className="bg-gray-200 p-1 rounded-xl flex shadow-inner">
        <button
          onClick={() => setMode(CalculatorMode.FROM_STOCK)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === CalculatorMode.FROM_STOCK ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Box className="w-4 h-4" />
          Estoque
        </button>
        <button
          onClick={() => setMode(CalculatorMode.SIMULATION)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            mode === CalculatorMode.SIMULATION ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Simular
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            {mode === CalculatorMode.FROM_STOCK ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Produto</label>
                <div className="relative">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full appearance-none px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none bg-white text-base"
                  >
                    <option value="">Selecione um item...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.memory} - {item.color})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                  </div>
                </div>
                
                {inventory.length === 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Sem produtos cadastrados.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
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
              <div className="flex justify-between text-xs text-gray-500">
                 <span>Dólar Efetivo</span>
                 <span>R$ {effectiveRate.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                 <span>Total USD</span>
                 <span>$ {baseUsd.toFixed(2)}</span>
              </div>
          </div>
          
          {sellPrice > 0 && (
            <button 
                onClick={handleWhatsAppShare}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
                <MessageCircle className="w-5 h-5" />
                Enviar no WhatsApp
            </button>
          )}
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
