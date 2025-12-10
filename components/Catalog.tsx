
import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { Plus, Trash2, Search, BookOpen, Loader2 } from 'lucide-react';
import { Input } from './Input';

interface CatalogProps {
  catalog: CatalogItem[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Catalog: React.FC<CatalogProps> = ({ catalog, onAdd, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsAdding(true);
    try {
      await onAdd(newName.trim());
      setNewName('');
    } catch (error) {
      alert("Erro ao adicionar item.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      alert("Erro ao remover item.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCatalog = catalog.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-apple-700" />
          <h2 className="text-xl font-bold text-apple-700">Catálogo de Produtos</h2>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleAdd} className="flex gap-2">
             <div className="flex-1">
                <Input 
                   label="Nome do Produto" 
                   placeholder="Ex: iPhone 15 Pro Max" 
                   value={newName}
                   onChange={(e) => setNewName(e.target.value)}
                />
             </div>
             <button 
                type="submit"
                disabled={isAdding || !newName.trim()}
                className="mt-6 bg-gray-900 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
             >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
             </button>
          </form>
      </div>

      {/* Search Bar */}
      <div className="relative shadow-sm">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
            type="text" 
            placeholder="Buscar no catálogo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 text-base border-none rounded-2xl bg-white focus:ring-0 shadow-sm"
        />
      </div>

      <div className="space-y-2">
          {filteredCatalog.length === 0 ? (
             <div className="text-center py-10 text-gray-400">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum item encontrado.</p>
             </div>
          ) : (
              filteredCatalog.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100 transition-colors"
                      >
                         {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
