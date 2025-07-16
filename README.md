# Interview AI Server

Yapay zeka tabanlı video mülakat değerlendirme ve çok adımlı analiz pipeline’ı. (Türkiye’de ve globalde teknik mülakat otomasyonu, insan kaynağı değerlendirme için endüstriyel altyapı.)

---

## 🚀 Genel Bakış

**Interview AI Server**, adayların video yanıtlarını alıp tamamen asenkron, dağıtık ve event-driven bir analiz pipeline’ı ile işler:

* **Video ve ses işleme** (download, audio extraction)
* **Otomatik transkripsiyon** (OpenAI Whisper)
* **Yüz ifadeleri ve duygu analizi** (Python mikroservis ile, örn: DeepFace, Mediapipe)
* **Ses/prosodi analizi** (speech rate, güven, duygu)
* **GPT-4 tabanlı cevap ve soft-skill analizi**
* **Sonuçların skora dönüştürülmesi ve kaydedilmesi**

---

## 🏗️ Mimari ve Pipeline Akışı

### Pipeline Adımları

1. **Video Download**
   Adayın video yanıtı indirilir (örn: Google Drive).

2. **Audio Extraction**
   Video’dan ses çıkarılır (`ffmpeg`).

3. **Transcription**
   OpenAI Whisper veya benzeriyle otomatik metin üretimi.

4. **Face Analysis**
   Python mikroservisi ile duygu, engagement, confidence, göz teması, dominant emotion skorları çıkarılır.
   (Asenkron çalışır; iş Redis kuyruğuna atılır, ayrı worker işler.)

5. **Voice Analysis**
   Prosodi, akıcılık, güven, duygu analizi.

6. **Input Normalization (Opsiyonel)**
   GPT için tüm feature’lar normalize edilir.

7. **GPT Analysis**
   OpenAI GPT-4 ile yanıt kalitesi, anahtar kelime, skill fit gibi analizler ve otomatik puanlama.

8. **Final Scoring**
   Tüm veriler ile communication & overall score hesaplanır.

9. **Results Save**
   Pipeline çıktısı MongoDB’ye kaydedilir, webhook varsa tetiklenir.

---

## 🛠️ Teknik Yığın

* **Node.js + TypeScript**: Pipeline yönetimi, işçiler (worker), API, iş kuyruğu.
* **BullMQ (Redis)**: Kuyruk yönetimi ve adım-adım iş akışı.
* **Python FastAPI Servisleri**: Yüz analizi ve diğer ileri AI görevleri için GPU uyumlu mikroservisler.
* **MongoDB**: Pipeline işlemleri, başvurular ve analiz sonuçlarının saklanması.
* **Redis**: Kuyruk ve asenkron status yönetimi.
* **OpenAI GPT-4 API & Whisper API**: Otomatik transkripsiyon ve doğal dilde analiz.

---

## ⚙️ Kurulum & Çalıştırma

### Gereksinimler

* Docker ve docker-compose (veya Podman)
* 8GB+ RAM önerilir (AI pipeline için)
* Linux/Mac/WSL2 önerilir

### Projeyi Klonla

```bash
git clone https://github.com/kendi-username/interview_ai_server.git
cd interview_ai_server
```

### Ortam Değişkenlerini Ayarla

* `.env` dosyası oluştur veya `docker-compose.yml` içindeki environment değişkenlerini özelleştir.

### Servisleri Başlat

```bash
docker compose up --build
```

#### Servisler

* `node_server`: API ve BullMQ worker
* `worker`: Kuyruk işçileri (video, audio, transcription vs.)
* `mongodb`, `redis`: Veri tabanı ve kuyruk
* `face_analyzer`: Python FastAPI microservice
* `face_analyzer_worker`: Video yüz analizi Python worker

---

## 🖥️ Arayüz ve API

* **REST API:** `/api/pipeline` ile yeni pipeline başlatılabilir.
* **Bull Board (opsiyonel):** Kuyrukları görsel olarak izlemek için eklenebilir.

---

## 📦 Pipeline Kayıtları ve JSON Yapısı

Her işin çıktısı MongoDB’de aşağıdaki gibi tutulur (/örnek/):

```json
{
  "steps": [
    {
      "name": "video_download",
      "status": "success",
      "output": {...}
    },
    {
      "name": "transcription",
      "status": "success",
      "output": {...}
    }
  ],
  "final_score": 83,
  "candidate_id": "...",
  "created_at": "2023-01-01T12:34:56Z"
}
```

---

## 👷️‍븏 Çalışanlar (Workers) ve Mikroservisler

* Her adımın worker’ı vardır: video download, audio extraction, transcription, face/voice analysis, GPT analysis, scoring.
* Python microservice (`face_analyzer`) asenkron çalışır. Kuyrukta işi alır, sonucu Redis/Mongo’ya kaydeder.
* Node.js tarafında BullMQ kuyrukları yönetir.

---

## 🧑‍💻 Geliştirici Notları

* Her adım bağımsız olarak tekrar çalıştırılabilir (**pipeline resilience**).
* Hatalı adımlar `error` state ile pipeline’da tutulur; geçmiş hatalar kaybolmaz.
* Yeni bir analiz adımı eklemek için sadece bir worker ve bir step eklemek yeterli.
* Tüm kodlar tip güvenli (TypeScript, Pydantic).

---

## 🛡️ Güvenlik & Ölçeklenebilirlik

* API endpoint’lerinde JWT veya API key desteği kolayca eklenebilir.
* Video ve sesler işlenirken geçici dizinler (`/tmp`) kullanılır.
* Python microservisler aynı anda birden fazla işi process edebilir.

---

## 🧪 Test ve Geliştirme

* Her adım ayrı test edilebilir (/örn: video download, yüz analizi/).
* Python servislerini local veya docker içinde test etmek için:

```bash
docker compose run face_analyzer_worker python worker.py
```

* Testler `tests/` dizininde örneklerle beraber gelir.

---

## 📦 Ek Notlar ve Katkı

* Proje **modüler** yapıdadir, yeni analiz servisleri kolayca eklenebilir.
* Geliştirici katkılarına **açıktır!**
* Issue ve PR’lar için Github üzerinden iletişime geçebilirsiniz.

---

## 📄 Lisans

*(Lisans bilgisi buraya eklenebilir)*
