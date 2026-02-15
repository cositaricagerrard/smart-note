
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Mic, Image as ImageIcon, Edit3, MoreHorizontal, X, Zap, Filter, 
  Settings, CheckSquare, Layout, FileText, Calendar as CalendarIcon, Share2, 
  BarChart2, User, Home, ArrowRight, LogIn, Sparkles, Bold, Italic, Underline, List, Paperclip, ChevronLeft
} from 'lucide-react';
import { Note, Task, View, NoteType } from './types';
import { CATEGORIES } from './constants';
import { summarizeNote, extractTasks, suggestCategories, performOCR } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'login' | 'main'>('splash');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Splash logic
    const timer = setTimeout(() => setAppState('login'), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const mockNotes: Note[] = [
      {
        id: '1',
        title: 'أفكار لمشروع التخرج',
        content: 'تطبيق ذكي يعتمد على الذكاء الاصطناعي لتنظيم المهام والملاحظات بشكل آلي.',
        type: 'text',
        tags: ['دراسة', 'تقنية'],
        category: 'دراسة',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        summary: 'فكرة تطبيق تنظيم مهام بالذكاء الاصطناعي.',
        tasks: [{ id: 't1', title: 'البحث عن نماذج مشابهة', completed: false, status: 'todo' }]
      }
    ];
    setNotes(mockNotes);
    setTasks(mockNotes.flatMap(n => n.tasks || []));
  }, []);

  const handleLogin = () => setAppState('main');

  const handleCreateNote = async (type: NoteType = 'text') => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      type,
      tags: [],
      category: 'أفكار',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSelectedNote(newNote);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (note: Note) => {
    setIsProcessing(true);
    try {
      const summary = await summarizeNote(note.content);
      const extracted = await extractTasks(note.content);
      const suggestions = await suggestCategories(note.title, note.content);
      
      const updatedNote: Note = {
        ...note,
        summary,
        category: suggestions.category || note.category,
        tags: [...new Set([...note.tags, ...suggestions.tags])],
        tasks: extracted.map(t => ({
          id: Math.random().toString(36).substr(2, 5),
          title: t.title || '',
          completed: false,
          dueDate: t.dueDate,
          noteId: note.id,
          status: 'todo'
        })),
        updatedAt: Date.now()
      };

      setNotes(prev => {
        const index = prev.findIndex(n => n.id === note.id);
        if (index >= 0) {
          const newNotes = [...prev];
          newNotes[index] = updatedNote;
          return newNotes;
        }
        return [updatedNote, ...prev];
      });
      if (updatedNote.tasks) setTasks(prev => [...prev, ...updatedNote.tasks!]);
      setIsEditorOpen(false);
      setSelectedNote(null);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  if (appState === 'splash') return <SplashScreen />;
  if (appState === 'login') return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0F172A] text-slate-100">
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SmartNote</h1>
        </div>
        <button className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <User className="text-slate-400" size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-32 pt-2 no-scrollbar">
        {currentView === 'dashboard' && <Dashboard notes={notes} tasks={tasks} onCreate={handleCreateNote} setView={setCurrentView} />}
        {currentView === 'all' && <NotesList notes={notes} onNoteClick={(n) => { setSelectedNote(n); setIsEditorOpen(true); }} />}
        {currentView === 'tasks' && <TasksKanban tasks={tasks} />}
        {currentView === 'mindmap' && <MindMap notes={notes} />}
        {currentView === 'stats' && <StatsView />}
      </main>

      <button onClick={() => handleCreateNote()} className="fixed bottom-24 left-6 w-14 h-14 gradient-brand rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center text-white active:scale-90 transition-all z-30">
        <Plus size={28} />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 h-20 glass border-t border-white/10 px-6 flex items-center justify-between z-40">
        <NavButton active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<Home size={22} />} label="الرئيسية" />
        <NavButton active={currentView === 'all'} onClick={() => setCurrentView('all')} icon={<FileText size={22} />} label="ملاحظات" />
        <NavButton active={currentView === 'tasks'} onClick={() => setCurrentView('tasks')} icon={<CheckSquare size={22} />} label="مهام" />
        <NavButton active={currentView === 'mindmap'} onClick={() => setCurrentView('mindmap')} icon={<Share2 size={22} />} label="خريطة" />
        <NavButton active={currentView === 'stats'} onClick={() => setCurrentView('stats')} icon={<BarChart2 size={22} />} label="أداء" />
      </nav>

      {isEditorOpen && <NoteEditor note={selectedNote!} onClose={() => setIsEditorOpen(false)} onSave={handleSaveNote} isProcessing={isProcessing} />}
    </div>
  );
};

