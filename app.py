import os
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision import transforms
from ultralytics import YOLO  # Import YOLOv8 model class

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend-backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define model paths (Ensure this matches your actual directory structure)
MODEL_DIR = r"C:\Users\User\thesis uiux1\my-pwa-app\backend\models"
MODEL_FILES = {
    "accuracy": os.path.join(MODEL_DIR, "60_accuracy_model.pth"),
    "best": os.path.join(MODEL_DIR, "best.pt"),
}

# Select Model (Change "best" to "accuracy" if needed)
SELECTED_MODEL = "best"  # Options: "best" or "accuracy"

MODEL_PATH = MODEL_FILES.get(SELECTED_MODEL)
if not MODEL_PATH or not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model file not found at {MODEL_PATH}")

# Load Model
try:
    if SELECTED_MODEL == "best":
        model = YOLO(MODEL_PATH)  # Directly load .pt YOLOv8 model
    else:
        model = torch.load(MODEL_PATH, map_location=torch.device("cpu"))  # Load .pth model
        model = YOLO(model)  # Wrap in YOLO for inference

    print(f"✅ Successfully loaded model: {MODEL_PATH}")

except Exception as e:
    raise RuntimeError(f"❌ Failed to load model: {str(e)}")

# Define label mappings
LABELS = [
    "Good morning", "Good afternoon", "Good evening", "Hello", "How are you", "I'm fine",
    "Thank you", "You're Welcome", "What is your name", "My name is", "Who are you", "Where are you",
    "When", "Why", "Which", "Excuse me", "I like you", "I love you", "I'm sorry", "Please",
    "Yes", "No", "I understand", "I don't understand", "See you later", "See you tomorrow",
    "Wait", "Maybe", "Take care", "Come let's eat", "Nice to meet you", "We're the same",
    "Calm down", "What", "What's up", "Which is better", "How", "How old are you", "See you again",
    "What's wrong"
]

# Image Preprocessing
transform = transforms.Compose([
    transforms.Resize((640, 640)),
    transforms.ToTensor(),
])

# Prediction API
@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        # Read image
        image = Image.open(file.file).convert("RGB")
        image = transform(image).unsqueeze(0)  # Add batch dimension

        # Ensure model is on the correct device
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        image = image.to(device)

        # Perform prediction
        with torch.no_grad():
            results = model(image)

        # Process results
        detected_labels = []
        for result in results:
            if hasattr(result, "boxes"):
                for box in result.boxes:
                    if hasattr(box, "cls"):
                        class_id = int(box.cls.item())
                        if 0 <= class_id < len(LABELS):
                            detected_labels.append(LABELS[class_id])

        return {"detections": detected_labels}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run API server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
