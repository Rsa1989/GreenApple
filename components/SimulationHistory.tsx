
import React, { useState } from 'react';
import { SimulationItem } from '../types';
import { Clock, User, Phone, Trash2, Calendar, Search, FileText, DollarSign, Loader2, ExternalLink } from 'lucide-react';

interface SimulationHistoryProps {
  simulations: SimulationItem[];
  onDelete: (id: string) => Promise<void> | void;
  onSelect?: (simulation: SimulationItem) => void;
}

export const SimulationHistory: React.FC<SimulationHistoryProps> = ({ simulations, onDelete, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  const handleClickDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (confirmingId === id) {
          // User confirmed, proceed to delete
          handleExecuteDelete(id);
      } else {
          // First click, show confirmation state
          setConfirmingId(id);
          // Auto-reset confirmation after 3 seconds
          setTimeout(() => {
              setConfirmingId(prev => prev === id ? null : prev);
          }, 3000);
      }
  };

  const handleExecuteDelete = async (id: string) => {
      setDeletingId(id);
      setConfirmingId(null);
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Error deleting", error);
        alert("Erro ao excluir item.");
      } finally {
        setDeletingId(null);
      }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Histórico de Simulações</h2>
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

      <div className="space-y-4">
        {filteredSimulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhuma simulação encontrada.</p>
            </div>
        ) : (
            filteredSimulations.map(sim => {
                const isConfirming = confirmingId === sim.id;
                const isDeleting = deletingId === sim.id;

                return (
                    <div 
                        key={sim.id} 
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 transition-all hover:shadow-md relative z-10"
                    >
                        
                        {/* Header Row: User Info + Delete Button */}
                        <div className="flex justify-between items-start border-b border-gray-50 pb-3 mb-1">
                            <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                                <div className="bg-blue-50 p-2 rounded-full mt-1 flex-shrink-0">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                                        {sim.customerName} {sim.customerSurname}
                                    </h3>
                                    {sim.customerPhone && (
                                        <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">{sim.customerPhone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {onSelect && (
                                    <button
                                        onClick={() => onSelect(sim)}
                                        className="bg-gray-50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Abrir
                                    </button>
                                )}
                                
                                <button 
                                    type="button"
                                    onClick={(e) => handleClickDelete(e, sim.id)}
                                    disabled={isDeleting}
                                    className={`
                                        flex items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all flex-shrink-0 shadow-sm font-medium text-sm
                                        ${isConfirming 
                                            ? 'bg-red-600 text-white hover:bg-red-700 w-auto' 
                                            : 'bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 w-10'}
                                    `}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                    ) : isConfirming ? (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            <span>Confirmar?</span>
                                        </>
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="py-1">
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Produto</span>
                            <p className="font-medium text-gray-800 leading-snug break-words">{sim.productName}</p>
                        </div>

                        <div className="flex items-end justify-between bg-gray-50 p-3 rounded-xl">
                            <div>
                                <span className="text-xs text-gray-400 block mb-1">Valor Venda</span>
                                <span className="font-bold text-lg text-green-700">
                                    R$ {sim.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1 justify-end">
                                    <DollarSign className="w-3 h-3" />
                                    <span>Custo: {sim.totalCostBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(sim.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
