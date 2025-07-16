Interview AI Server
Yapay zeka tabanlı video mülakat değerlendirme, çok adımlı analiz pipeline’ı
(Türkiye’de ve globalde teknik mülakat otomasyonu, insan kaynağı değerlendirme için endüstriyel altyapı).

🚀 Genel Bakış
Interview AI Server; adayların video yanıtlarını alıp çok adımlı bir analiz pipeline’ı ile:

Video ve ses işleme (download, audio extraction)

Otomatik transkripsiyon (OpenAI Whisper)

Yüz ifadeleri ve duygu analizi (Python mikroservis ile, ör. DeepFace, Mediapipe)

Ses/prosodi analizi (speech rate, güven, duygu)

GPT-4 tabanlı cevap/soft-skill analizi

Sonuçların skora dönüştürülmesi ve kaydedilmesi

yapan tamamen asenkron, dağıtık, event-driven bir yapay zeka işleme pipeline’ıdır.

🏗️ Mimari ve Pipeline Akışı
<!-- Buraya bir şema eklersen daha iyi! -->

Pipeline Adımları:
Video Download:
Adayın yanıtı indiriliyor (örn. Google Drive).

Audio Extraction:
Video’dan ses çıkarılır (ffmpeg).

Transcription:
OpenAI Whisper veya benzeriyle otomatik metin üretimi.

Face Analysis:
Python mikroservisi ile duygu, engagement, confidence, göz teması, dominant emotion gibi skorlar.

Asenkron çalışır; iş Redis kuyruğuna atılır, ayrı worker işler, sonucu poller ile alınır.

Voice Analysis:
Prosodi, akıcılık, güven vs.

Input Normalization (Opsiyonel):
GPT input’u için tüm feature’lar normalize edilir.

GPT Analysis:
OpenAI GPT-4 ile yanıt kalitesi, anahtar kelime, skill fit vs. otomatik puanlama.

Final Scoring:
Tüm verilerle, communication & overall score hesaplanır.

Results Save:
Pipeline çıktısı MongoDB’de kaydedilir, webhook varsa tetiklenir.

🛠️ Teknik Yığın
Node.js + TypeScript:
Pipeline yönetimi, işçiler (worker), API, iş kuyruğu.

BullMQ (Redis):
Kuyruk yönetimi ve adım-adım iş akışı.

Python FastAPI Servisleri:
Yüz analizi ve diğer ileri AI görevleri için, GPU uyumlu mikroservisler.

MongoDB:
Tüm pipeline işlemlerinin, aday başvurularının ve analiz sonuçlarının saklanması.

Redis:
Kuyruk ve asenkron status yönetimi.

OpenAI GPT-4 API & Whisper API:
Otomatik transkripsiyon ve doğal dilde analiz.

⚙️ Kurulum & Çalıştırma
1. Gereksinimler
Docker ve docker-compose (veya Podman)

8GB+ RAM önerilir (AI pipeline için)

Linux/Mac/WSL2 en sorunsuz platformlar

2. Projeyi Klonla
bash
Kopyala
Düzenle
git clone https://github.com/kendi-username/interview_ai_server.git
cd interview_ai_server
3. Ortam Değişkenlerini Ayarla
.env dosyası oluştur veya docker-compose.yml içindeki environmentları özelleştir.

4. Servisleri Başlat
bash
Kopyala
Düzenle
docker compose up --build
node_server: API ve BullMQ worker

worker: Queue işçileri (video, audio, transcription vs.)

mongodb, redis: Veri tabanı ve kuyruk

face_analyzer: Python FastAPI microservice

face_analyzer_worker: Video yüz analizi Python worker

5. Arayüz ve API
REST API:
/api/pipeline ile yeni pipeline başlatılabilir.

Bull Board (opsiyonel):
Kuyrukları görsel olarak izlemek için eklenebilir.

🔗 Pipeline Kayıtları ve JSON Yapısı
Her işin çıktısı MongoDB’de aşağıdaki gibi tutulur:

<details> <summary>Örnek Pipeline JSON</summary>
json
Kopyala
Düzenle
{
  "meta": {...},
  "application": {...},
  "videoUrl": "...",
  "pipelineSteps": {
    "video_downloaded": { "state": "done", ... },
    "audio_extracted":  { "state": "done", ... },
    "transcribed":      { "state": "done", ... },
    "face_analyzed":    { "state": "done", ... },
    "voice_analyzed":   { "state": "done", ... },
    "gpt_analyzed":     { "state": "done", ... },
    "final_scored":     { "state": "done", ... },
    "results_saved":    { "state": "pending" }
  },
  "faceScores": {...},
  "voiceScores": {...},
  "aiResult": {...},
  "overallScore": 8
}
</details>
👷 Çalışanlar (Workers) ve Mikroservisler
Her adımın worker’ı vardır:
Video download, audio extraction, transcription, face/voice analysis, GPT analysis, scoring.

Python microservice (face_analyzer) asenkron çalışır. Kuyrukta işi alır, sonucu Redis/Mongo’ya kaydeder.

Node tarafında BullMQ kuyrukları yönetir.

🧑‍💻 Geliştirici Notları
Her adım bağımsız olarak tekrar çalıştırılabilir (pipeline resilience).

Hatalı adımlar “error” state ile pipeline’da tutulur, geçmiş hatalar kaybolmaz.

Yeni bir analiz adımı eklemek için sadece bir worker ve bir step eklemek yeterli.

Tüm kodlar tip güvenli (TypeScript, Pydantic).

🛡️ Güvenlik & Ölçeklenebilirlik
API endpoint’lerinde JWT veya API key desteği kolayca eklenebilir.

Video ve sesler işlenirken geçici dizinler (/tmp) kullanılır.

Python microservisler aynı anda birden fazla işi process edebilir.

🧪 Test ve Geliştirme
Her adım ayrı test edilebilir (ör. video download, yüz analizi).

Python servislerini local veya docker içinde test etmek için:

////
docker compose run face_analyzer_worker python worker.py
Testler tests/ dizininde örneklerle beraber gelir.

📦 Ek Notlar ve Katkı
Proje modülerdir, yeni analiz servisleri kolayca eklenir.

Geliştirici katkılarına açıktır!

Issue ve PR’lar için Github üzerinden iletişime geçebilirsiniz.

📄 Lisans

