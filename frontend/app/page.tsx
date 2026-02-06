"use client";
import { useState } from "react";

export default function Home() {
  const [spec, setSpec] = useState("");
  const [answer, setAnswer] = useState("");
  const [rules, setRules] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResult("Asking Gemini...");
    
    try {
      const res = await fetch("http://localhost:8000/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec, answer, rules }),
      });
      
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setResult("Error connecting to server.");
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: "50px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1>TruthForge (Gemini 3)</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <label><strong>Engineering Spec:</strong></label>
        <textarea 
          rows={3} 
          value={spec} 
          onChange={(e) => setSpec(e.target.value)} 
          placeholder="e.g., Design a steel bridge with 50m span..."
          style={{ padding: "10px" }}
        />

        <label><strong>AI Answer to Verify:</strong></label>
        <textarea 
          rows={3} 
          value={answer} 
          onChange={(e) => setAnswer(e.target.value)} 
          placeholder="e.g., Use aluminum alloy 6061..."
          style={{ padding: "10px" }}
        />

        <label><strong>Rules / Standards:</strong></label>
        <textarea 
          rows={2} 
          value={rules} 
          onChange={(e) => setRules(e.target.value)} 
          placeholder="e.g., Must follow ISO 10025 standards..."
          style={{ padding: "10px" }}
        />
      </div>

      <button 
        onClick={submit} 
        disabled={loading}
        style={{ 
          padding: "15px", 
          backgroundColor: loading ? "#ccc" : "#0070f3", 
          color: "white", 
          border: "none", 
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold"
        }}
      >
        {loading ? "Verifying..." : "Verify with TruthForge"}
      </button>

      {result && (
        <div style={{ marginTop: "30px", padding: "20px", background: "#f5f5f5", borderRadius: "5px" }}>
          <h3>Verdict:</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
        </div>
      )}
    </div>
  );
}