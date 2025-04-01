from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import requests  # Used for API calls
from openai import OpenAI
from dotenv import load_dotenv
import time  # For retry mechanism

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS (for frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (restrict in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API keys from environment
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

# Pydantic model for the request body
class InfraRequest(BaseModel):
    prompt: str
    model: str  # "deepseek" or "gemini"

def call_deepseek_openrouter(prompt: str) -> str:
    """ Call OpenRouter's DeepSeek API """
    try:
        extra_headers = {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "InfraGen"
        }
        
        prompt = f"Generate infrastructure as code (e.g., Terraform, CloudFormation) for the following request: {prompt}. Please return only the code, no extra details."
        
        completion = client.chat.completions.create(
            extra_headers=extra_headers,
            model="deepseek/deepseek-chat-v3-0324:free",
            messages=[{"role": "user", "content": prompt}]
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenRouter API Error: {e}")
        return "Error communicating with OpenRouter API"

def call_gemini(prompt: str, max_retries: int = 3) -> str:
    """ Call Gemini AI API with retry logic and increased timeout """
    if not GEMINI_API_KEY:
        return "Missing GEMINI_API_KEY. Set it in environment variables."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": f"Generate infrastructure as code (Terraform, Kubernetes YAMLs, Helm Charts) for: {prompt}. Return only the code, no explanations."}]
        }]
    }

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)  # Increased timeout to 30s
            response.raise_for_status()

            data = response.json()
            return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "No response").strip()
        
        except requests.exceptions.Timeout:
            logging.warning(f"Gemini API Timeout (Attempt {attempt}/{max_retries})")
            if attempt < max_retries:
                time.sleep(2)  # Wait before retrying
            else:
                return "Gemini API timed out after multiple attempts. Try again later."

        except requests.exceptions.RequestException as e:
            logging.error(f"Gemini API Error: {e}")
            return f"Error communicating with Gemini API: {e}"

    return "Unexpected error with Gemini API"

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.post("/generate-infra/")
async def generate_infra(request: InfraRequest):
    """ Generate infrastructure code using selected AI model """
    if request.model == "deepseek":
        response = call_deepseek_openrouter(request.prompt)
    elif request.model == "gemini":
        response = call_gemini(request.prompt)
    else:
        raise HTTPException(status_code=400, detail="Invalid model selected. Choose 'deepseek' or 'gemini'.")

    return {request.model: response}