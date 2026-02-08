"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [spec, setSpec] = useState("");
  const [answer, setAnswer] = useState("");
  const [rules, setRules] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixedSolution, setFixedSolution] = useState("");

  // YOUR BACKEND LINK
  const API_URL = "https://rxp017-truthforge-backend.hf.space"; 

  // Helper to make Agent Names friendly
  const getFriendlyName = (rawName: string) => {
    if (rawName.includes("Falsifier")) return "Risk Detector ⚠️";
    if (rawName.includes("Compliance")) return "Rule Checker 📜";
    if (rawName.includes("Verdict")) return "Final Judge ⚖️";
    return rawName;
  };

  async function submit() {
    if (!spec || !answer) {
      alert("Please fill in what you asked and what the AI said.");
      return;
    }
    setLoading(true);
    setResult(null);
    setFixedSolution("");
    
    try {
      const res = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, answer, rules }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("I couldn't reach the brain. Is the backend running?");
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
    } catch (err) {
      alert("Could not fix it automatically.");
    }
    setFixing(false);
  }

  function downloadReport() {
    if (!result) return;
    const text = `TRUTHFORGE REPORT\nVerdict: ${result.final_verdict}\nSummary: ${result.summary}\n\nAGENTS:\n${result.agents.map(a => `${a.name}: ${a.log}`).join('\n')}\n\nSOURCES:\n${result.rag_sources.join('\n')}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TruthForge_Report.txt";
    a.click();
  }

  return (
    <div style={{ padding: "40px 20px", fontFamily: "'Inter', sans-serif", maxWidth: "1200px", margin: "0 auto", background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", minHeight: "100vh", color: "#333" }}>
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8 }}
        style={{ textAlign: "center", marginBottom: "40px" }}
      >
        <h1 style={{ color: "#0f172a", fontSize: "2.5rem", margin: "0 0 10px 0", fontWeight: "800", letterSpacing: "-1px" }}>🛡️ TruthForge</h1>
        <p style={{ color: "#64748b", fontSize: "1.1rem" }}>Did AI lie to you? Let's double check.</p>
      </motion.div>
      
      {/* INPUTS - SIMPLE ENGLISH */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)", color: "#000", border: "1px solid white" }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "25px" }}>
          
          {/* INPUT 1 */}
          <div style={{ flex: "1 1 100%" }}>
            <label style={labelStyle}>1. What did you ask the AI?</label>
            <textarea rows={2} value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="e.g., I asked ChatGPT to write code for a secure login page..." style={inputStyle} />
          </div>
          
          {/* INPUT 2 */}
          <div style={{ flex: "1 1 300px" }}>
            <label style={labelStyle}>2. What answer did it give you?</label>
            <textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="e.g., It gave me this python code..." style={inputStyle} />
          </div>
          
          {/* INPUT 3 */}
          <div style={{ flex: "1 1 300px" }}>
            <label style={labelStyle}>3. Any extra rules? (Optional)</label>
            <textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="e.g., It must be HIPAA compliant..." style={inputStyle} />
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={submit} 
          disabled={loading} 
          style={{ 
            marginTop: "30px", width: "100%", padding: "18px", 
            background: loading ? "#94a3b8" : "linear-gradient(to right, #2563eb, #3b82f6)", 
            color: "white", border: "none", borderRadius: "12px", 
            cursor: loading ? "not-allowed" : "pointer", 
            fontSize: "16px", fontWeight: "bold", 
            boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.3)"
        }}>
          {loading ? "⚡ DOUBLE CHECKING..." : "VERIFY THIS ANSWER 🚀"}
        </motion.button>
      </motion.div>

      {/* RESULTS */}
      <AnimatePresence>
      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: "40px" }}
        >
          {/* Verdict Box */}
          <div style={{ 
            display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px",
            padding: "30px", borderRadius: "16px", marginBottom: "30px",
            background: result.final_verdict.includes("PASS") ? "#dcfce7" : "#fee2e2", 
            border: `2px solid ${result.final_verdict.includes("PASS") ? "#22c55e" : "#ef4444"}`,
            color: "#000",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
          }}>
            <div style={{ flex: "1 1 300px" }}>
              <h2 style={{ margin: 0, color: result.final_verdict.includes("PASS") ? "#166534" : "#991b1b", fontSize: "2.5rem", fontWeight: "800" }}>
                {result.final_verdict === "FAIL" ? "❌ UNSAFE ANSWER" : "✅ SAFE TO USE"}
              </h2>
              <p style={{ margin: "10px 0 0 0", color: "#333", lineHeight: "1.6", fontSize: "1.1rem" }}>{result.summary}</p>
            </div>
            
            <div style={{ textAlign: "center", minWidth: "150px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>CONFIDENCE</div>
              <div style={{ fontSize: "3rem", fontWeight: "900", color: "#333" }}>{result.confidence_score}%</div>
              <motion.button whileHover={{ scale: 1.05 }} onClick={downloadReport} style={{ marginTop: "10px", padding: "8px 16px", fontSize: "12px", background: "white", border: "1px solid #ccc", borderRadius: "20px", cursor: "pointer", color: "black", fontWeight: "600" }}>📥 Save PDF</motion.button>
            </div>
          </div>

          {/* AUTO-FIX SECTION */}
          {!result.final_verdict.includes("PASS") && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              style={{ marginBottom: "30px", padding: "25px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "16px", color: "black" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                <h3 style={{ margin: 0, color: "#9a3412" }}>✨ Magic Fixer</h3>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={generateFix} disabled={fixing} style={{ padding: "12px 24px", background: "#ea580c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(234, 88, 12, 0.3)" }}>
                  {fixing ? "Fixing it for you..." : "Correct the AI's Mistake"}
                </motion.button>
              </div>
              <AnimatePresence>
              {fixedSolution && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "20px", background: "white", border: "1px solid #fed7aa", borderRadius: "8px", fontSize: "1rem", lineHeight: "1.7", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                  <strong style={{ color: "#ea580c" }}>✅ Here is the Correct Answer:</strong><br/>
                  {fixedSolution}
                </motion.div>
              )}
              </AnimatePresence>
            </motion.div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "25px" }}>
            <div style={{ flex: "2 1 400px", display: "grid", gap: "15px" }}>
              <h3 style={{ margin: "0", color: "#1e293b" }}>Why is it unsafe?</h3>
              {result.agents.map((agent, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ background: "white", padding: "25px", borderRadius: "12px", borderLeft: `6px solid ${agent.status === 'danger' ? '#ef4444' : agent.status === 'success' ? '#22c55e' : '#eab308'}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", color: "black" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ fontWeight: "800", textTransform: "uppercase", fontSize: "0.95rem", color: "#64748b" }}>{getFriendlyName(agent.name)}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: agent.status === 'danger' ? '#ef4444' : '#22c55e' }}>{agent.status.toUpperCase()}</span>
                  </div>
                  <p style={{ margin: 0, lineHeight: "1.6" }}>{agent.log}</p>
                </motion.div>
              ))}
            </div>
            <div style={{ flex: "1 1 300px", background: "#1e293b", padding: "30px", borderRadius: "16px", color: "white", height: "fit-content", boxShadow: "0 10px 25px -5px rgba(30, 41, 59, 0.5)" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", borderBottom: "1px solid #475569", paddingBottom: "15px" }}>📚 Rules Checked</h3>
              {result.rag_sources.length > 0 ? (
                <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.9rem", color: "#cbd5e1", lineHeight: "1.8" }}>
                  {result.rag_sources.map((source, i) => <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + (i * 0.1) }} key={i} style={{ marginBottom: "15px" }}>{source}</motion.li>)}
                </ul>
              ) : <p style={{ color: "#94a3b8" }}>No specific rule violations found.</p>}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* --- HOW IT WORKS (SIMPLE ENGLISH) --- */}
      <motion.div 
        initial={{ opacity: 0 }} 
        whileInView={{ opacity: 1 }} 
        viewport={{ once: true }}
        style={{ marginTop: "80px", padding: "40px", background: "white", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
      >
        <h2 style={{ textAlign: "center", color: "#1e293b", marginBottom: "30px", fontSize: "2rem" }}>⚙️ How it Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
          
          <div style={cardStyle}>
            <div style={iconStyle}>🧠</div>
            <h3 style={titleStyle}>1. Three Smart Bots</h3>
            
            <p style={textStyle}>We don't just ask one AI. We create three: one to find risks, one to check laws, and one to make the final decision.</p>
          </div>

          <div style={cardStyle}>
            <div style={iconStyle}>📚</div>
            <h3 style={titleStyle}>2. Real Fact Checking</h3>
            <p style={textStyle}>Most AIs guess. TruthForge actually looks up real laws (like HIPAA or ISO standards) from a database to verify your plan.</p>
          </div>

          <div style={cardStyle}>
            <div style={iconStyle}>✨</div>
            <h3 style={titleStyle}>3. It Fixes Mistakes</h3>
            <p style={textStyle}>If your plan has a problem, you don't have to guess how to fix it. Our "Magic Auto-Fixer" rewrites it for you instantly.</p>
          </div>

        </div>
      </motion.div>

      {/* FOOTER */}
      <div style={{ textAlign: "center", marginTop: "50px", color: "#64748b", fontSize: "0.9rem" }}>
        Built with ❤️ using Google Gemini 3
      </div>

    </div>
  );
}

// STYLES
const cardStyle = { padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" };
const iconStyle = { fontSize: "2rem", marginBottom: "15px" };
const titleStyle = { margin: "0 0 10px 0", color: "#0f172a", fontSize: "1.2rem" };
const textStyle = { margin: 0, color: "#475569", lineHeight: "1.6" };

const inputStyle = { width: "100%", padding: "15px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "15px", fontFamily: "inherit", color: "black", background: "#f8fafc", resize: "vertical" as const, outline: "none", transition: "border 0.2s" };
const labelStyle = { fontWeight: "700", display: "block", marginBottom: "10px", color: "#334155", fontSize: "0.95rem" };