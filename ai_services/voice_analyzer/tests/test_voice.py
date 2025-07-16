# tests/test_voice.py

import requests

def test_submit_job():
    data = {"audio_path": "/tmp/audio_1234.mp3"}
    res = requests.post("http://localhost:8002/voice/analyze", json=data)
    print(res.json())

def test_check_status(job_id):
    res = requests.get(f"http://localhost:8002/voice/status/{job_id}")
    print(res.json())
