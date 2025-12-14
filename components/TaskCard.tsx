import React from 'react';
import { Trash2, Calendar, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { TaskDraft, TaskPriority } from '../types';

interface TaskCardProps {
  task: TaskDraft;
  onUpdate: (id: string, updates: Partial<TaskDraft>) => void;
  onRemove: (id: string) => void;
  onSendToBitrix: (task: TaskDraft) => void;
  isSending: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onRemove, onSendToBitrix, isSending }) => {
  
  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
      case TaskPriority.LOW: return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityLabel = (p: TaskPriority) => {
     switch (p) {
      case TaskPriority.HIGH: return 'Alta';
      case TaskPriority.LOW: return 'Baixa';
      default: return 'Normal';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <input 
          className="flex-1 font-semibold text-gray-800 text-lg bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors"
          value={task.title}
          onChange={(e) => onUpdate(task.id, { title: e.target.value })}
          placeholder="Título da Tarefa"
        />
        <button 
          onClick={() => onRemove(task.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Remover Tarefa"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Description */}
      <textarea 
        className="w-full text-sm text-gray-600 bg-gray-50 rounded-md p-2 border border-transparent focus:bg-white focus:border-blue-300 focus:outline-none resize-none"
        rows={3}
        value={task.description}
        onChange={(e) => onUpdate(task.id, { description: e.target.value })}
        placeholder="Descrição da tarefa..."
      />

      {/* Metadata Controls */}
      <div className="flex flex-wrap gap-3 items-center mt-2">
        
        {/* Date Picker */}
        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-md border border-gray-200">
          <Calendar size={14} className="text-gray-500" />
          <input 
            type="date" 
            className="bg-transparent text-xs text-gray-700 focus:outline-none"
            value={task.deadline || ''}
            onChange={(e) => onUpdate(task.id, { deadline: e.target.value })}
          />
        </div>

        {/* Priority Select */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border ${getPriorityColor(task.priority)}`}>
          <AlertTriangle size={14} className="currentColor" />
          <select 
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            value={task.priority}
            onChange={(e) => onUpdate(task.id, { priority: e.target.value as TaskPriority })}
          >
            <option value={TaskPriority.LOW}>Baixa</option>
            <option value={TaskPriority.NORMAL}>Normal</option>
            <option value={TaskPriority.HIGH}>Alta</option>
          </select>
        </div>

        {/* Responsible (Read only hint) */}
        {task.responsibleName && (
           <div className="text-xs text-gray-500 italic ml-auto">
             Resp: {task.responsibleName}
           </div>
        )}
      </div>

      <div className="mt-2 pt-3 border-t border-gray-100 flex justify-end">
        <button 
          onClick={() => onSendToBitrix(task)}
          disabled={isSending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isSending 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm active:scale-95'
            }`}
        >
          {isSending ? (
            <>Enviando...</>
          ) : (
            <>
              <CheckCircle size={16} />
              Criar no Bitrix24
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskCard;