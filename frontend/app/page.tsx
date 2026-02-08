"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';

// --- INTERFACES ---
interface AgentLog {
  name: string;
  status: "danger" | "success" | "warning";
  log: string;
}

interface VerificationResult {
  agents: AgentLog[];
  final_verdict: string;
  confidence_score: number;
  summary: string;
  rag_sources: string[];
}

export default function Home() {
  // --- STATE ---
  const [spec, setSpec] = useState("");
  const [answer, setAnswer] = useState("");
  const [rules, setRules] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixedSolution, setFixedSolution] = useState("");
  const [showDetails, setShowDetails] = useState(true); // Toggle for "Clumsy Rules"
  const [showHowItWorks, setShowHowItWorks] = useState(false); // Toggle for Modal
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // --- CONFIG ---
  // REPLACE THIS WITH YOUR HUGGING FACE URL IF DIFFERENT
  const API_URL = "https://rxp017-truthforge-backend.hf.space"; 

  // --- THEME HANDLER ---
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // --- API FUNCTIONS ---
  async function submit() {
    if (!spec || !answer) {
      alert("Please enter the Query and the AI's Answer.");
      return;
    }
    setLoading(true);
    setResult(null);
    setFixedSolution("");
    setShowDetails(true);
    
    try {
      const res = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, answer, rules }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Error: Backend is sleeping or unreachable.");
    }
    setLoading(false);
  }

  async function generateFix() {
    setFixing(true);
    try {
      const res = await fetch(`${API_URL}/api/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, answer, rules }),
      });
      const data = await res.json();
      setFixedSolution(data.fixed_solution);
      setShowDetails(false); // HIDE clumsy rules after fixing
    } catch (err) {
      alert("Could not generate fix.");
    }
    setFixing(false);
  }

  const getFriendlyName = (rawName: string) => {
    if (rawName.includes("Falsifier")) return "Risk Detector";
    if (rawName.includes("Compliance")) return "Rule Checker";
    if (rawName.includes("Verdict")) return "Final Judge";
    return rawName;
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1a1917] text-[#ede8dc]' : 'bg-[#fdfbf7] text-[#2d2a26]'}`}>
      
      {/* GLOBAL STYLES & FONTS (Imported via simple Style tag for simplicity in Next.js) */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap');
        
        body { font-family: 'Space Grotesk', sans-serif; }
        
        .gold-gradient { background: linear-gradient(135deg, #d4af37 0%, #c5a059 100%); }
        .gold-text {
            background: linear-gradient(to right, #8c6b30, #c5a059, #8c6b30);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .glass-panel {
            background: ${theme === 'dark' ? 'rgba(30, 29, 27, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
            backdrop-filter: blur(12px);
            border: 1px solid ${theme === 'dark' ? 'rgba(197, 160, 89, 0.2)' : 'rgba(197, 160, 89, 0.3)'};
        }
        /* Markdown Code Styles */
        /* OLD LINE (DELETE THIS): */
/* pre { background: #1e1e1e; padding: 15px; border-radius: 8px; overflow-x: auto; color: #d4d4d4; } */

/* NEW LINE (PASTE THIS): */
pre { 
    background: ${theme === 'dark' ? '#1e1e1e' : '#f4f4f5'}; 
    color: ${theme === 'dark' ? '#d4d4d4' : '#1f2937'};
    padding: 15px; 
    border-radius: 8px; 
    overflow-x: auto; 
    border: 1px solid ${theme === 'dark' ? 'transparent' : '#e5e7eb'};
}
        code { font-family: monospace; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b border-[#d6cfc2]/20 backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#c5a059] text-3xl">verified_user</span>
          <h1 className="text-xl font-bold tracking-tight">TruthForge</h1>
        </div>

        <div className="flex items-center gap-4">
           {/* HOW IT WORKS BUTTON */}
           <button 
            onClick={() => setShowHowItWorks(true)}
            className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-[#c5a059] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">help</span>
            How it Works
          </button>

          {/* THEME TOGGLE */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[#c5a059]/10 transition-colors"
          >
            <span className="material-symbols-outlined">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/20 mb-8">
            <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5a059] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c5a059]"></span>
            </span>
            <span className="text-xs font-semibold text-[#8c6b30] uppercase tracking-wider dark:text-[#d4af37]">Protocol v2.0 Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-6">
            Universal AI <br />
            <span className="gold-text">Truth & Compliance</span>
        </h1>

        <p className="text-center text-lg text-gray-500 dark:text-gray-400 max-w-xl mb-12">
            Ensure the integrity of your generative AI. Verify claims against real-world standards (HIPAA, ISO, GDPR) instantly.
        </p>

        {/* --- INPUT CARD --- */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass-panel rounded-2xl p-8 shadow-xl"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div>
                    <label className="block text-sm font-bold mb-2 text-[#8c6b30] dark:text-[#d4af37]">1. What did you ask the AI?</label>
                    <textarea 
                        value={spec} 
                        onChange={(e) => setSpec(e.target.value)} 
                        placeholder="e.g. Write code for a login page..." 
                        className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-[#c5a059] focus:border-transparent outline-none transition-all resize-none h-32 ${theme === 'dark' ? 'bg-[#2a2926] border-[#444] text-white' : 'bg-white border-[#e0e0e0]'}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-[#8c6b30] dark:text-[#d4af37]">2. What answer did it give?</label>
                    <textarea 
                        value={answer} 
                        onChange={(e) => setAnswer(e.target.value)} 
                        placeholder="e.g. It gave me this python code..." 
                        className={`w-full p-4 rounded-xl border focus:ring-2 focus:ring-[#c5a059] focus:border-transparent outline-none transition-all resize-none h-32 ${theme === 'dark' ? 'bg-[#2a2926] border-[#444] text-white' : 'bg-white border-[#e0e0e0]'}`}
                    />
                </div>
            </div>

            {/* Rules (Optional / Collapsible) */}
            <div className="mb-8">
                <label className="block text-sm font-bold mb-2 text-gray-400">3. Extra Rules (Optional)</label>
                <input 
                    value={rules} 
                    onChange={(e) => setRules(e.target.value)} 
                    placeholder="e.g. Must be HIPAA compliant..." 
                    className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-[#c5a059] outline-none ${theme === 'dark' ? 'bg-[#2a2926] border-[#444]' : 'bg-white border-[#e0e0e0]'}`} 
                />
            </div>

            <button 
                onClick={submit}
                disabled={loading}
                className="w-full py-4 rounded-xl gold-gradient text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                    <span className="material-symbols-outlined">check_circle</span>
                )}
                {loading ? "VERIFYING..." : "VERIFY ANSWER"}
            </button>
        </motion.div>

        {/* --- RESULTS SECTION --- */}
        <AnimatePresence>
            {result && (
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-12"
                >
                    {/* VERDICT CARD */}
                    <div className={`p-1 rounded-2xl ${result.final_verdict === 'FAIL' ? 'bg-red-500' : 'bg-green-500'}`}>
                        <div className={`rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${theme === 'dark' ? 'bg-[#1a1917]' : 'bg-white'}`}>
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`material-symbols-outlined text-4xl ${result.final_verdict === 'FAIL' ? 'text-red-500' : 'text-green-500'}`}>
                                        {result.final_verdict === 'FAIL' ? 'gpp_bad' : 'verified'}
                                    </span>
                                    <h2 className={`text-3xl font-bold ${result.final_verdict === 'FAIL' ? 'text-red-500' : 'text-green-600'}`}>
                                        {result.final_verdict === 'FAIL' ? 'UNSAFE ANSWER' : 'SAFE TO USE'}
                                    </h2>
                                </div>
                                <p className="opacity-80 leading-relaxed">{result.summary}</p>
                            </div>

                            <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-[#2a2926] min-w-[140px]">
                                <div className="text-xs uppercase tracking-widest opacity-60 font-bold">Confidence</div>
                                <div className="text-4xl font-black my-1 text-gray-900 dark:text-white">{result.confidence_score}%</div>
                            </div>
                        </div>
                    </div>

                    {/* --- MAGIC FIXER (Only on Fail) --- */}
                    {!result.final_verdict.includes("PASS") && (
                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#c5a059]">auto_fix_high</span>
                                    Magic Fixer
                                </h3>
                                {!fixedSolution && (
                                    <button 
                                        onClick={generateFix}
                                        disabled={fixing}
                                        className="px-6 py-2 rounded-lg bg-[#c5a059] text-white font-bold hover:bg-[#b08d4b] transition-colors shadow-md disabled:opacity-50"
                                    >
                                        {fixing ? "FIXING..." : "FIX MISTAKE"}
                                    </button>
                                )}
                            </div>

                            {/* THE FIXED SOLUTION BOX */}
                            <AnimatePresence>
                                {fixedSolution && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`rounded-xl border border-[#c5a059]/40 p-6 shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-[#252422]' : 'bg-[#fffdf5]'}`}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-[#c5a059]"></div>
                                        <div className="flex items-center gap-2 mb-4 text-[#c5a059]">
                                            <span className="material-symbols-outlined">check_circle</span>
                                            <span className="font-bold uppercase tracking-wider text-sm">Corrected Solution</span>
                                        </div>
                                        
                                        {/* MARKDOWN RENDERER FOR CODE */}
                                        <div className="prose dark:prose-invert max-w-none">
                                            <ReactMarkdown>{fixedSolution}</ReactMarkdown>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(fixedSolution)}
                                                className="text-xs font-bold text-gray-500 hover:text-[#c5a059] flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">content_copy</span>
                                                COPY CODE
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* --- DETAILS SECTION (Toggleable) --- */}
                    {/* If we fixed it, we hide this by default. User can toggle it back. */}
                    <div className="mt-10 border-t border-gray-200 dark:border-gray-800 pt-6">
                        <button 
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#c5a059] transition-colors mx-auto"
                        >
                            <span>{showDetails ? "HIDE ANALYSIS DETAILS" : "VIEW ANALYSIS DETAILS"}</span>
                            <span className={`material-symbols-outlined transition-transform ${showDetails ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>

                        <AnimatePresence>
                            {showDetails && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                                        {/* AGENTS */}
                                        <div className="lg:col-span-2 space-y-4">
                                            <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4">Agent Investigation</h4>
                                            {result.agents.map((agent, i) => (
                                                <div key={i} className={`p-4 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-[#2a2926]' : 'bg-white'} shadow-sm ${agent.status === 'danger' ? 'border-red-500' : agent.status === 'success' ? 'border-green-500' : 'border-yellow-500'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold text-sm">{getFriendlyName(agent.name)}</span>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${agent.status === 'danger' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{agent.status.toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-sm opacity-80">{agent.log}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* SOURCES */}
                                        <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-[#2a2926]' : 'bg-gray-100'}`}>
                                            <h4 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">library_books</span>
                                                Knowledge Graph
                                            </h4>
                                            {result.rag_sources.length > 0 ? (
                                                <ul className="space-y-3 text-xs opacity-70">
                                                    {result.rag_sources.map((s, i) => (
                                                        <li key={i} className="leading-relaxed border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs opacity-50">No specific database rules matched.</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* --- HOW IT WORKS MODAL --- */}
      <AnimatePresence>
        {showHowItWorks && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setShowHowItWorks(false)}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className={`max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#1e1d1b]' : 'bg-white'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">⚙️ How TruthForge Works</h2>
                            <button onClick={() => setShowHowItWorks(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-[#333] bg-[#252422]' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="text-4xl mb-4">🧠</div>
                                <h3 className="font-bold mb-2">1. Multi-Agent AI</h3>
                                <p className="text-sm opacity-70">We don't just ask one AI. We spawn three: a Risk Detector, a Rule Checker, and a Final Judge to debate the answer.</p>
                            </div>
                            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-[#333] bg-[#252422]' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="text-4xl mb-4">📚</div>
                                <h3 className="font-bold mb-2">2. RAG Verification</h3>
                                <p className="text-sm opacity-70">Most AIs guess. We verify facts against a real database of ISO, HIPAA, and GDPR standards using Retrieval Augmented Generation.</p>
                            </div>
                            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'border-[#333] bg-[#252422]' : 'border-gray-100 bg-gray-50'}`}>
                                <div className="text-4xl mb-4">✨</div>
                                <h3 className="font-bold mb-2">3. Auto-Remediation</h3>
                                <p className="text-sm opacity-70">If the answer is unsafe, our specialized "Fixer" agent rewrites the code or text to be 100% compliant instantly.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}