import os
import cv2

def sample_video_frames(video_path, sampling_rate=1.0, max_frames=None):
    print(f"[*] sample_video_frames çağrıldı: {video_path}")
    if not os.path.isfile(video_path):
        raise ValueError(f"Video path does NOT exist or is not a file: {video_path}")
    print(f"[*] Dosya bulundu! Boyut: {os.path.getsize(video_path) / 1024 / 1024:.2f} MB")
    print(f"[*] Dosya izinleri: {oct(os.stat(video_path).st_mode)}")
    
    cap = cv2.VideoCapture(video_path)
    print(f"[*] cv2.VideoCapture başlatıldı: {cap}")
    if not cap.isOpened():
        # Kodlayıcı ve platform detaylarını printle:
        print(f"[!] cap.isOpened() FALSE. OpenCV'nin backend'i: {cv2.getBuildInformation()}")
        raise ValueError(f"Video cannot be opened. (cv2.VideoCapture isOpened()==False). Path: {video_path}")

    frame_rate = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"[*] Video FPS: {frame_rate}, toplam frame: {total_frames}")
    step = int(frame_rate * sampling_rate)
    frames = []
    count = 0
    for i in range(0, total_frames, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            print(f"[!] Frame {i} okunamadı.")
            continue
        frames.append(frame)
        count += 1
        if max_frames and count >= max_frames:
            break
    cap.release()
    print(f"[*] Toplam {count} frame okundu.")
    return frames
