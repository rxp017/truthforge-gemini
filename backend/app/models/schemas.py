from pydantic import BaseModel
from typing import List, Optional, Any


class VerifyRequest(BaseModel):
    spec: str
    answer: str
    rules: str

# We allow 'Any' for the result now because it is a complex JSON object


class VerifyResponse(BaseModel):
    result: Any
