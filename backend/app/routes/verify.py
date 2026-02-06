from fastapi import APIRouter
from app.core.gemini_client import call_gemini
from app.models.schemas import VerifyRequest
import json
import os
from pathlib import Path
from vector_store import VectorStore

router = APIRouter()

# --- 1. ABSOLUTE PATH FIX (GPS) ---
# Get the folder where THIS file (verify.py) lives: backend/app/routes
CURRENT_FILE = Path(__file__).resolve()
# Go up 2 levels to 'backend'
BACKEND_DIR = CURRENT_FILE.parent.parent.parent
# Now point to data/vector_store.json
DB_PATH = BACKEND_DIR / "data" / "vector_store.json"

print(f"📍 Debug: I am looking for the DB here: {DB_PATH}")

if DB_PATH.exists():
    print("✅ Database FOUND! RAG System Active.")
    db = VectorStore(storage_file=str(DB_PATH))
else:
    print("❌ Database NOT FOUND at that path. RAG Disabled.")
    db = None
# ---------------------------------


@router.post("/verify")
def verify(req: VerifyRequest):
    print(f"\n📨 Received spec: {req.spec[:30]}...")

    # 2. RAG SEARCH
    retrieved_rules_text = "No official standards found."
    sources_list = []

    if db:
        print("🔍 Searching database...")
        results = db.search(req.spec, top_k=3)
        if results:
            # Format for Gemini
            retrieved_rules_text = "\n".join(
                [f"- {r['text']} [SOURCE: {r['metadata']['source']}]" for r in results])
            # Format for Frontend (Clean list)
            sources_list = [
                f"{r['metadata']['source']}: {r['text'][:100]}..." for r in results]
            print(f"📚 RAG Context:\n{retrieved_rules_text}")

    # 3. THE PROMPT (Universal Version)
    prompt = f"""
    You are TruthForge, a Universal Verification & Fact-Checking Engine.
    Your goal is to verify claims across ANY domain (Law, Engineering, Medical, Finance, etc.).
    
    === INPUT DATA ===
    CLAIM / QUERY: {req.spec}
    PROPOSED ANSWER: {req.answer}
    USER CONSTRAINTS: {req.rules}

    === KNOWLEDGE BASE (RAG) ===
    {retrieved_rules_text}

    === INSTRUCTIONS ===
    1. Identify the domain of the request (e.g., is this Legal? Engineering? Medical?).
    2. Compare the ANSWER against the KNOWLEDGE BASE and CONSTRAINTS.
    3. If the answer is hallucinating, factually wrong, or dangerous, the Falsifier must reject it.
    4. If the answer violates a specific code (GDPR, ISO, HIPAA), the Compliance agent must cite it.
    5. Assign a CONFIDENCE SCORE (0-100).

    === OUTPUT FORMAT (JSON ONLY) ===
    {{
        "agents": [
            {{ "name": "Falsifier", "status": "danger", "log": "Explanation of risks..." }},
            {{ "name": "Compliance", "status": "warning/success", "log": "Citing [SOURCE]..." }}
        ],
        "final_verdict": "PASS or FAIL",
        "confidence_score": 95,
        "summary": "Brief summary including the detected domain."
    }}
    """

    # 4. Call Gemini
    raw_response = call_gemini(prompt)

    # 5. Parse & Merge RAG Data
    clean_json = raw_response.replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(clean_json)
        # Inject the sources so the frontend can see them
        data["rag_sources"] = sources_list
        return data
    except:
        return {
            "agents": [{"name": "System", "status": "danger", "log": "JSON Error"}],
            "final_verdict": "ERROR",
            "confidence_score": 0,
            "summary": raw_response,
            "rag_sources": []
        }
# ... (keep existing code above)


class FixRequest(VerifyRequest):
    pass


@router.post("/fix")
def fix_solution(req: FixRequest):
    print("🔧 Generative Fix Requested...")

    # 1. RAG Search (We need the rules to know HOW to fix it)
    retrieved_rules = ""
    if db:
        results = db.search(req.spec, top_k=2)
        if results:
            retrieved_rules = "\n".join(
                [f"- {r['text']} [SOURCE: {r['metadata']['source']}]" for r in results])

    # 2. The Prompt
    prompt = f"""
    You are a Senior Compliance Engineer. The user's proposed solution FAILED verification.
    Your job is to rewrite the solution so it becomes COMPLIANT.

    === CONTEXT ===
    QUERY: {req.spec}
    FAILED ANSWER: {req.answer}
    OFFICIAL RULES: {retrieved_rules}

    === INSTRUCTIONS ===
    1. Write a new, corrected solution that satisfies the QUERY and the OFFICIAL RULES.
    2. Explicitly mention which standard you are adhering to.
    3. Keep it professional and direct.

    === OUTPUT FORMAT ===
    Return only the corrected text. Do not use JSON.
    """

    # 3. Call Gemini
    fixed_text = call_gemini(prompt)
    return {"fixed_solution": fixed_text}