// --- Screen Components ---

const SplashScreen = () => (
  <div className="h-screen w-full gradient-brand flex flex-col items-center justify-center p-10 text-center">
    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-6 animate-float shadow-2xl">
      <Zap className="text-white" size={48} />
    </div>
    <h1 className="text-4xl font-black text-white mb-2">SmartNote Pro</h1>
    <p className="text-white/60 text-lg">Organize Your Mind Smartly</p>
  </div>
);

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="h-screen w-full bg-[#0F172A] p-8 flex flex-col justify-center animate-scale">
    <div className="mb-12">
      <h2 className="text-3xl font-black mb-3">أهلاً بك مجدداً</h2>
      <p className="text-slate-500">سجل دخولك لتبدأ تنظيم أفكارك</p>
    </div>
    <div className="space-y-4 mb-8">
      <input type="email" placeholder="البريد الإلكتروني" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/40 outline-none" />
      <input type="password" placeholder="كلمة المرور" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/40 outline-none" />
      <button onClick={onLogin} className="w-full h-14 gradient-brand rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2">
        <LogIn size={20} /> دخول
      </button>
    </div>
    <div className="flex items-center gap-4 mb-8">
      <div className="flex-1 h-px bg-white/10"></div>
      <span className="text-xs text-slate-500">أو عبر</span>
      <div className="flex-1 h-px bg-white/10"></div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <button onClick={onLogin} className="h-14 rounded-2xl glass font-bold text-xs flex items-center justify-center gap-2">Google</button>
      <button onClick={onLogin} className="h-14 rounded-2xl glass font-bold text-xs flex items-center justify-center gap-2">Apple</button>
    </div>
  </div>
);

