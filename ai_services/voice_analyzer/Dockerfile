# 1. Uygun, küçük ve hızlı bir python image seçiyoruz (hem hız hem uyumluluk)
FROM python:3.10-slim

# 2. Sistem bağımlılıklarını yükle (gerekirse ffmpeg, libsndfile, sox, vs. eklenebilir)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      libsndfile1 \
      && rm -rf /var/lib/apt/lists/*

# 3. Çalışma dizini
WORKDIR /app

# 4. Python bağımlılıkları
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Kod dosyalarını ekle
COPY . .

# 6. Default ortam değişkenleri
ENV PYTHONUNBUFFERED=1 \
    PORT=8002

# 7. Default: FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
