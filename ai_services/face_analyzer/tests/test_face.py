# import requests
# import os

# def test_face_analysis():
#     # DOSYANIN GERÇEK YOLU
#     video_path = "../../../tmp/test_erdal.mp4"   # Hostta mevcut path
#     abs_video_path = os.path.abspath(video_path)

#     print(f"PWD: {os.getcwd()}")
#     print(f"[TEST] Hostta video var mı? {os.path.isfile(video_path)} ({video_path})")
#     print(f"[TEST] Absolut path video var mı? {os.path.isfile(abs_video_path)} ({abs_video_path})")

#     if os.path.exists(abs_video_path):
#         print(f"[TEST] Dosya boyutu: {os.path.getsize(abs_video_path)/1024/1024:.2f} MB")
#     else:
#         print(f"[TEST] UYARI: {abs_video_path} bulunamadı.")

#     # Docker volume'de /tmp'ye mount ettiysen, API'ye /tmp/test_erdal.mp4 gönder
#     api_path = "/tmp/test_erdal.mp4"
#     payload = {
#         "video_path": api_path
#     }
#     print(f"[HTTP] POST gönderiliyor: {payload}")

#     try:
#         response = requests.post("http://localhost:8001/face/analyze", json=payload)
#         print("📡 Status Code:", response.status_code)

#         if response.status_code != 200:
#             print("❌ Error Response:", response.text)
#             try:
#                 print("[❌ JSON ERROR]:", response.json())
#             except Exception as e:
#                 print("[❌ RESPONSE PARSE ERROR]:", e)
#             return

#         data = response.json()
#         print("✅ Face Analysis Result:", data)

#         assert "dominantEmotions" in data
#         assert "eyeContactRatio" in data
#         assert isinstance(data["confidenceScore"], (int, float))
#         assert isinstance(data["engagementScore"], (int, float))
#         assert "framesProcessed" in data

#         print("🎉 Tüm testler geçti.")

#     except Exception as e:
#         print("❌ Test crashed:", e)

# if __name__ == "__main__":
#     test_face_analysis()
