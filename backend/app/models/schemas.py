from pydantic import BaseModel


class VerifyRequest(BaseModel):
    spec: str
    answer: str
    rules: str


class VerifyResponse(BaseModel):
    result: str
