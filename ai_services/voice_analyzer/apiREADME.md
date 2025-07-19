# Voice Analyzer API Dökümantasyonu

## Genel Tanım

**Voice Analyzer** servisi, mülakat ses dosyalarından teknik ve davranışsal (soft skill) analizler çıkartır.  
Asenkron job kuyruğu ile çalışır. REST API üzerinden kolayca entegre edilebilir.

---

## Temel API Akışı

1. **POST** `/voice/analyze` ile analiz başlatılır.
2. Cevapta bir `jobId` döner.
3. **GET** `/voice/status/{jobId}` ile sonuç sorgulanır.
4. Duruma göre `queued`, `processing`, `done` veya `failed` statüsü ve detaylar gelir.

---

## Endpoints

### 1. POST `/voice/analyze`

- **Açıklama:**  
  Yeni bir ses analizi işi başlatır. Kuyruğa ekler.

- **Request Body:**  
   | Alan | Tip | Zorunlu | Açıklama |
  |:---------------|:--------:|:-------:|-----------------------------------------------|
  | audio_path | string | ✔ | Analiz edilecek ses dosyasının tam yolu |
  | sampling_rate | int | ✖ | (Varsayılan: 16000) |
  | language | string | ✖ | "tr" veya "en", varsayılan "tr" |
  | provider | string | ✖ | Duygu analizi için: "mock", "speechbrain" ... |

- **Örnek:**

  ```json
  {
    "audio_path": "/tmp/audio_123.mp3",
    "sampling_rate": 16000,
    "language": "tr",
    "provider": "speechbrain"
  }
  ```

- **Response:**
  ```json
  {
    "jobId": "b3f1f55b-abe6-4106-8011-12345678abcd",
    "status": "queued"
  }
  ```

---

### 2. GET `/voice/status/{jobId}`

- **Açıklama:**  
  Belirtilen jobId’ye sahip analiz işinin mevcut durumunu ve (tamamlandıysa) analiz sonuçlarını döner.

- **Response (örnek — başarıyla tamamlanmış bir analiz):**

  ```json
  {
    "status": "done",
    "energyMean": 0.72,
    "energyStd": 0.11,
    "energyMax": 0.91,
    "energyMin": 0.41,
    "pitchMean": 134.6,
    "pitchStd": 23.2,
    "pitchMin": 90.0,
    "pitchMax": 220.5,
    "voiceBreakRatio": 0.04,
    "dominantEmotion": "neutral",
    "emotionScores": {
      "neutral": 0.8,
      "happy": 0.1,
      "sad": 0.05,
      "angry": 0.05
    },
    "softSkillScores": {
      "communicationEnergy": 0.72,
      "speechFluency": 0.88,
      "monotony": 0.55,
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
    "framesProcessed": 32,
    "framesWithVoice": 31,
    "processingTimeSec": 0.9,
    "error": null
  }
  ```

- **Response (beklemede veya işleniyor):**

  ```json
  {
    "status": "queued"
  }
  ```

  veya

  ```json
  {
    "status": "processing"
  }
  ```

- **Response (başarısız):**
  ```json
  {
    "status": "failed",
    "error": "Audio dosyası bulunamadı"
  }
  ```

---

### 3. GET `/health`

- **Açıklama:**  
  Servisin ayakta olup olmadığını test eder.

- **Response:**
  ```json
  {
    "status": "ok"
  }
  ```

---

## Dönen Alanların Açıklamaları

| Alan                  | Açıklama                                                    |
| --------------------- | ----------------------------------------------------------- |
| energyMean            | Ortalama ses enerjisi (RMS, [0-1])                          |
| energyStd             | Enerji değişkenliği (standart sapma)                        |
| pitchMean             | Ortalama temel frekans (Hz)                                 |
| pitchStd              | Pitch değişkenliği (prosodi göstergesi)                     |
| voiceBreakRatio       | Konuşma kopukluk oranı (0=çok iyi, 1=çok bozuk)             |
| dominantEmotion       | Ana duygu etiketi ("neutral", "happy", "sad", "angry", vs.) |
| emotionScores         | Tüm duygu skorları, olasılık olarak                         |
| softSkillScores       | Soft-skill skorları (energy, fluency, monotony, emotion)    |
| interpretations       | İnsan-yorumlu açıklamalar ve riskler                        |
| overallRecommendation | Özet öneri                                                  |
| error                 | (Hata varsa) hata mesajı                                    |

---

## Durum Kodları (Status)

| Status     | Açıklama                           |
| ---------- | ---------------------------------- |
| queued     | Kuyruğa alındı, işlenmeyi bekliyor |
| processing | Worker işliyor                     |
| done       | Analiz tamamlandı                  |
| failed     | Analiz sırasında hata oluştu       |

---

## Kullanım Akışı (Özet)

1. Ses dosyasını belirle ve yükle
2. `/voice/analyze` endpoint’ine POST yap
3. Gelen `jobId` ile `/voice/status/{jobId}` endpoint’inden sonucu sorgula
4. `status=done` geldiğinde sonucu kullan

---

## Örnek cURL Kullanımları

- **Analiz başlatmak için:**

  ```bash
  curl -X POST http://localhost:8002/voice/analyze \
    -H 'Content-Type: application/json' \
    -d '{"audio_path":"/tmp/audio_abc.mp3","language":"tr","provider":"speechbrain"}'
  ```

- **Sonucu sorgulamak için:**
  ```bash
  curl http://localhost:8002/voice/status/b3f1f55b-abe6-4106-8011-12345678abcd
  ```

---

## Geliştirici Notları

- Yeni bir analiz metrik/provider eklemek için `ai_services/voice_analyzer/services/` dizinine uygun fonksiyon eklenmeli.
- Job kuyruğu Redis ile çalışır, worker ayarları ve concurrency için Docker Compose ile çoğaltılabilir.
- Error ve log yönetimi için `pipeline`’da kayıt tutulur.

---

## Troubleshooting / Sık Sorunlar

- `"job not found"` ⇒ Yanlış/eksik jobId kullanımı veya expire olan iş
- `"Audio dosyası bulunamadı"` ⇒ Yol veya erişim hatası
- `"Speechbrain: ..."` ⇒ Model download veya runtime hatası
- Model RAM limiti ⇒ Büyük modellerde worker sayısını artırırken dikkat!

---

## Sürüm Notları

- v0.1.0: İlk stabil API yapısı
- v0.2.x: [YENİ] SpeechBrain entegrasyonu, hata yönetimi geliştirmeleri, daha zengin output

---

**Son güncelleme:** 2024-07-17

---
