from fastapi import APIRouter, HTTPException
from app.core.gemini_client import call_gemini
from app.models.schemas import VerifyRequest, VerifyResponse

router = APIRouter()


@router.post("/verify", response_model=VerifyResponse)
def verify(req: VerifyRequest):
    print(f"1. Received request: {req.spec[:20]}...")  # Log input

    try:
        # Create the prompt
        prompt = f"""
        You are Gemini 3 acting as a strict engineering-specification verifier. 
        SPEC: {req.spec}
        AI ANSWER: {req.answer}
        RULES: {req.rules}
        
        Respond with:
        - PASS or FAIL
        - Bullet list of issues
        - Required fixes
        """

        # Call Gemini
        print("2. Calling Gemini...")
        gemini_output = call_gemini(prompt)
        print(f"3. Gemini responded: {str(gemini_output)[:50]}...")

        # FAILSAFE: If Gemini returns None, force a string
        if gemini_output is None:
            gemini_output = "Error: Gemini returned nothing."

        # Return the result as a dictionary
        return {"result": str(gemini_output)}

    except Exception as e:
        print(f"🔥 CRASH IN VERIFY: {e}")
        # Return a safe error message instead of crashing
        return {"result": f"System Error: {str(e)}"}
