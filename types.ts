
export type NoteType = 'text' | 'voice' | 'image' | 'drawing';

export interface Note {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  category: string;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  tasks?: Task[];
  attachments?: string[];
  imageUrl?: string;
  audioUrl?: string;
  isLocked?: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  noteId?: string;
  status: 'todo' | 'in-progress' | 'done';
}

export type View = 'dashboard' | 'all' | 'tasks' | 'calendar' | 'mindmap' | 'stats' | 'settings';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}
