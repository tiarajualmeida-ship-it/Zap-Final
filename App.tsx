import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Settings, 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Loader2,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  X,
  FileAudio,
  Clipboard
} from 'lucide-react';
import { TaskDraft, BitrixConfig, ExtractionStatus } from './types';
import { analyzeChatLog, MediaPart } from './services/geminiService';
import { createBitrixTask } from './services/bitrixService';
import TaskCard from './components/TaskCard';
import SettingsModal from './components/SettingsModal';

const DEFAULT_CONFIG: BitrixConfig = {
  webhookUrl: '',
  defaultResponsibleId: '1'
};

const App: React.FC = () => {
  // State
  const [inputText, setInputText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bitrixConfig, setBitrixConfig] = useState<BitrixConfig>(DEFAULT_CONFIG);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  // Load config and saved tasks from local storage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('zapTrixConfig');
    if (savedConfig) {
      try {
        setBitrixConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config");
      }
    }

    const savedTasks = localStorage.getItem('zapTrixTasks');
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) setTasks(parsed);
      } catch (e) {
        console.error("Failed to parse saved tasks");
      }
    }
  }, []);

  // Persist tasks whenever they change
  useEffect(() => {
    localStorage.setItem('zapTrixTasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleSaveConfig = (newConfig: BitrixConfig) => {
    setBitrixConfig(newConfig);
    localStorage.setItem('zapTrixConfig', JSON.stringify(newConfig));
    setFeedback({ type: 'success', msg: 'Configurações salvas!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<MediaPart> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:image/png;base64," prefix
        const base64Data = result.split(',')[1];
        resolve({
          mimeType: file.type,
          data: base64Data
        });
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && mediaFiles.length === 0) return;
    
    setStatus('analyzing');
    setTasks([]); 
    setFeedback(null);

    try {
      // Process media files
      const processedMedia: MediaPart[] = await Promise.all(mediaFiles.map(fileToBase64));

      const extractedTasks = await analyzeChatLog(inputText, processedMedia);
      setTasks(extractedTasks);
      setStatus('success');
      
      if (extractedTasks.length === 0) {
        setFeedback({ type: 'error', msg: 'Nenhuma tarefa identificada no conteúdo.' });
      } else {
        // Optional: Clear inputs on success
        // setInputText('');
        // setMediaFiles([]);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setFeedback({ type: 'error', msg: 'Erro ao processar. Verifique se os arquivos são válidos.' });
    }
  };

  const handleTaskUpdate = (id: string, updates: Partial<TaskDraft>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleTaskRemove = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSendToBitrix = async (task: TaskDraft) => {
    if (!bitrixConfig.webhookUrl) {
      setIsSettingsOpen(true);
      setFeedback({ type: 'error', msg: 'Configure o Webhook do Bitrix antes de enviar.' });
      return;
    }

    setSendingIds(prev => new Set(prev).add(task.id));
    
    try {
      await createBitrixTask(task, bitrixConfig);
      setFeedback({ type: 'success', msg: `Tarefa "${task.title}" criada com sucesso!` });
      handleTaskRemove(task.id);
    } catch (error) {
      setFeedback({ type: 'error', msg: `Erro ao enviar "${task.title}". Verifique o console.` });
    } finally {
      setSendingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newFiles: File[] = [];
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          newFiles.push(blob);
          hasImage = true;
        }
      }
    }

    if (newFiles.length > 0) {
      // Prevent the binary string from being pasted into textarea if it's an image
      e.preventDefault();
      setMediaFiles(prev => [...prev, ...newFiles]);
      setFeedback({ type: 'success', msg: 'Imagem colada da área de transferência!' });
      setTimeout(() => setFeedback(null), 3000);
    }
    
    // Note: If it's just text, we let default behavior happen (text appears in textarea)
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isAnalyzing = status === 'analyzing';
  const hasContent = inputText.trim().length > 0 || mediaFiles.length > 0;

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50/50">
      
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <MessageSquare size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800">
              Zap<span className="text-blue-600">Trix</span>
            </span>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-full transition-all flex items-center gap-2
              ${!bitrixConfig.webhookUrl 
                ? 'bg-amber-100 text-amber-700 px-3 hover:bg-amber-200 animate-pulse' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
            title="Configurações Bitrix24"
          >
            {!bitrixConfig.webhookUrl && <span className="text-xs font-bold">Configurar Bitrix</span>}
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Configuration Warning Banner */}
      {!bitrixConfig.webhookUrl && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm text-amber-800">
            <AlertTriangle size={16} />
            <span>
              Para criar tarefas reais, você precisa configurar o Webhook do Bitrix24. 
              <button onClick={() => setIsSettingsOpen(true)} className="underline font-semibold ml-1 hover:text-amber-900">
                Clique aqui para configurar.
              </button>
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex-1 flex flex-col h-auto min-h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <UploadCloud className="text-blue-500" size={20} />
                Entrada de Dados
              </h2>
              
              <div className="flex gap-2">
                 <label className="cursor-pointer text-xs font-medium text-gray-600 hover:text-blue-600 flex items-center gap-1 bg-gray-100 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Carregar Log de Texto (.txt)">
                    <UploadCloud size={14} />
                    .txt
                    <input type="file" accept=".txt" className="hidden" onChange={handleTxtUpload} />
                  </label>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 mb-2">
               <label className="cursor-pointer flex-1 flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600">
                 <ImageIcon size={20} />
                 <span className="text-xs font-medium">Adicionar Print</span>
                 <input type="file" accept="image/png, image/jpeg, image/webp" multiple className="hidden" onChange={handleMediaUpload} />
               </label>
               <label className="cursor-pointer flex-1 flex flex-col items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-500 hover:text-blue-600">
                 <Mic size={20} />
                 <span className="text-xs font-medium">Adicionar Áudio</span>
                 <input type="file" accept="audio/*" multiple className="hidden" onChange={handleMediaUpload} />
               </label>
               <div className="hidden sm:flex flex-col items-center justify-center gap-1 p-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-400">
                  <Clipboard size={16} />
                  <span className="text-[10px] font-medium text-center leading-tight">Ctrl+V<br/>suportado</span>
               </div>
            </div>

            {/* Media Previews */}
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-100">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="relative group flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-gray-200 shadow-sm max-w-[200px]">
                    {file.type.startsWith('image/') ? <ImageIcon size={14} className="text-purple-500 shrink-0"/> : <FileAudio size={14} className="text-orange-500 shrink-0"/>}
                    <span className="text-xs truncate text-gray-600">{file.name}</span>
                    <button 
                      onClick={() => removeMedia(idx)}
                      className="ml-auto text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm text-gray-700 leading-relaxed font-mono min-h-[200px]"
              placeholder="Cole a conversa do WhatsApp aqui...&#10;Dica: Você pode colar imagens (Ctrl+V) diretamente nesta área."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !hasContent}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white shadow-lg transition-all transform active:scale-95
                  ${isAnalyzing || !hasContent
                    ? 'bg-gray-400 cursor-not-allowed transform-none' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'}`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando Mídia...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Extrair Tarefas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col gap-4 h-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 flex-1 flex flex-col relative overflow-hidden min-h-[500px]">
            
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-blue-100 rounded text-blue-600 flex items-center justify-center">
                <span className="font-bold text-xs">B24</span>
              </div>
              Tarefas Identificadas
              <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
                {tasks.length} {tasks.length === 1 ? 'item' : 'itens'}
              </span>
            </h2>

            {/* Empty State */}
            {tasks.length === 0 && status !== 'analyzing' && (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                  <ArrowRight size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">Aguardando conteúdo</p>
                <p className="text-xs max-w-xs mt-1 text-gray-400">
                  Envie texto, áudio ou imagens. A IA irá processar tudo para encontrar tarefas.
                </p>
              </div>
            )}

            {/* Loading Skeleton */}
            {status === 'analyzing' && tasks.length === 0 && (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-gray-200 rounded-xl"></div>
                <div className="h-32 bg-gray-200 rounded-xl"></div>
              </div>
            )}

            {/* Task List */}
            <div className="space-y-4 overflow-y-auto flex-1 pb-20 pr-1 -mr-2 max-h-[calc(100vh-250px)]">
              {tasks.map(task => (
                <div key={task.id} className="mr-2">
                  <TaskCard
                    task={task}
                    onUpdate={handleTaskUpdate}
                    onRemove={handleTaskRemove}
                    onSendToBitrix={handleSendToBitrix}
                    isSending={sendingIds.has(task.id)}
                  />
                </div>
              ))}
            </div>

            {/* Feedback Toast */}
            {feedback && (
              <div className={`absolute bottom-4 left-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 z-50
                ${feedback.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
                {feedback.type === 'success' ? <CheckCircle2 size={20} /> : <AlertOctagon size={20} />}
                {feedback.msg}
              </div>
            )}
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={bitrixConfig}
        onSave={handleSaveConfig}
      />
    </div>
  );
};

export default App;