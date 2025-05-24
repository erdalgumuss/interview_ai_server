from pydantic import BaseModel, Field

class FaceInput(BaseModel):
    video_path: str = Field(..., example="/tmp/video_abc123.mp4", description="Path to the temporary video file")
