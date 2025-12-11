
import React, { useState } from 'react';
import { Transaction } from '../types';
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, Package, Wallet, Trash2, Loader2, BarChart3, AlertCircle, Download } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  onClear: () => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
}

export const Reports: React.FC<ReportsProps> = ({ transactions, onClear, onDeleteTransaction }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  
  // State for individual row deletion
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  
  // 1. CASH IN (Entrada de Caixa) = Sales amount (Net cash received)
  const cashIn = transactions
    .filter(t => t.type === 'SALE')
    .reduce((acc, t) => acc + t.amount, 0);

  // 2. CASH OUT (Saída de Caixa) = Stock Purchases (New items)
  // Note: Trade-ins are excluded from Cash Out because they are non-cash acquisitions
  const cashOut = transactions
    .filter(t => t.type === 'STOCK_ENTRY')
    .reduce((acc, t) => acc + t.amount, 0);

  // 3. GROSS REVENUE (Faturamento) = Sales Cash ONLY
  // Modified: Exclude tradeInValue to match user request "Tudo que entrou em dinheiro"
  const grossRevenue = transactions
    .filter(t => t.type === 'SALE')
    .reduce((acc, t) => acc + t.amount, 0);

  // 4. TOTAL STOCK INVESTMENT (Investimento Estoque) = Cash Purchases + Trade-ins accepted
  const totalStockInvestment = transactions
    .filter(t => t.type === 'STOCK_ENTRY' || t.type === 'TRADE_IN_ENTRY')
    .reduce((acc, t) => acc + t.amount, 0);

  // 5. REALIZED PROFIT (Lucro Líquido)
  // Formula: (Net Cash Received) - (Cost of Item Sold)
  const realizedProfit = transactions
    .filter(t => t.type === 'SALE')
    .reduce((acc, t) => {
        const netCashReceived = t.amount;
        const itemCost = t.cost || 0; 
        return acc + (netCashReceived - itemCost);
    }, 0);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearClick = async () => {
      if (confirmClear) {
          setIsClearing(true);
          try {
              await onClear();
          } catch (error) {
              alert("Erro ao limpar relatório.");
          } finally {
              setIsClearing(false);
              setConfirmClear(false);
          }
      } else {
          setConfirmClear(true);
          setTimeout(() => setConfirmClear(false), 3000);
      }
  };

  const handleDeleteClick = (id: string) => {
    if (confirmingDeleteId === id) {
        // User clicked twice, execute delete
        handleExecuteDelete(id);
    } else {
        // First click, show confirmation
        setConfirmingDeleteId(id);
        // Reset after 3 seconds if not confirmed
        setTimeout(() => {
            setConfirmingDeleteId(prev => prev === id ? null : prev);
        }, 3000);
    }
  };

  const handleExecuteDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmingDeleteId(null);
    try {
        await onDeleteTransaction(id);
    } catch (error) {
        alert("Erro ao excluir movimentação. Verifique sua conexão.");
        console.error(error);
    } finally {
        setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Define CSV Headers
    const headers = [
      "Data",
      "Hora",
      "Tipo Movimentação",
      "Descrição",
      "Valor (R$)",
      "Custo Produto (R$)",
      "Lucro (R$)",
      "Observações (Troca)"
    ];

    // Format Data Rows
    const rows = transactions.map(t => {
      const dateObj = new Date(t.date);
      const dateStr = dateObj.toLocaleDateString('pt-BR');
      const timeStr = dateObj.toLocaleTimeString('pt-BR');
      
      let typeLabel = "Outro";
      if (t.type === 'SALE') typeLabel = "Venda";
      if (t.type === 'STOCK_ENTRY') typeLabel = "Compra Estoque";
      if (t.type === 'TRADE_IN_ENTRY') typeLabel = "Entrada Troca";

      const profit = (t.type === 'SALE' ? (t.amount - (t.cost || 0)) : 0);
      const tradeInInfo = t.tradeInValue ? `Troca aceita: R$ ${t.tradeInValue.toFixed(2).replace('.', ',')}` : "";

      // Escape quotes in description to avoid breaking CSV
      const safeDescription = t.description.replace(/"/g, '""');

      return [
        dateStr,
        timeStr,
        typeLabel,
        `"${safeDescription}"`, // Quotes to handle commas inside text
        t.amount.toFixed(2).replace('.', ','),
        t.cost ? t.cost.toFixed(2).replace('.', ',') : "0,00",
        profit.toFixed(2).replace('.', ','),
        `"${tradeInInfo}"`
      ].join(";"); // Using semicolon for better Excel PT-BR compatibility
    });

    // Add BOM for UTF-8 compatibility in Excel
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");

    // Create Download Link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_greenapple_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-apple-700" />
            <h2 className="text-xl font-bold text-apple-700">Relatório Financeiro</h2>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
              {transactions.length > 0 && (
                  <>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-apple-600 text-white hover:bg-apple-700 active:scale-95"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar
                    </button>

                    <button
                        onClick={handleClearClick}
                        disabled={isClearing}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm
                            ${confirmClear 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'}
                        `}
                    >
                        {isClearing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : confirmClear ? (
                            "Confirmar?"
                        ) : (
                            <>
                                <Trash2 className="w-3.5 h-3.5" />
                                Limpar
                            </>
                        )}
                    </button>
                  </>
              )}
          </div>
      </div>

      {/* Primary Cards: Profit and Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Profit Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-5">
                 <Wallet className="w-24 h-24" />
             </div>
             <div className="flex items-center gap-2 text-blue-600 font-bold text-sm z-10 uppercase tracking-wide">
                <div className="p-1.5 bg-blue-50 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                Lucro Líquido
             </div>
             <span className={`text-4xl font-bold z-10 ${realizedProfit >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                R$ {realizedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
             <p className="text-xs text-gray-400 z-10 mt-1">
                 (Vendas - Custo)
             </p>
          </div>

          {/* Gross Revenue Card (Moved to top) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 relative overflow-hidden">
             <div className="absolute right-0 top-0 p-4 opacity-5">
                 <BarChart3 className="w-24 h-24" />
             </div>
             <div className="flex items-center gap-2 text-green-600 font-bold text-sm z-10 uppercase tracking-wide">
                <div className="p-1.5 bg-green-50 rounded-lg"><ArrowUpRight className="w-4 h-4" /></div>
                Faturamento
             </div>
             <span className="text-4xl font-bold z-10 text-green-700">
                R$ {grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
             <p className="text-xs text-gray-400 z-10 mt-1">
                 Total recebido em dinheiro
             </p>
          </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-gray-600 font-medium text-xs uppercase">
                    <div className="p-1.5 bg-gray-100 rounded-lg"><ArrowDownLeft className="w-3.5 h-3.5" /></div>
                    Investimento em Estoque
                </div>
                <span className="text-lg font-bold text-gray-900">
                    R$ {totalStockInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-gray-400">Compras + Trocas aceitas</span>
             </div>
             <Package className="w-8 h-8 text-gray-200" />
        </div>
      </div>

      <div className="space-y-4 pt-2">
         <h3 className="font-semibold text-gray-700 ml-1">Movimentações Recentes</h3>
         
         {transactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <Package className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhuma transação registrada.</p>
             </div>
         ) : (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 {transactions.map(t => {
                     const isSale = t.type === 'SALE';
                     const isTradeIn = t.type === 'TRADE_IN_ENTRY';
                     const isStockEntry = t.type === 'STOCK_ENTRY';
                     
                     const isDeletingThis = deletingId === t.id;
                     const isConfirming = confirmingDeleteId === t.id;
                     
                     // Colors and Icons
                     let icon = <Package className="w-5 h-5" />;
                     let bgColor = 'bg-gray-100';
                     let textColor = 'text-gray-600';
                     let amountColor = 'text-gray-900';
                     let sign = '';

                     if (isSale) {
                        icon = <TrendingUp className="w-5 h-5" />;
                        bgColor = 'bg-blue-50';
                        textColor = 'text-blue-600';
                        amountColor = 'text-blue-700';
                        sign = '+';
                     } else if (isStockEntry) {
                        icon = <ArrowDownLeft className="w-5 h-5" />;
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-600';
                        amountColor = 'text-red-600';
                        sign = '-';
                     } else if (isTradeIn) {
                        icon = <ArrowDownLeft className="w-5 h-5" />; 
                        bgColor = 'bg-red-50';
                        textColor = 'text-red-600';
                        amountColor = 'text-red-600';
                        sign = '-'; 
                     }
                     
                     // Profit Calculation for this specific item (Cash Basis)
                     // Profit = Net Cash Received (t.amount) - Cost (t.cost)
                     const itemProfit = isSale ? (t.amount - (t.cost || 0)) : 0;
                     
                     return (
                         <div key={t.id} className="p-4 border-b border-gray-50 last:border-none flex items-center justify-between hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`p-2 rounded-xl flex-shrink-0 ${bgColor} ${textColor}`}>
                                    {icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-800 text-sm truncate">{t.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(t.date)}
                                        </div>
                                    </div>
                                    
                                    {isSale && (
                                        <div className="mt-1 flex flex-col gap-0.5">
                                            {t.tradeInValue && t.tradeInValue > 0 && (
                                                <span className="text-[10px] text-purple-600 font-medium">
                                                    + Troca: R$ {t.tradeInValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold ${itemProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                Lucro: {itemProfit >= 0 ? '+' : ''} R$ {itemProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 text-right">
                                    <span className={`font-bold text-sm whitespace-nowrap ${amountColor}`}>
                                        {sign} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {isSale && t.cost && (
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            Custo: R$ {t.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleDeleteClick(t.id)}
                                    disabled={isDeletingThis}
                                    className={`
                                        p-2 rounded-lg transition-all text-xs font-bold
                                        ${isConfirming 
                                            ? 'bg-red-600 text-white w-20' 
                                            : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}
                                    `}
                                    title="Excluir registro"
                                >
                                    {isDeletingThis ? (
                                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                    ) : isConfirming ? (
                                        "Confirmar?"
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                         </div>
                     );
                 })}
             </div>
         )}
      </div>
    </div>
  );
};
