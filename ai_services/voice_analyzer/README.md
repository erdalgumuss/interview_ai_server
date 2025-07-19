# Voice Analyzer Service

---

## 1. Genel Tanım

**Voice Analyzer**, mülakat seslerinden iletişim, duygu, enerji, tonlama gibi soft-skill göstergeleri çıkaran, asenkron çalışan bir analiz servisidir. Gelişmiş metrikler ve multi-provider desteği ile IK’ya teknik ötesi anlamlı öngörüler sunar.

---

## 2. Mimari & Akış

- **Teknolojiler:** Python (FastAPI), Redis, Docker
- **Asenkron işleme:** Redis job kuyruğu
- **Modüler analiz servisleri:** (energy, pitch, emotion vb.)

**Akış Diyagramı:**

Kullanıcı → \[POST /voice/analyze] → \[Redis Kuyruğu] → \[Worker] → \[Metrik Analizi] → \[Redis] → \[GET /voice/status/{jobId}]

---

## 3. API Endpointleri

### 3.1 POST `/voice/analyze`

- **Açıklama:** Bir ses dosyasını analiz kuyruğuna ekler.

- **Request Body:**

  ```json
  {
    "audio_path": "/tmp/audio_abc.mp3",
    "sampling_rate": 16000,
    "language": "tr",
    "provider": "speechbrain"
  }
  ```

  - `audio_path` (**zorunlu**): Dosyanın tam yolu (sunucu içi)
  - `sampling_rate` (opsiyonel): Hedef örnekleme oranı (Hz)
  - `language` (opsiyonel): 'tr', 'en' vb.
  - `provider` (opsiyonel): Duygu modeli ("mock", "speechbrain", "huggingface", ...)

- **Response:**

  ```json
  { "jobId": "cf7c1234-56ab-...-ef88", "status": "queued" }
  ```

---

### 3.2 GET `/voice/status/{jobId}`

- **Açıklama:** Analiz sonucunu ve ilerleme durumunu döner.
- **Response (Başarılı):**

  ```json
  {
    "status": "done",
    "energyMean": 0.65,
    "energyStd": 0.08,
    "energyMax": 0.98,
    "energyMin": 0.33,
    "pitchMean": 143.2,
    "pitchStd": 22.1,
    "voiceBreakRatio": 0.06,
    "dominantEmotion": "neutral",
    "emotionScores": {
      "neutral": 0.87,
      "happy": 0.08,
      "sad": 0.03,
      "angry": 0.02
    },
    "softSkillScores": {
      "communicationEnergy": 0.62,
      "speechFluency": 0.88,
      "monotony": 0.77,
      "emotionScore": 0.5
    },
    "interpretations": {
      "communicationEnergy": "Ses enerjisi yeterli.",
      "speechFluency": "Akıcı konuşma.",
      "monotony": "Ses tonu çeşitli, monoton değil.",
      "emotion": "Duygu tespiti: neutral."
    },
    "risks": [],
    "overallRecommendation": "Adayın iletişim becerisi genel olarak yeterli.",
    "framesProcessed": 36,
    "framesWithVoice": 34,
    "processingTimeSec": 0.88,
    "error": null
  }
  ```

- **Response (Devam Ediyor):**

  ```json
  { "status": "processing" }
  ```

- **Response (Hata):**

  ```json
  { "status": "failed", "error": "Job not found" }
  ```

---

### 3.3 GET `/health`

- **Açıklama:** Servisin ayakta olup olmadığını kontrol eder.
- **Response:**

  ```json
  { "status": "ok" }
  ```

---

## 4. Output Metrikleri & Açıklamaları

| Alan                  | Açıklama                                               |
| --------------------- | ------------------------------------------------------ |
| energyMean            | Sesin ortalama enerjisi (0-1 arası)                    |
| energyStd             | Enerji değerinin standart sapması                      |
| pitchMean             | Ortalama pitch (Hz)                                    |
| pitchStd              | Pitch'in standart sapması                              |
| voiceBreakRatio       | Sessiz frame oranı, yüksekse kopuk/duraksamalı konuşma |
| dominantEmotion       | Ana duygu etiketi (neutral, happy, sad, ...)           |
| emotionScores         | Her duyguya ait olasılıklar                            |
| softSkillScores       | Hesaplanan soft skill skorları (0-1)                   |
| interpretations       | İnsan-okunur metin yorumları                           |
| risks                 | Belirlenen riskli durumlar                             |
| overallRecommendation | Genel değerlendirme                                    |
| ...                   | Diğer metrikler: snrEstimate, dynamicRange, vb.        |

---

## 5. Pipeline & Kuyruk Mekaniği

- **Queue adı:** voice_analysis_python
- **Job Status:** queued, processing, done, failed

**Workflow:**

- POST ile iş kuyruğa girer.
- Worker analiz eder, sonucu Redis'e kaydeder.
- Status endpoint ile polling yapılır.
- Timeout/Retry mekanizması: (Varsa belirt)

---

## 6. Kurulum & Çalıştırma

### Gereksinimler

- Python 3.10+
- Redis (örn: Docker ile redis:6.2-alpine)
- (Opsiyonel) Docker & docker-compose

### Kurulum

```bash
# Bağımlılıklar:
pip install -r requirements.txt

# Servisi başlat:
uvicorn main:app --host 0.0.0.0 --port 8002

# Worker başlat:
python worker.py

# .env veya config dosyalarını doldur (örn: Redis adresi)
```

### Test

```bash
curl -X POST "http://localhost:8002/voice/analyze" -H "Content-Type: application/json" \
  -d '{"audio_path":"/tmp/audio_abc.mp3"}'

curl "http://localhost:8002/voice/status/cf7c1234-..."
```

---

## 7. Sık Karşılaşılan Sorunlar

- **Job not found:** Yanlış/eksik jobId, job expire olmuş olabilir
- **File not found:** Dosya yolu yanlış veya dosya silinmiş
- **Model download failed:** SpeechBrain modeli indirilemiyor; internet/firewall?
- **Processing stuck:** Worker çalışıyor mu? Kuyrukta job birikiyor mu?

---

## 8. Geliştirici Notları

- Yeni analiz metrikleri eklemek için `services/` altındaki ilgili dosyada fonksiyon oluştur.
- Yeni provider (duygu modeli) eklemek için: `services/emotion.py` fonksiyonlarını güncelle.
- Testler: `tests/test_voice.py`
- `requirements.txt`'de eksik kütüphane varsa ekle!

---

## 9. Versiyon Geçmişi

| Tarih      | Versiyon | Açıklama              |
| ---------- | -------- | --------------------- |
| 2024-07-18 | 1.0.0    | İlk production yayını |
| ...        | ...      | ...                   |
