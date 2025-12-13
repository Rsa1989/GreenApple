
import React, { useState } from 'react';
import { SimulationItem, ProductItem, AppSettings } from '../types';
import { Clock, User, Trash2, Calendar, Search, FileText, DollarSign, Loader2, ExternalLink, CheckCircle2, AlertCircle, Copy, History, ShoppingBag, Repeat, CalendarClock, X } from 'lucide-react';

interface SimulationHistoryProps {
  simulations: SimulationItem[];
  inventory: ProductItem[];
  settings: AppSettings;
  onDelete: (id: string) => Promise<void> | void;
  onSelect?: (simulation: SimulationItem) => void;
  onSell?: (simulation: SimulationItem) => Promise<void> | void;
  onOrder?: (simulation: SimulationItem) => void;
  // New props for Tester Mode
  isTestMode?: boolean;
  onUpdate?: (simulation: SimulationItem) => Promise<void> | void;
}

export const SimulationHistory: React.FC<SimulationHistoryProps> = ({ simulations, inventory, settings, onDelete, onSelect, onSell, onOrder, isTestMode, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [orderingId, setOrderingId] = useState<string | null>(null); // State to show loading when clicking Order
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingSellId, setConfirmingSellId] = useState<string | null>(null);
  
  // TESTER MODE: Track which menu is open
  const [dateMenuOpenId, setDateMenuOpenId] = useState<string | null>(null);

  // Determine expiration limit based on settings
  const EXPIRATION_DAYS = settings.proposalExpirationDays || 7;
  const EXPIRATION_MS = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

  const filteredSimulations = simulations.filter(sim => 
    sim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sim.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sim.customerPhone.includes(searchTerm)
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- DELETE LOGIC ---
  const handleClickDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (confirmingDeleteId === id) {
          handleExecuteDelete(id);
      } else {
          setConfirmingDeleteId(id);
          setConfirmingSellId(null);
          setTimeout(() => setConfirmingDeleteId(prev => prev === id ? null : prev), 3000);
      }
  };

  const handleExecuteDelete = async (id: string) => {
      setDeletingId(id);
      setConfirmingDeleteId(null);
      try {
        await onDelete(id);
      } catch (error) {
        alert("Erro ao excluir item.");
      } finally {
        setDeletingId(null);
      }
  };

  // --- SELL LOGIC ---
  const handleClickSell = (e: React.MouseEvent, id: string, sim: SimulationItem) => {
      e.stopPropagation();
      e.preventDefault();

      if (sim.status === 'sold') return;

      // VALIDATION: Prevent selling items that are 'ordered' but not received
      const linkedProduct = inventory.find(i => i.id === sim.productId);
      
      // Logic Fix:
      // If linked product exists, we rely PURELY on its status (in_stock vs ordered).
      // If linked product is 'in_stock', we allow sale even if sim.status says 'ordered' (history).
      if (linkedProduct) {
          if (linkedProduct.status === 'ordered') {
             alert("Este item ainda está marcado como 'Em Pedido'.\n\nPor favor, vá até a aba 'Estoque', localize o item na lista 'Em Pedido' e clique em 'Receber' para confirmar a chegada antes de realizar a venda.");
             return;
          }
      } else {
          // If no linked product (legacy or deleted), we check the simulation status as fallback
          if (sim.status === 'ordered') {
              alert("Este item consta como 'Em Pedido' mas o produto vinculado não foi encontrado no estoque.\n\nVerifique se o item já foi recebido ou excluído.");
              return;
          }
      }

      if (confirmingSellId === id) {
          handleExecuteSell(sim);
      } else {
          setConfirmingSellId(id);
          setConfirmingDeleteId(null);
          setTimeout(() => setConfirmingSellId(prev => prev === id ? null : prev), 3000);
      }
  };

  const handleExecuteSell = async (sim: SimulationItem) => {
      if (!onSell || !sim.id) return;
      setSellingId(sim.id);
      setConfirmingSellId(null);
      try {
          await onSell(sim);
      } catch (error: any) {
          alert("Erro ao registrar venda: " + error.message);
      } finally {
          setSellingId(null);
      }
  }

  // --- ORDER LOGIC ---
  const handleClickOrder = (e: React.MouseEvent, sim: SimulationItem) => {
    e.stopPropagation();
    e.preventDefault();
    if (onOrder) {
        setOrderingId(sim.id);
        onOrder(sim);
    }
  };

  // --- TESTER MODE: DATE MANIPULATION (NEW POPOVER LOGIC) ---
  const toggleDateMenu = (e: React.MouseEvent, simId: string) => {
      e.stopPropagation();
      e.preventDefault();
      // Toggle: if clicking same ID, close it. If clicking different, open that one.
      setDateMenuOpenId(prev => prev === simId ? null : simId);
  };

  const handleApplyDateChange = async (days: number, sim: SimulationItem) => {
      if (!onUpdate) return;
      setDateMenuOpenId(null); // Close menu
      
      const newTimestamp = Date.now() - (days * 24 * 60 * 60 * 1000);
      try {
          await onUpdate({
              ...sim,
              createdAt: newTimestamp
          });
      } catch (error) {
          alert("Falha ao atualizar data de teste.");
      }
  };

  // --- OPEN/EDIT LOGIC ---
  const handleOpen = (sim: SimulationItem, isExpired: boolean) => {
      if (!onSelect) return;

      if (isExpired) {
          // If expired, we clone the data but strip the ID and timestamps
          const { id, createdAt, soldAt, status, ...rest } = sim;
          onSelect({
              ...rest,
              id: '', // Empty ID = New Entry
              createdAt: Date.now(),
              status: undefined
          } as SimulationItem);
      } else {
          // Valid simulation: Open for editing (keeps ID)
          onSelect(sim);
      }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-apple-700" />
          <h2 className="text-xl font-bold text-apple-700">Histórico de Simulações</h2>
      </div>

      {/* Search Bar */}
      <div className="sticky top-16 z-20 bg-gray-50 pb-2">
        <div className="relative shadow-sm">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por cliente ou produto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 text-base border-none rounded-2xl bg-white focus:ring-0 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredSimulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhuma simulação encontrada.</p>
            </div>
        ) : (
            filteredSimulations.map(sim => {
                const isConfirmingDelete = confirmingDeleteId === sim.id;
                const isDeleting = deletingId === sim.id;
                
                const isConfirmingSell = confirmingSellId === sim.id;
                const isSelling = sellingId === sim.id;
                const isSold = sim.status === 'sold';
                const isOrdered = sim.status === 'ordered';

                // Check expiration
                const timeDiff = Date.now() - sim.createdAt;
                const isExpired = timeDiff > EXPIRATION_MS;

                // Logic to check if item is out of stock (if it came from stock)
                const productExists = inventory.some(i => i.id === sim.productId);
                const isOutOfStock = !isSold && sim.productId && !productExists && (sim.mode === 'FROM_STOCK' || sim.mode === 'FROM_USED_STOCK');
                
                // Show order button if it was a manual simulation (or item is gone) and not sold yet
                // AND not ordered yet
                const showOrderButton = !isSold && !isOrdered && !isExpired && (sim.mode === 'SIMULATION' || isOutOfStock);
                
                const isOrdering = orderingId === sim.id;
                const isMenuOpen = dateMenuOpenId === sim.id;

                return (
                    <div 
                        key={sim.id} 
                        className={`bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2 relative transition-all hover:shadow-md ${isSold ? 'bg-green-50/20' : isExpired ? 'bg-gray-50 opacity-90' : ''}`}
                    >
                        {/* Compact Row: Name | Price */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSold ? 'bg-green-100 text-green-600' : isExpired ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                                        {sim.customerName} {sim.customerSurname}
                                    </h3>
                                    <div className="text-[10px] text-gray-500 font-medium truncate">
                                        {sim.productName}
                                    </div>
                                    {/* Trade-In Info Badge */}
                                    {sim.tradeInName && (
                                        <div className="text-[10px] text-purple-600 font-semibold flex flex-col mt-0.5 leading-tight">
                                            <div className="flex items-center gap-1">
                                                <Repeat className="w-3 h-3" />
                                                Troca: {sim.tradeInName}
                                            </div>
                                            {(sim.tradeInMemory || sim.tradeInColor) && (
                                                <span className="text-gray-400 pl-4">
                                                    {sim.tradeInMemory} {sim.tradeInColor}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                                <div className={`font-bold text-base ${isSold ? 'text-green-700' : isExpired ? 'text-gray-500' : 'text-gray-900'}`}>
                                    R$ {formatCurrency(sim.sellingPrice)}
                                </div>
                                
                                {/* Standard Date Display - Clickable in Test Mode */}
                                <div 
                                    className={`text-[10px] text-gray-400 flex items-center justify-end gap-1 ${isTestMode && !isSold ? 'cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-1 rounded transition-colors' : ''}`}
                                    onClick={isTestMode && !isSold ? (e) => toggleDateMenu(e, sim.id) : undefined}
                                    title={isTestMode && !isSold ? "Clique para mudar a data" : ""}
                                >
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(sim.createdAt).split(',')[0]}
                                </div>

                                {/* TESTER MODE: Update Date Button with Popover */}
                                {isTestMode && !isSold && (
                                    <div className="relative inline-block mt-0.5">
                                        <button 
                                            onClick={(e) => toggleDateMenu(e, sim.id)}
                                            className={`
                                                px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide border flex items-center gap-1 shadow-sm active:translate-y-0.5 transition-all
                                                ${isMenuOpen 
                                                    ? 'bg-orange-200 text-orange-800 border-orange-300' 
                                                    : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'}
                                            `}
                                            title="Simular mudança de data para testar expiração"
                                        >
                                            <CalendarClock className="w-3 h-3" />
                                            {isMenuOpen ? 'FECHAR MENU' : 'MUDAR DATA'}
                                        </button>

                                        {/* POPOVER MENU */}
                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in ring-1 ring-black ring-opacity-5">
                                                <div className="bg-orange-50 px-3 py-2 border-b border-orange-100 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Simular Data</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setDateMenuOpenId(null); }}
                                                        className="p-0.5 rounded-full hover:bg-orange-200 text-orange-600"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="p-1 flex flex-col gap-0.5">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleApplyDateChange(0, sim); }}
                                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                                    >
                                                        <span>Hoje</span>
                                                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-[10px] group-hover:bg-white">0d</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleApplyDateChange(EXPIRATION_DAYS - 1, sim); }}
                                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                                    >
                                                        <span>Quase Expirado</span>
                                                        <span className="bg-orange-100 text-orange-600 px-1.5 rounded text-[10px] group-hover:bg-white">{EXPIRATION_DAYS - 1}d</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleApplyDateChange(EXPIRATION_DAYS + 1, sim); }}
                                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors group"
                                                    >
                                                        <span>Expirado</span>
                                                        <span className="bg-red-100 text-red-600 px-1.5 rounded text-[10px] group-hover:bg-white">{EXPIRATION_DAYS + 1}d</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleApplyDateChange(30, sim); }}
                                                        className="flex items-center justify-between w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                                    >
                                                        <span>Mês Passado</span>
                                                        <span className="bg-gray-100 text-gray-500 px-1.5 rounded text-[10px] group-hover:bg-white">30d</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {isSold ? (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
                                    <CheckCircle2 className="w-3 h-3" /> Vendido
                                </span>
                            ) : (
                                <>
                                    {isExpired && (
                                        <span 
                                            className={`inline-flex items-center gap-1 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isTestMode ? 'cursor-pointer hover:bg-orange-200 hover:text-orange-800' : ''}`}
                                            onClick={isTestMode ? (e) => toggleDateMenu(e, sim.id) : undefined}
                                            title={isTestMode ? "Clique para mudar a data" : ""}
                                        >
                                            <History className="w-3 h-3" /> Obsoleto ({EXPIRATION_DAYS}d)
                                        </span>
                                    )}
                                    {isOutOfStock && (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase border border-amber-100">
                                            <AlertCircle className="w-3 h-3" /> Sem Estoque
                                        </span>
                                    )}
                                    {isOrdered && (
                                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border border-purple-100">
                                            <ShoppingBag className="w-3 h-3" /> Pedido Realizado
                                        </span>
                                    )}
                                </>
                            )}
                            
                            {/* If Manual mode */}
                            {sim.mode === 'SIMULATION' && !isSold && !isExpired && (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase">
                                    Manual
                                </span>
                            )}
                        </div>

                        {/* Actions Row (Bottom Right) */}
                        <div className="flex justify-end items-center gap-2 mt-1 pt-2 border-t border-gray-50">
                             
                             {/* Order Button (Fill Inventory) */}
                             {showOrderButton && onOrder && (
                                <button
                                    type="button"
                                    onClick={(e) => handleClickOrder(e, sim)}
                                    disabled={isOrdering}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
                                    title="Cadastrar no Estoque (Fazer Pedido)"
                                >
                                    {isOrdering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                                    Fazer Pedido
                                </button>
                             )}

                             {/* Sell Button - Now Allowed even if Out of Stock, BUT NOT IF EXPIRED */}
                             {!isSold && !isExpired && onSell && (
                                     <button
                                        type="button"
                                        onClick={(e) => handleClickSell(e, sim.id, sim)}
                                        disabled={isSelling}
                                        className={`
                                            flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-bold
                                            ${isConfirmingSell 
                                                ? 'bg-green-600 text-white' 
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'}
                                        `}
                                     >
                                        {isSelling ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : isConfirmingSell ? (
                                            "Confirmar?"
                                        ) : (
                                            <>
                                               <DollarSign className="w-3.5 h-3.5" /> Vender
                                            </>
                                        )}
                                     </button>
                             )}

                            {/* Open Button (Handles Edit vs Copy based on Expiration) */}
                            {!isSold && onSelect && (
                                <button
                                    onClick={() => handleOpen(sim, isExpired)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors
                                        ${isExpired 
                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                                            : 'bg-gray-50 text-blue-600 hover:bg-blue-50'}
                                    `}
                                >
                                    {isExpired ? (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Novo Orçamento
                                        </>
                                    ) : (
                                        <>
                                            <ExternalLink className="w-3.5 h-3.5" /> Abrir
                                        </>
                                    )}
                                </button>
                            )}

                             {/* Delete Button */}
                            <button 
                                type="button"
                                onClick={(e) => handleClickDelete(e, sim.id)}
                                disabled={isDeleting}
                                className={`
                                    flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-all text-xs font-bold
                                    ${isConfirmingDelete 
                                        ? 'bg-red-600 text-white' 
                                        : 'bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50'}
                                `}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isConfirmingDelete ? (
                                    "Apagar?"
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
