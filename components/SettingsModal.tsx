import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, HelpCircle } from 'lucide-react';
import { BitrixConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BitrixConfig;
  onSave: (config: BitrixConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<BitrixConfig>(config);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Configuração Bitrix24</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook de Entrada (Inbound Webhook)
            </label>
            <input
              type="text"
              value={localConfig.webhookUrl}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://b24-xxxx.bitrix24.com/rest/1/xxxx/"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
            />
            
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 space-y-2">
              <p className="font-semibold flex items-center gap-1">
                <HelpCircle size={12} /> Como obter esta URL:
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>No seu Bitrix24, vá para o menu lateral esquerdo e procure por <b>Developers (Desenvolvedores)</b>.</li>
                <li>Selecione <b>Other (Outros)</b> &rarr; <b>Inbound Webhook (Webhook de entrada)</b>.</li>
                <li>Em permissões de acesso, selecione <b>Tarefas (tasks)</b>.</li>
                <li>Clique em salvar e copie a URL gerada (ex: <i>.../rest/1/token/</i>).</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID do Responsável Padrão
            </label>
            <input
              type="text"
              value={localConfig.defaultResponsibleId}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, defaultResponsibleId: e.target.value }))}
              placeholder="ex: 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              O ID numérico do usuário no Bitrix (1 geralmente é o administrador).
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Esses dados são salvos apenas no LocalStorage do seu navegador. Nenhuma informação é enviada para nossos servidores.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSave(localConfig);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save size={16} />
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;