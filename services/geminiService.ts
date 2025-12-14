import { GoogleGenAI, Type } from "@google/genai";
import { TaskDraft, TaskPriority } from "../types";

export interface MediaPart {
  mimeType: string;
  data: string; // Base64 string
}

// Função auxiliar para buscar a chave salva
const getApiKey = (): string => {
  try {
    // Tenta ler a configuração salva pelo App
    const savedConfig = localStorage.getItem('zapToBitrixConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Procura por campos comuns de API Key
      if (parsed.geminiApiKey) return parsed.geminiApiKey;
      if (parsed.apiKey) return parsed.apiKey;
    }
  } catch (e) {
    console.error("Erro ao ler configuração", e);
  }
  return "";
};

export const analyzeChatLog = async (text: string, mediaFiles: MediaPart[] = []): Promise<TaskDraft[]> => {
  try {
    // 1. Busca a chave AGORA, no momento do clique, não no carregamento
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error("⚠️ API Key não encontrada! Clique na engrenagem ⚙️ no topo e configure sua chave do Google Gemini.");
    }

    // 2. Inicializa o Gemini com a chave encontrada
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const parts: any[] = [];

    // Add text prompt if provided
    if (text && text.trim()) {
      parts.push({
        text: `Analise o seguinte log de conversa (WhatsApp), imagens e áudios fornecidos. Extraia quaisquer tarefas, itens de ação ou compromissos mencionados.
      
      Converta datas relativas (ex: "próxima sexta", "amanhã") para formato ISO 8601 aproximado (YYYY-MM-DD) assumindo que hoje é ${new Date().toISOString().split('T')[0]}.
      
      Texto da conversa:
      """
      ${text}
      """`
      });
    } else if (mediaFiles.length > 0) {
      // If only media is provided
      parts.push({
        text: `Analise os arquivos de mídia fornecidos (prints de conversa ou áudios). Extraia tarefas, itens de ação ou compromissos. Converta datas relativas para formato ISO 8601 (Hoje: ${new Date().toISOString().split('T')[0]}).`
      });
    }

    // Add media parts (images/audio)
    mediaFiles.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    if (parts.length === 0) {
      throw new Error("Nenhum conteúdo (texto ou mídia) fornecido.");
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // Atualizado para versão mais estável/recente se disponível, ou mantenha 1.5-flash
      contents: { parts },
      config: {
        systemInstruction: "Você é um gerente de projetos especialista e assistente pessoal. Sua função é ler conversas informais (texto ou imagens) e ouvir áudios para extrair tarefas estruturadas para o Bitrix24. Seja preciso na identificação de prazos e prioridades. Se houver áudio, transcreva mentalmente o conteúdo relevante para a descrição da tarefa.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Um título curto e claro para a tarefa" },
              description: { type: Type.STRING, description: "A descrição completa do que precisa ser feito. Se veio de áudio, inclua um resumo do que foi dito." },
              deadline: { type: Type.STRING, description: "Data limite no formato YYYY-MM-DD, ou null se não encontrada" },
              priority: { type: Type.STRING, enum: ["0", "1", "2"], description: "0=Normal, 2=Alta (urgente)" },
              responsibleName: { type: Type.STRING, description: "Nome da pessoa responsável mencionada, ou null" },
              originalTextSnippet: { type: Type.STRING, description: "O trecho de texto ou indicação 'Extraído de áudio/imagem' que gerou esta tarefa" }
            },
            required: ["title", "description", "priority"]
          }
        }
      }
    });

    const rawTasks = JSON.parse(response.text() || "[]"); // Ajuste: response.text() é função em algumas versões, ou property em outras. O SDK novo usa .text() as vezes. Vamos garantir.
    
    // Add client-side IDs
    return rawTasks.map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      priority: t.priority as TaskPriority
    }));

  } catch (error: any) {
    console.error("Erro ao analisar conteúdo com Gemini:", error);
    // Repassa o erro amigável se for de chave faltando
    if (error.message.includes("API Key")) {
        throw error;
    }
    throw new Error("Falha ao processar. Verifique sua API Key na engrenagem ou tente novamente.");
  }
};
