
import React from 'react';
import { 
  FileText, 
  Folder, 
  CheckSquare, 
  Calendar, 
  Share2, 
  Settings, 
  Mic, 
  Image as ImageIcon, 
  Plus, 
  Search,
  Lock,
  Zap,
  Layout,
  BarChart2
} from 'lucide-react';

export const COLORS = {
  primary: '#a855f7',
  secondary: '#6366f1',
  background: '#0f0f12',
  surface: '#1a1a20',
  text: '#e0e0e0',
};

export const NAVIGATION = [
  { id: 'all', name: 'كل الملاحظات', icon: <FileText size={20} /> },
  { id: 'folders', name: 'المجلدات', icon: <Folder size={20} /> },
  { id: 'tasks', name: 'المهام', icon: <CheckSquare size={20} /> },
  { id: 'calendar', name: 'التقويم', icon: <Calendar size={20} /> },
  { id: 'mindmap', name: 'الخريطة الذهنية', icon: <Share2 size={20} /> },
  { id: 'stats', name: 'الإنتاجية', icon: <BarChart2 size={20} /> },
];

export const CATEGORIES = [
  { id: 'work', name: 'العمل', color: '#6366f1', icon: '💼' },
  { id: 'personal', name: 'شخصي', color: '#a855f7', icon: '👤' },
  { id: 'study', name: 'دراسة', color: '#10b981', icon: '📚' },
  { id: 'ideas', name: 'أفكار', color: '#f59e0b', icon: '💡' },
];
