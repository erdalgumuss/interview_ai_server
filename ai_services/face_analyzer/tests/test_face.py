import requests

def test_face_analysis():
    payload = {
        "video_path": "/tmp/test_erdal.mp4"
    }
    try:
        response = requests.post("http://localhost:8000/face/analyze", json=payload)
        print("📡 Status Code:", response.status_code)

        if response.status_code != 200:
            print("❌ Error Response:", response.text)
            return

        data = response.json()
        print("✅ Face Analysis Result:", data)

        assert "dominantEmotions" in data
        assert "eyeContactRatio" in data
        assert isinstance(data["confidenceScore"], (int, float))
        assert isinstance(data["engagementScore"], (int, float))
        assert "framesProcessed" in data

        print("🎉 Tüm testler geçti.")

    except Exception as e:
        print("❌ Test crashed:", e)

if __name__ == "__main__":
    test_face_analysis()
