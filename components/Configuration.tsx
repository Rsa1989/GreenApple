
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { Input } from './Input';
import { Save, ChevronRight, Upload, Trash2, MessageCircle, Lock, Eye, EyeOff } from 'lucide-react';

interface ConfigurationProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };
  
  const handleTextChange = (field: keyof AppSettings, value: string) => {
      setLocalSettings(prev => ({
        ...prev,
        [field]: value
      }));
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({
      ...prev,
      themeColor: e.target.value
    }));
  };

  const handleHeaderColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({
      ...prev,
      headerBackgroundColor: e.target.value
    }));
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({
      ...prev,
      backgroundColor: e.target.value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalSettings(prev => ({ ...prev, logoUrl: null }));
  };

  const handleInstallmentChange = (index: number, value: string) => {
    const newRules = [...localSettings.installmentRules];
    newRules[index] = {
      ...newRules[index],
      rate: parseFloat(value) || 0
    };
    setLocalSettings(prev => ({ ...prev, installmentRules: newRules }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalSettings(prev => ({
          ...prev,
          whatsappTemplate: e.target.value
      }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Security */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-4">Segurança</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
               <div className="relative">
                   <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                       <Lock className="w-4 h-4 text-apple-600" />
                       Senha de Acesso
                   </label>
                   <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={localSettings.adminPassword}
                            onChange={(e) => handleTextChange('adminPassword', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none text-base bg-gray-50 focus:bg-white pr-12"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                   </div>
                   <p className="text-xs text-gray-400 mt-2">Esta senha será solicitada ao abrir o aplicativo.</p>
               </div>
            </div>
          </div>

          {/* Section: Visual Identity */}
          <div>
             <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-4">Identidade Visual</h3>
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Theme Color */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: localSettings.themeColor }}></div>
                      <span className="text-gray-900 font-medium">Cor Principal</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="color" 
                        value={localSettings.themeColor} 
                        onChange={handleColorChange}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                   </div>
                </div>

                {/* Header Color */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: localSettings.headerBackgroundColor }}></div>
                      <span className="text-gray-900 font-medium">Cor do Topo</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="color" 
                        value={localSettings.headerBackgroundColor} 
                        onChange={handleHeaderColorChange}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                   </div>
                </div>

                {/* Background Color */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: localSettings.backgroundColor }}></div>
                      <span className="text-gray-900 font-medium">Cor de Fundo</span>
                   </div>
                   <div className="relative">
                      <input 
                        type="color" 
                        value={localSettings.backgroundColor} 
                        onChange={handleBackgroundColorChange}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                   </div>
                </div>
                
                {/* Logo */}
                <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden relative">
                          {localSettings.logoUrl ? (
                            <img src={localSettings.logoUrl} className="w-full h-full object-contain" />
                          ) : (
                            <Upload className="w-5 h-5 text-gray-400" />
                          )}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-gray-900 font-medium">Logotipo</span>
                         <span className="text-xs text-gray-400">PNG ou JPG</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <label className="text-apple-600 font-medium text-sm px-3 py-1.5 bg-apple-50 rounded-lg cursor-pointer">
                        Alterar
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {localSettings.logoUrl && (
                        <button type="button" onClick={removeLogo} className="p-2 text-red-500 bg-red-50 rounded-lg">
                           <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                </div>
             </div>
          </div>

          {/* Section: Defaults */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-4">Valores Padrão</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <Input
                label="Taxa Atravessador"
                subLabel="(USD)"
                type="number"
                step="0.01"
                value={localSettings.defaultFeeUsd}
                onChange={(e) => handleChange('defaultFeeUsd', e.target.value)}
              />
              <Input
                label="Spread"
                subLabel="(R$)"
                type="number"
                step="0.01"
                value={localSettings.defaultSpread}
                onChange={(e) => handleChange('defaultSpread', e.target.value)}
              />
              <Input
                label="Taxa Importação"
                subLabel="(R$)"
                type="number"
                step="0.01"
                value={localSettings.defaultImportTax}
                onChange={(e) => handleChange('defaultImportTax', e.target.value)}
              />
            </div>
          </div>

          {/* Section: WhatsApp Template */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-4">Compartilhamento</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Mensagem do WhatsApp</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                    Personalize a mensagem enviada ao cliente. Use as variáveis abaixo:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-mono">{`{produto}`}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-mono">{`{preco}`}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-mono">{`{parcelas}`}</span>
                </div>
                <textarea
                    value={localSettings.whatsappTemplate || ''}
                    onChange={handleTemplateChange}
                    className="w-full h-40 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-apple-500 outline-none text-sm leading-relaxed"
                    placeholder="Olá! Segue o orçamento para {produto}..."
                />

                <div className="mt-6 border-t border-gray-100 pt-4">
                     <p className="text-sm font-medium text-gray-700 mb-3">
                        Personalizar textos automáticos (para trocas):
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input 
                            label="Rótulo 'Troca'" 
                            value={localSettings.whatsappTradeInLabel || 'Troca'}
                            onChange={(e) => handleTextChange('whatsappTradeInLabel', e.target.value)}
                         />
                         <Input 
                            label="Rótulo 'Valor Avaliado'" 
                            value={localSettings.whatsappTradeInValueLabel || 'Valor Avaliado'}
                            onChange={(e) => handleTextChange('whatsappTradeInValueLabel', e.target.value)}
                         />
                         <div className="md:col-span-2">
                             <Input 
                                label="Rótulo 'Total a Pagar'" 
                                value={localSettings.whatsappTotalLabel || 'Total a pagar'}
                                onChange={(e) => handleTextChange('whatsappTotalLabel', e.target.value)}
                             />
                         </div>
                     </div>
                </div>
            </div>
          </div>

          {/* Section: Installments */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-4">Taxas de Parcelamento (%)</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
               <div className="grid grid-cols-3 gap-3">
                  {localSettings.installmentRules.map((rule, index) => (
                    <div key={rule.installments} className="bg-gray-50 p-2 rounded-xl border border-gray-100 flex flex-col items-center">
                       <span className="text-xs font-bold text-gray-500 mb-1">{rule.installments}x</span>
                       <input
                          type="number"
                          step="0.01"
                          className="w-full text-center bg-transparent border-none focus:ring-0 font-semibold text-gray-900 p-0"
                          value={rule.rate}
                          onChange={(e) => handleInstallmentChange(index, e.target.value)}
                        />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="sticky bottom-24 z-10 mx-auto max-w-sm">
             {showSaved && (
                <div className="absolute -top-12 left-0 right-0 text-center">
                   <span className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-full shadow-lg animate-fade-in">Salvo com sucesso!</span>
                </div>
             )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
            >
              <Save className="w-5 h-5" />
              Salvar Configurações
            </button>
          </div>
        </form>
    </div>
  );
};