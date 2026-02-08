from fastapi import APIRouter
from app.core.gemini_client import call_gemini
from app.models.schemas import VerifyRequest
import json
import os
from pathlib import Path
from vector_store import VectorStore

router = APIRouter()

# --- PATH SETUP ---
CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent.parent
DB_PATH = BACKEND_DIR / "data" / "vector_store.json"

if DB_PATH.exists():
    db = VectorStore(storage_file=str(DB_PATH))
else:
    db = None


@router.post("/verify")
def verify(req: VerifyRequest):
    print(f"\n📨 Received spec: {req.spec[:30]}...")

    # RAG SEARCH
    retrieved_rules_text = "No official standards found."
    sources_list = []

    if db:
        print("🔍 Searching database...")
        results = db.search(req.spec, top_k=3)
        if results:
            retrieved_rules_text = "\n".join(
                [f"- {r['text']} [SOURCE: {r['metadata']['source']}]" for r in results])
            sources_list = [
                f"{r['metadata']['source']}: {r['text'][:100]}..." for r in results]

    # VERIFICATION PROMPT
    prompt = f"""
    You are TruthForge, a Universal Verification Engine.
    
    === INPUT DATA ===
    QUERY: {req.spec}
    PROPOSED ANSWER: {req.answer}
    USER CONSTRAINTS: {req.rules}

    === KNOWLEDGE BASE (RAG) ===
    {retrieved_rules_text}

    === INSTRUCTIONS ===
    1. Verify the PROPOSED ANSWER against the QUERY and KNOWLEDGE BASE.
    2. If the answer is irrelevant, factually wrong, or violates the Knowledge Base, it fails.
    3. Return JSON ONLY.

    === OUTPUT FORMAT (JSON ONLY) ===
    {{
        "agents": [
            {{ "name": "Risk Detector", "status": "danger/success", "log": "Short explanation." }},
            {{ "name": "Rule Checker", "status": "warning/success", "log": "Short explanation." }}
        ],
        "final_verdict": "PASS or FAIL",
        "confidence_score": 95,
        "summary": "1 sentence summary of why it passed or failed."
    }}
    """

    raw_response = call_gemini(prompt)

    clean_json = raw_response.replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(clean_json)
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

# --- THE FIXER ENDPOINT (UPDATED) ---


class FixRequest(VerifyRequest):
    pass


@router.post("/fix")
def fix_solution(req: FixRequest):
    print("🔧 Generative Fix Requested...")

    retrieved_rules = ""
    if db:
        results = db.search(req.spec, top_k=2)
        if results:
            retrieved_rules = "\n".join([f"- {r['text']}" for r in results])

    # --- UPDATED PROMPT: DIRECT ANSWER ONLY ---
    prompt = f"""
    The user's previous AI answer was INCORRECT or UNSAFE.
    Your job is to generate the CORRECT answer for the User's Query.

    === CONTEXT ===
    USER QUERY: {req.spec}
    BAD ANSWER: {req.answer}
    OFFICIAL RULES: {retrieved_rules}

    === STRICT INSTRUCTIONS ===
    1. Write the correct answer to the USER QUERY.
    2. Ensure the answer complies with the OFFICIAL RULES naturally.
    3. DO NOT include a "Compliance" section.
    4. DO NOT include "Methodology" or "Sources".
    5. DO NOT explain what you fixed. Just give the clean, final result.
    6. If the answer is code, provide ONLY the code.

    === OUTPUT ===
    Return ONLY the corrected text/code. No intro, no outro.
    """

    fixed_text = call_gemini(prompt)
    return {"fixed_solution": fixed_text}
