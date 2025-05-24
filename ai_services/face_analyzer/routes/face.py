from fastapi import APIRouter, HTTPException
from models.input import FaceInput
from models.output import FaceOutput
from services.face_utils import analyze_face_video
import os

router = APIRouter()

@router.post("/analyze", response_model=FaceOutput)
def analyze_face(data: FaceInput):
    if not os.path.exists(data.video_path):
        raise HTTPException(status_code=400, detail="Video file not found.")
    return analyze_face_video(data.video_path)
