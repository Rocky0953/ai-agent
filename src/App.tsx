import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Send, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles, 
  Activity, 
  Award,
  PlusCircle,
  MessageSquare,
  Key
} from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  role: string;
  department: string;
  personality: string;
  specialty: string[];
  tasksCompleted: number;
  status: 'idle' | 'working' | 'collaborating' | 'break';
  colorTheme: string;
}

const INITIAL_WORKERS: Worker[] = [
  {
    id: 'worker-pm',
    name: 'Sophia Chen',
    role: 'Lead Project Manager',
    department: 'Management',
    personality: 'Hyper-organized sprint architect.',
    specialty: ['Task Decomposition', 'Sprint Planning', 'QA Reviews'],
    tasksCompleted: 24,
    status: 'idle',
    colorTheme: 'purple'
  },
  {
    id: 'worker-frontend',
    name: 'Leo Thorne',
    role: 'Frontend UI/UX Architect',
    department: 'Engineering',
    personality: 'Pixel perfectionist focusing on design tokens.',
    specialty: ['React', 'Tailwind', 'Motion UI'],
    tasksCompleted: 42,
    status: 'idle',
    colorTheme: 'cyan'
  },
  {
    id: 'worker-backend',
    name: 'Elena Rostova',
    role: 'Staff Distributed Systems Engineer',
    department: 'Engineering',
    personality: 'High-throughput concurrency expert.',
    specialty: ['Node.js', 'APIs', 'High Availability'],
    tasksCompleted: 38,
    status: 'idle',
    colorTheme: 'emerald'
  },
  {
    id: 'worker-qa',
    name: 'Marcus Vance',
    role: 'Principal QA & Security Auditor',
    department: 'QA & Ops',
    personality: 'Zero-tolerance bug hunter.',
    specialty: ['Type Checks', 'Fuzzing', 'Vulnerability Audits'],
    tasksCompleted: 31,
    status: 'idle',
    colorTheme: 'amber'
  }
];

export default function App() {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([
    'Pixel AI Office ready.',
    'Cluster load-balancing active across worker pool.'
  ]);
  const [activeTab, setActiveTab] = useState<'office' | 'tasks' | 'telemetry'>('office');
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/office/key-pool-status');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {
      // Offline fallback
    }
  };

  const handleSendDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    const userTask = prompt;
    setPrompt('');
    
    setStatusLog(prev => [`[OWNER DIRECTIVE] ${userTask}`, ...prev]);

    // Set manager to working
    setWorkers(prev => prev.map(w => w.id === 'worker-pm' ? { ...w, status: 'working' } : w));

    try {
      const planRes = await fetch('/api/office/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPrompt: userTask,
          workerList: workers
        })
      });

      const planData = await planRes.json();
      setStatusLog(prev => [
        `[MANAGER]: ${planData.announcementMessage || 'Directive planned. Assigning subtasks...'}`,
        ...prev
      ]);

      // Trigger workers
      setWorkers(prev => prev.map(w => ({ ...w, status: 'working', tasksCompleted: w.tasksCompleted + 1 })));

      setTimeout(() => {
        setWorkers(prev => prev.map(w => ({ ...w, status: 'idle' })));
        setStatusLog(prev => [
          `[QA AUDIT]: Deliverables verified and approved. Sprint complete!`,
          ...prev
        ]);
        setIsProcessing(false);
        fetchTelemetry();
      }, 3000);

    } catch (err: any) {
      setStatusLog(prev => [`[ERROR]: ${err.message || 'Task failed.'}`, ...prev]);
      setWorkers(prev => prev.map(w => ({ ...w, status: 'idle' })));
      setIsProcessing(false);
    }
  };

  return (
    <div id="pixel-office-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header id="app-header" className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Pixel AI Office
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Live</span>
            </h1>
            <p className="text-xs text-slate-400">Multi-Agent Autonomous Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="tab-btn-office"
            onClick={() => setActiveTab('office')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'office' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Office Floor
          </button>
          <button
            id="tab-btn-telemetry"
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'telemetry' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Cluster Telemetry
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="app-main" className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Office Floor & Employees */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Owner Command Bar */}
          <div id="command-bar-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Owner Directive
            </h2>
            <form onSubmit={handleSendDirective} className="flex gap-2">
              <input
                id="owner-prompt-input"
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Build an analytics pipeline for authentication events..."
                disabled={isProcessing}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                id="send-directive-btn"
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Dispatching...' : 'Dispatch'}
              </button>
            </form>
          </div>

          {/* Workers Grid */}
          <div id="workers-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers.map(worker => (
              <div
                key={worker.id}
                id={`worker-card-${worker.id}`}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-100">{worker.name}</h3>
                    <p className="text-xs text-indigo-400 font-mono">{worker.role}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider ${
                      worker.status === 'working'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {worker.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{worker.personality}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {worker.specialty.map((spec, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {worker.tasksCompleted} tasks
                  </span>
                  <span>{worker.department}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Office Terminal Logs */}
        <div className="space-y-6">
          <div id="office-terminal-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Office Stream
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div id="terminal-logs-list" className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs max-h-[460px]">
              {statusLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border ${
                    log.startsWith('[OWNER')
                      ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-200'
                      : log.startsWith('[MANAGER')
                      ? 'bg-purple-950/40 border-purple-800/40 text-purple-200'
                      : log.startsWith('[QA')
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
                      : log.startsWith('[ERROR')
                      ? 'bg-red-950/40 border-red-800/40 text-red-300'
                      : 'bg-slate-950/50 border-slate-800/60 text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
