"""İpuçları & İyileştirmeler:
Landmark indeksleri doğru mu?: 33 ve 263 genellikle sol/sağ göz köşeleri, ama yüz döndüğünde hafif sapmalar olabilir. MVP için yeterli, ileride göz merkezleri de alınabilir.

FaceMesh objesi: Her fonksiyon çağrısında yeni bir FaceMesh yaratmak yerine (ki yapmamışsın, güzel!) global olarak paylaşmak hızlı ve doğru bir yöntem.

Eşik ayarı: gaze_threshold ve angle karşılaştırması kaba bir yöntemdir, MVP’de iş görür. Daha iyisi için pupil deteksiyon, dikey/lateral yüz rotasyon kompanzasyonu ileride eklenebilir.

Çoklu yüz: Şu an tek yüz için (ilk kişi), demo ve MVP için yeterli."""




import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
# Production'da tek bir FaceMesh objesini (global) paylaşmak iyi bir uygulamadır!
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1)

def analyze_gaze(frame, gaze_threshold=0.1):
    """
    Basit göz teması ve bakış yönü analizi.
    - eye_contact: Merkeze bakıyor mu?
    - direction: "left", "right", "center", "undetected"
    """
    try:
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(img_rgb)
        if not results.multi_face_landmarks:
            return False, "undetected"
        # Sadece ilk yüzü kullan (tek kişi için)
        landmarks = results.multi_face_landmarks[0].landmark

        # Gözlerin anahtar noktalarını al (33: sol, 263: sağ göz köşesi)
        left_eye = landmarks[33]
        right_eye = landmarks[263]

        dx = right_eye.x - left_eye.x
        dy = right_eye.y - left_eye.y
        gaze_angle = np.arctan2(dy, dx)

        # Bakış merkezi için eşiği daha dinamik/ince ayarlayabilirsin
        eye_contact = abs(gaze_angle) < gaze_threshold

        # Yönü belirle
        if gaze_angle > 0.2:
            direction = "left"
        elif gaze_angle < -0.2:
            direction = "right"
        else:
            direction = "center"

        return eye_contact, direction
    except Exception as e:
        # Gelişmiş debug için log eklenebilir: print(f"[Gaze] Exception: {e}")
        return False, "undetected"
