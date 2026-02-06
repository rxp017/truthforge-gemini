import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

# Connect to Google
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("--- YOUR AVAILABLE MODELS ---")
# List every model you are allowed to use
for m in client.models.list():
    print(m.name)
print("-----------------------------")
