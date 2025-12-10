
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Package2, ArrowRight, Lock } from 'lucide-react';

interface LoginProps {
  settings: AppSettings;
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ settings, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === settings.adminPassword) {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in transition-colors duration-300"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Branding */}
        <div 
           className="py-10 flex flex-col items-center justify-center gap-4 transition-colors duration-300"
           style={{ backgroundColor: settings.headerBackgroundColor }}
        >
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
            ) : (
                <div className="bg-apple-500 rounded-2xl p-4 text-white shadow-lg shadow-apple-200">
                    <Package2 className="w-10 h-10" />
                </div>
            )}
            <h1 className="text-2xl font-bold text-apple-700 tracking-tight">Bem-vindo</h1>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">Senha de Acesso</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className={`pl-11 w-full px-4 py-3.5 border rounded-xl focus:ring-2 focus:ring-apple-500 outline-none transition-all text-lg ${
                                error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 bg-gray-50 focus:bg-white'
                            }`}
                            placeholder="••••"
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-sm mt-2 ml-1 animate-pulse">Senha incorreta. Tente novamente.</p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group hover:bg-black"
                    style={{ backgroundColor: settings.themeColor }}
                >
                    Entrar
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">GreenApple Management</p>
    </div>
  );
};