const Dashboard: React.FC<{ notes: Note[], tasks: Task[], onCreate: () => void, setView: (v: View) => void }> = ({ notes, tasks, onCreate, setView }) => (
  <div className="animate-scale">
    <div onClick={onCreate} className="glass p-6 rounded-[32px] mb-8 border-dashed border-2 border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/[0.05]">
      <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white"><Edit3 size={24} /></div>
      <div>
        <h4 className="font-bold">اكتب فكرة الآن...</h4>
        <p className="text-xs text-slate-500">اضغط للبدء بتدوين ملاحظة سريعة</p>
      </div>
    </div>

    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black">مهام اليوم</h3>
        <button onClick={() => setView('tasks')} className="text-blue-400 text-xs font-bold flex items-center gap-1">عرض الكل <ArrowRight size={14} /></button>
      </div>
      <div className="space-y-3">
        {tasks.slice(0, 3).map(task => (
          <div key={task.id} className="glass p-4 rounded-2xl flex items-center gap-3">
            <div className="w-5 h-5 rounded border border-white/20"></div>
            <span className="text-sm font-medium">{task.title}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black">ملاحظات حديثة</h3>
        <button onClick={() => setView('all')} className="text-blue-400 text-xs font-bold flex items-center gap-1">عرض الكل <ArrowRight size={14} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {notes.slice(0, 4).map(note => (
          <div key={note.id} className="glass p-4 rounded-2xl aspect-square flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3"><FileText size={16} className="text-blue-400" /></div>
              <h4 className="text-sm font-bold line-clamp-2">{note.title}</h4>
            </div>
            <span className="text-[10px] text-slate-500">{new Date(note.updatedAt).toLocaleDateString('ar-EG')}</span>
          </div>
        ))}
      </div>
    </section>

    <section className="glass p-5 rounded-[32px] border-blue-500/20 bg-blue-500/[0.02]">
      <div className="flex items-center gap-2 mb-2 text-blue-400">
        <Sparkles size={16} />
        <span className="text-xs font-bold">ذكاء اصطناعي</span>
      </div>
      <p className="text-sm text-slate-300">لديك 3 مهام مؤجلة منذ الأسبوع الماضي، هل تريد جدولتها غداً؟</p>
    </section>
  </div>
);

const NotesList: React.FC<{ notes: Note[], onNoteClick: (n: Note) => void }> = ({ notes, onNoteClick }) => (
  <div className="animate-scale">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-black">كل الملاحظات</h2>
      <button className="p-2 glass rounded-xl"><Filter size={18} /></button>
    </div>
    <div className="space-y-4">
      {notes.map(note => (
        <div key={note.id} onClick={() => onNoteClick(note)} className="glass p-5 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center"><FileText size={24} className="text-slate-400" /></div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold truncate">{note.title || 'بدون عنوان'}</h4>
            <p className="text-xs text-slate-500 truncate">{note.content}</p>
          </div>
          <ChevronLeft size={18} className="text-slate-600" />
        </div>
      ))}
    </div>
  </div>
);

const TasksKanban: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <div className="animate-scale h-full">
    <h2 className="text-2xl font-black mb-6">المهام (Kanban)</h2>
    <div className="flex gap-4 overflow-x-auto no-scrollbar h-full pb-10">
      {['To Do', 'In Progress', 'Done'].map(col => (
        <div key={col} className="w-72 flex-shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="font-bold text-slate-400 text-sm">{col}</h4>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full">0</span>
          </div>
          <div className="flex-1 glass rounded-3xl p-3 border-dashed border-2 border-white/5">
            {tasks.length === 0 && <div className="py-20 text-center text-slate-600 text-xs italic">لا توجد مهام</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const NoteEditor: React.FC<{ note: Note, onClose: () => void, onSave: (n: Note) => void, isProcessing: boolean }> = ({ note, onClose, onSave, isProcessing }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col">
      <div className="px-6 py-4 flex items-center justify-between glass border-b border-white/10">
        <button onClick={onClose} className="p-2 glass rounded-xl"><X size={20} /></button>
        <button onClick={() => onSave({...note, title, content})} disabled={isProcessing} className="px-6 py-2 gradient-brand rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">
          {isProcessing ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الملاحظة" className="w-full text-4xl font-black bg-transparent border-none outline-none mb-6 placeholder:text-white/5" />
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="ابدأ بالكتابة..." className="w-full h-full bg-transparent border-none outline-none resize-none text-lg leading-relaxed placeholder:text-white/5" />
      </div>
      <div className="p-4 glass border-t border-white/10 flex items-center justify-between px-8 bg-[#0F172A]">
        <div className="flex gap-4 text-slate-400">
          <Bold size={20} /><Italic size={20} /><Underline size={20} /><List size={20} /><Paperclip size={20} />
        </div>
        <div className="flex gap-4">
          <button className="p-2 rounded-xl text-blue-400 bg-blue-500/10"><Sparkles size={22} /></button>
          <button className="p-2 rounded-xl text-slate-400"><Mic size={22} /></button>
          <button className="p-2 rounded-xl text-slate-400"><ImageIcon size={22} /></button>
        </div>
      </div>
    </div>
  );
};

const MindMap: React.FC<{ notes: Note[] }> = ({ notes }) => (
  <div className="h-[70vh] glass rounded-[40px] flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
    <div className="absolute inset-0 bg-blue-500/5 blur-[100px]"></div>
    <div className="w-24 h-24 rounded-full gradient-brand flex items-center justify-center mb-6 animate-float"><Share2 size={40} className="text-white" /></div>
    <h3 className="text-xl font-bold mb-2">خريطة الأفكار</h3>
    <p className="text-sm text-slate-500">نقوم الآن بالربط بين {notes.length} ملاحظة لبناء سياق متكامل لأفكارك...</p>
  </div>
);

const StatsView = () => (
  <div className="animate-scale">
    <h2 className="text-2xl font-black mb-6">الإنتاجية</h2>
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="glass p-5 rounded-3xl"><span className="text-[10px] text-slate-500 font-bold uppercase">الملاحظات</span><div className="text-2xl font-black text-blue-400 mt-1">42</div></div>
      <div className="glass p-5 rounded-3xl"><span className="text-[10px] text-slate-500 font-bold uppercase">المهام المنجزة</span><div className="text-2xl font-black text-green-400 mt-1">18</div></div>
    </div>
    <div className="glass p-6 rounded-[32px] h-48 flex items-end justify-around gap-2">
      {[30, 60, 45, 90, 70, 50, 80].map((h, i) => (
        <div key={i} className="w-full bg-blue-500/10 rounded-t-lg relative overflow-hidden">
          <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg" style={{ height: `${h}%` }}></div>
        </div>
      ))}
    </div>
  </div>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-400' : 'text-slate-500'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-500/10' : ''}`}>{icon}</div>
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
