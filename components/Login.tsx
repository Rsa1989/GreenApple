import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Package2, ArrowRight, Lock, Beaker, Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { toggleTestMode, getTestModeStatus } from '../services/firestoreService';

interface LoginProps {
  settings: AppSettings;
  onLogin: () => void;
}

// Declare the global window property
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const Login: React.FC<LoginProps> = ({ settings, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isTester, setIsTester] = useState(false);
  
  // PWA State
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
      setIsTester(getTestModeStatus());

      // 1. Check if already installed (Standalone mode)
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // 2. Detect iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // 3. Check for the global prompt we captured in index.html
      if (window.deferredPrompt) {
          setCanInstall(true);
      }

      // 4. Also listen in case it fires late
      const handleBeforeInstallPrompt = (e: Event) => {
          e.preventDefault();
          window.deferredPrompt = e;
          setCanInstall(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === settings.adminPassword) {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleToggleTester = () => {
      const newState = !isTester;
      setIsTester(newState);
      toggleTestMode(newState);
  };

  const handleInstallClick = async () => {
      if (isIos) {
          setShowIosInstructions(true);
      } else if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          const { outcome } = await window.deferredPrompt.userChoice;
          if (outcome === 'accepted') {
              window.deferredPrompt = null;
              setCanInstall(false);
          }
      } else {
          // Fallback logic
          alert("Para instalar, procure a opção 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo' no menu do seu navegador.");
      }
  };

  // Only show button if NOT installed AND (We have an Android prompt OR it is iOS)
  const showInstallButton = !isStandalone && (canInstall || isIos);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 animate-fade-in transition-colors duration-300 relative"
      style={{ backgroundColor: settings.backgroundColor }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 z-10">
        
        {/* Header Branding */}
        <div 
           className="py-10 flex flex-col items-center justify-center gap-4 transition-colors duration-300 relative"
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
            
            {isTester && (
                <div className="absolute top-4 right-4 bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-orange-200">
                    Test Mode
                </div>
            )}
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

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                     {/* Install App Button */}
                     {showInstallButton && (
                        <button
                            type="button"
                            onClick={handleInstallClick}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-apple-50 text-apple-700 hover:bg-apple-100 border border-apple-100 shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            {isIos ? "Instalar no iPhone" : "Instalar Aplicativo"}
                        </button>
                     )}

                    <button
                        type="button"
                        onClick={handleToggleTester}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                            isTester 
                            ? 'bg-orange-50 text-orange-600 border border-orange-200' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <Beaker className="w-3.5 h-3.5" />
                        {isTester ? "Modo Tester Ativo" : "Versão de Testes"}
                    </button>
                </div>
            </form>
        </div>
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">GreenApple Management</p>

      {/* iOS Instructions Modal */}
      {showIosInstructions && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowIosInstructions(false)}>
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setShowIosInstructions(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full"
                  >
                      <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center text-center">
                      <div className="bg-gray-100 p-4 rounded-2xl mb-4">
                        <Smartphone className="w-10 h-10 text-gray-700" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Instalar no iPhone</h3>
                      <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                          O iOS não permite instalação automática. Siga os passos abaixo para adicionar à tela de início:
                      </p>

                      <div className="space-y-4 w-full text-left">
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500">
                                  <Share className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">1. Toque no botão <span className="font-bold">Compartilhar</span> na barra inferior.</span>
                          </div>

                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-700">
                                  <PlusSquare className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">2. Role para baixo e toque em <span className="font-bold">Adicionar à Tela de Início</span>.</span>
                          </div>
                      </div>

                      <div className="mt-6 w-full flex items-center justify-center gap-2 text-xs text-gray-400">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Aplicativo Seguro e Leve
                      </div>
                  </div>
                  
                  {/* Visual Indicator arrow pointing down (only for mobile portrait) */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white animate-bounce sm:hidden">
                      <ArrowRight className="w-8 h-8 rotate-90" />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};