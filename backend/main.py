from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import requests  # Used for API calls
from openai import OpenAI
from dotenv import load_dotenv
import time  # For retry mechanism
from typing import Optional, Dict
import jwt
from datetime import datetime, timedelta

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
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-for-development")  # Use a secure key in production

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)

# In-memory user message count store
# In a production system, this would be stored in a database with proper time management
# Current structure: { 'user_id': [timestamp1, timestamp2, ...] }
user_message_counts: Dict[str, list] = {}

# Maximum allowed messages per user per day
MAX_MESSAGES_PER_DAY = 4

# Pydantic models
class InfraRequest(BaseModel):
    prompt: str
    model: str  # "deepseek" or "gemini"

class UserLimitResponse(BaseModel):
    remaining_messages: int
    max_messages: int
    has_access: bool

# Dependency to get and validate user ID from token
async def get_user_id(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify the token
        # In a real app, you would verify against your auth provider
        # This is a simplified example
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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

def increment_user_message_count(user_id: str) -> int:
    """
    Increment user message count and return remaining messages for the day
    Keeps track of message timestamps and removes messages older than 24 hours
    """
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    
    if user_id not in user_message_counts:
        user_message_counts[user_id] = []
    
    # Remove timestamps older than 24 hours
    user_message_counts[user_id] = [
        timestamp for timestamp in user_message_counts[user_id] 
        if timestamp > one_day_ago
    ]
    
    # Add current timestamp
    user_message_counts[user_id].append(now)
    
    # Return remaining messages for the day
    return MAX_MESSAGES_PER_DAY - len(user_message_counts[user_id])

def get_remaining_messages(user_id: str) -> int:
    """
    Get remaining message count for a user for the current day
    Removes messages older than 24 hours before counting
    """
    now = datetime.utcnow()
    one_day_ago = now - timedelta(days=1)
    
    if user_id not in user_message_counts:
        return MAX_MESSAGES_PER_DAY
    
    # Filter to only include messages from the last 24 hours
    recent_messages = [
        timestamp for timestamp in user_message_counts[user_id] 
        if timestamp > one_day_ago
    ]
    
    # Update the user's message list
    user_message_counts[user_id] = recent_messages
    
    return max(0, MAX_MESSAGES_PER_DAY - len(recent_messages))

@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

@app.get("/user/limits")
async def get_user_limits(user_id: str = Depends(get_user_id)):
    """Get user's remaining message quota for the day"""
    remaining = get_remaining_messages(user_id)
    return UserLimitResponse(
        remaining_messages=remaining,
        max_messages=MAX_MESSAGES_PER_DAY,
        has_access=remaining > 0
    )

@app.post("/generate-infra/")
async def generate_infra(request: InfraRequest, user_id: str = Depends(get_user_id)):
    """Generate infrastructure code using selected AI model with rate limiting"""
    # Check if user has messages remaining for today
    remaining = get_remaining_messages(user_id)
    if remaining <= 0:
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. You have reached your daily message limit of 4 messages."
        )
    
    # Process the request
    if request.model == "deepseek":
        response = call_deepseek_openrouter(request.prompt)
    elif request.model == "gemini":
        response = call_gemini(request.prompt)
    else:
        raise HTTPException(status_code=400, detail="Invalid model selected. Choose 'deepseek' or 'gemini'.")

    # Increment user message count
    remaining = increment_user_message_count(user_id)
    
    return {
        request.model: response,
        "remaining_messages": remaining,
        "max_messages": MAX_MESSAGES_PER_DAY
    }

# For testing purposes - generate a JWT token
@app.post("/test/generate-token")
async def generate_test_token(user_id: str):
    """Generate a JWT token for testing purposes - DO NOT USE IN PRODUCTION"""
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return {"token": token}

# For testing purposes - reset all user counts
@app.post("/admin/reset-counts")
async def reset_counts():
    """Reset all user message counts - for testing only"""
    global user_message_counts
    user_message_counts = {}
    return {"message": "All user message counts reset"}