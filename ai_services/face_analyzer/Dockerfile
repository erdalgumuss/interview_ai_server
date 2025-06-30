# Python'ın slim imajı kullanılır (küçük ve güvenli)
FROM python:3.10-slim

# Çalışma dizini
WORKDIR /app

# Sistem bağımlılıkları: OpenCV, DeepFace, Mediapipe gibi paketler için gerekir!
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıkları için requirements.txt'yi kopyala ve kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulamanın tüm dosyalarını kopyala
COPY . .

# Portu ENV ile tanımla (opsiyonel, default 8001)
ENV PORT=8001

# (Öneri) main.py içinde portu dinamik oku:
# import os
# port = int(os.environ.get("PORT", 8001))

# Uvicorn ile FastAPI başlatıcı komutunu ayarla (portu ENV'den alırsan ENTRYPOINT veya CMD'de bash ile kullanabilirsin)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]

# Alternatif, portu env ile bash olarak:
# ENTRYPOINT ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
