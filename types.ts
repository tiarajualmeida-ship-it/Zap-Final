export enum TaskPriority {
  LOW = '0', // Bitrix uses '0' for low/normal
  NORMAL = '1',
  HIGH = '2'
}

export interface TaskDraft {
  id: string;
  title: string;
  description: string;
  deadline?: string; // ISO string
  priority: TaskPriority;
  responsibleName?: string;
  originalTextSnippet?: string;
}

export interface BitrixConfig {
  webhookUrl: string; // e.g., https://b24-xxxx.bitrix24.com/rest/1/key/
  defaultResponsibleId: string;
}

export type ExtractionStatus = 'idle' | 'analyzing' | 'success' | 'error';
