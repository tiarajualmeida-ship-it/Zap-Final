import { TaskDraft, TaskPriority } from "../types";

export interface MediaPart {
  mimeType: string;
  data: string; // Base64 string
}

const getApiKey = (): string => {
  try {
    const savedConfig = localStorage.getItem('zapToBitrixConfig');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.geminiApiKey) return parsed.geminiApiKey;
    }
  } catch (e) {
    console.error("Erro ao ler configuração", e);
  }
  return "";
};

export const analyzeChatLog = async (text: string, mediaFiles: MediaPart[] = []): Promise<TaskDraft[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("⚠️ API Key não encontrada! Clique na engrenagem ⚙️ e configure.");
  }

  // URL direta da API (Funciona sempre, sem depender de biblioteca)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  // Monta as partes da mensagem
  const parts: any[] = [];
  
  if (text && text.trim()) {
    parts.push({
      text: `Analise o texto/imagem abaixo (WhatsApp). Extraia tarefas para o Bitrix24.
      Hoje é: ${new Date().toISOString().split('T')[0]}.
      
      IMPORTANTE: Responda APENAS um JSON válido (sem markdown, sem crases \`\`\`).
      Formato do JSON:
      [
        {
          "title": "Título curto",
          "description": "Descrição detalhada",
          "deadline": "AAAA-MM-DD" (ou null),
          "priority": "0", "1" ou "2" (2 é Alta),
          "responsibleName": "Nome ou null"
        }
      ]

      Texto da conversa:
      """
      ${text}
      """`
    });
  }

  mediaFiles.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: "application/json" // Força o Gemini a devolver JSON
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API do Google");
    }

    const data = await response.json();
    
    // Extrai o texto da resposta
    const jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonString) throw new Error("A IA não retornou nenhuma tarefa.");

    // Limpa se vier com blocos de código (ex: ```json ... ```)
    const cleanJson = jsonString.replace(/```json|```/g, '').trim();
    
    const rawTasks = JSON.parse(cleanJson);

    return rawTasks.map((t: any) => ({
      ...t,
      id: crypto.randomUUID(),
      priority: t.priority as TaskPriority || "0"
    }));

  } catch (error: any) {
    console.error("Erro no fetch:", error);
    throw new Error("Falha ao processar: " + error.message);
  }
};
