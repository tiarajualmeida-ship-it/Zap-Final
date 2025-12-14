import React, { useState, useEffect } from 'react';
import { X, Save, Key, Globe, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [responsibleId, setResponsibleId] = useState('1');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Carrega as configurações salvas quando a janela abre
  useEffect(() => {
    const savedConfig = localStorage.getItem('zapToBitrixConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setWebhookUrl(parsed.webhookUrl || '');
        setResponsibleId(parsed.defaultResponsibleId || '1');
        // Carrega a chave se ela existir
        setGeminiApiKey(parsed.geminiApiKey || '');
      } catch (e) {
        console.error("Erro ao carregar configurações", e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    // Salva tudo no navegador
    const config = {
      webhookUrl,
      defaultResponsibleId: responsibleId,
      geminiApiKey
    };
    localStorage.setItem('zapToBitrixConfig', JSON.stringify(config));
    
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Configurações do App</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-5">
          {/* Campo da API Key do Gemini */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Key className="w-4 h-4 text-purple-600" />
              Google Gemini API Key
            </label>
            <input 
              type="password" 
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Cole sua chave AIza... aqui"
            />
            <p className="text-xs text-gray-500 mt-1">Necessário para a inteligência funcionar.</p>
          </div>

          <div className="h-px bg-gray-200 my-2"></div>

          {/* Campo do Webhook Bitrix */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Webhook de Entrada (Bitrix24)
            </label>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="https://b24-xxxx.bitrix24.com.br/rest/..."
            />
          </div>

          {/* Campo do ID Responsável */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              ID do Responsável Padrão
            </label>
            <input 
              type="number" 
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 outline-none"
              placeholder="Ex: 1"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Save size={20} /> Salvar Tudo
        </button>
      </div>
    </div>
  );
}
