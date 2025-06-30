from pydantic import BaseModel, Field

class FaceInput(BaseModel):
    video_path: str = Field(..., example="/app/data/ali_q1.mp4")
    sampling_rate: float = Field(1.0, description="Seconds per frame sample")
    gaze_threshold: float = Field(0.1, description="Eye contact threshold")
    max_frames: int = Field(30, description="Max frames to process")
