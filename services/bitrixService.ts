import { BitrixConfig, TaskDraft } from "../types";

// Helper to sanitize the webhook URL
const normalizeUrl = (url: string) => {
  if (!url) return '';
  let cleanUrl = url.trim();
  if (!cleanUrl.endsWith('/')) {
    cleanUrl += '/';
  }
  return cleanUrl;
};

export const createBitrixTask = async (task: TaskDraft, config: BitrixConfig): Promise<boolean> => {
  if (!config.webhookUrl) {
    throw new Error("URL do Webhook do Bitrix não configurada.");
  }

  const endpoint = `${normalizeUrl(config.webhookUrl)}tasks.task.add`;

  // Format date for Bitrix (ISO 8601 preferred). 
  // If we have just YYYY-MM-DD, append T18:00:00 to set end of business day.
  let formattedDeadline = null;
  if (task.deadline) {
    if (task.deadline.includes('T')) {
      formattedDeadline = task.deadline;
    } else {
      formattedDeadline = `${task.deadline}T18:00:00`;
    }
  }

  // Bitrix API fields
  // TITLE: Task Name
  // DESCRIPTION: Task Description
  // DEADLINE: ISO Date
  // PRIORITY: 0 (Low), 1 (Average), 2 (High)
  // RESPONSIBLE_ID: User ID in Bitrix
  
  const payload: any = {
    fields: {
      TITLE: task.title,
      DESCRIPTION: `${task.description}\n\n--\nGerado via ZapTrix\nTrecho original: "${task.originalTextSnippet || 'N/A'}"`,
      PRIORITY: task.priority,
      RESPONSIBLE_ID: config.defaultResponsibleId || 1 // Default to admin usually ID 1
    }
  };

  if (formattedDeadline) {
    payload.fields.DEADLINE = formattedDeadline;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("Bitrix API Error:", data.error_description);
      throw new Error(data.error_description || "Erro desconhecido do Bitrix");
    }

    return true;
  } catch (error) {
    console.error("Network or Logic Error creating task:", error);
    throw error;
  }
};