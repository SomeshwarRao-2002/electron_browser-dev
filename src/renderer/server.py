from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ollama import chat
import uvicorn

app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change to your frontend URL in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    model: str = "llama3.2" #default model

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        response = chat(model=request.model, messages=[{"role": "user", "content": request.message}])
        return {"reply": response["message"]["content"]}
    except Exception as e:
        return {"reply": f"Error: {e}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)