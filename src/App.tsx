import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Send, 
  Terminal, 
  Sparkles, 
  Activity, 
  Award,
  Volume2,
  VolumeX,
  Layers,
  Cpu
} from 'lucide-react';
import { WorkerCharacter, ProjectPlan, OfficeTelemetry } from './types';
import { DEFAULT_WORKERS } from './data/defaultWorkers';
import PixelOfficeCanvas from './components/PixelOfficeCanvas';
import { audioSynth } from './utils/audioSynth';

export default function App() {
  const [workers, setWorkers] = useState<WorkerCharacter[]>(DEFAULT_WORKERS);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ProjectPlan | null>(null);
  const [statusLog, setStatusLog] = useState<string[]>([
    'Pixel AI Office ready and initialized.',
    'Cluster load-balancer active with VIP routing enabled.'
  ]);
  const [activeTab, setActiveTab] = useState<'office' | 'pipeline' | 'telemetry'>('office');
  const [telemetry, setTelemetry] = useState<OfficeTelemetry | null>(null);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
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

  const toggleSound = () => {
    audioSynth.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSendDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    audioSynth.playBoop();
    setIsProcessing(true);
    const userPrompt = prompt;
    setPrompt('');

    setStatusLog(prev => [`[DIRECTIVE]: "${userPrompt}"`, ...prev]);

    // Manager starts planning
    setWorkers(prev => prev.map(w => w.id === 'worker-pm' ? { ...w, status: 'working' } : w));

    try {
      const planRes = await fetch('/api/office/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerPrompt: userPrompt,
          workerList: workers
        })
      });

      const planData = await planRes.json();
      setCurrentPlan(planData);
      setStatusLog(prev => [`[MANAGER]: ${planData.announcementMessage || 'Directive decomposed. Assigning tasks...'}`, ...prev]);

      // Trigger all workers into working state
      setWorkers(prev => prev.map(w => ({ ...w, status: 'working' })));

      setTimeout(() => {
        setWorkers(prev => prev.map(w => ({
          ...w,
          status: 'idle',
          tasksCompleted: w.tasksCompleted + 1
        })));

        audioSynth.playSuccess();
        setStatusLog(prev => [
          `[QA REVIEW]: All deliverables verified and passed! Sprint complete.`,
          ...prev
        ]);
        setIsProcessing(false);
        fetchTelemetry();
      }, 4000);

    } catch (err: any) {
      setStatusLog(prev => [`[ERROR]: ${err?.message || 'Execution failed.'}`, ...prev]);
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
              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active Cluster</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">Autonomous Retro Multi-Agent Floor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="Toggle Retro Sounds"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => setActiveTab('office')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'office' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Office Floor
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
              activeTab === 'telemetry' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Telemetry
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="app-main" className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Pixel Canvas & Workers */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Retro Pixel Art Canvas */}
          <PixelOfficeCanvas workers={workers} isProjectRunning={isProcessing} />

          {/* Owner Directive Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Owner Directive
            </h2>
            <form onSubmit={handleSendDirective} className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Build an analytics pipeline for user engagement metrics..."
                disabled={isProcessing}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                {isProcessing ? 'Simulating...' : 'Dispatch'}
              </button>
            </form>
          </div>

          {/* Workers Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workers.map(worker => (
              <div
                key={worker.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {worker.name}
                      {worker.isTopPerformer && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">VIP</span>
                      )}
                    </h3>
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
                    {worker.tasksCompleted} completed
                  </span>
                  <span>{worker.department}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Stream & Telemetry */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Office Stream
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs max-h-[500px]">
              {statusLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border ${
                    log.startsWith('[DIRECTIVE')
                      ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-200'
                      : log.startsWith('[MANAGER')
                      ? 'bg-purple-950/40 border-purple-800/40 text-purple-200'
                      : log.startsWith('[QA')
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-200'
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
