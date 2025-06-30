from fastapi import APIRouter, HTTPException
from models.input import FaceInput
from models.output import FaceOutput
from services.face_video import analyze_face_video

router = APIRouter()

@router.post("/analyze", response_model=FaceOutput)
async def analyze_face(data: FaceInput):
    try:
        result = analyze_face_video(
            data.video_path,
            sampling_rate=data.sampling_rate,
            gaze_threshold=data.gaze_threshold,
            max_frames=data.max_frames,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
