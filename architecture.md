Geliştirici Notları – interview_ai_server Monorepo
Bu monorepo; Node.js/TypeScript ve Python tabanlı çok adımlı bir video/mülakat analiz pipeline’ı içerir. Yapay zekâ destekli analizler için hem klasik backend işçileri (worker), hem de ayrı AI servisleri (microservice) kullanılır.

Dizin Yapısı ve Genel Akış
bash
Kopyala
Düzenle
.
├── ai_services/ # Python tabanlı mikroservisler (Face, Voice, Whisper)
├── src/ # Node.js ana backend kodları (API, workers, queues)
├── tmp/ # Tüm geçici medya dosyaları (video, audio, transcript)
├── docs/ # Tasarım ve API dokümantasyonu
├── docker-compose.yml # Tüm stack’in container orkestrasyonu
Önemli Katmanlar ve Dosyalar

1. AI Servisleri (Python) – ai_services/
   face_analyzer/

main.py: FastAPI ile HTTP endpoint (POST /face/analyze, GET /face/status/:id).

worker.py: Kuyruktaki işleri dinleyip asenkron analiz yapar, sonucu Redis'e yazar.

queue_manager.py: Redis ile iş ekleme, okuma ve güncelleme.

services/: (Face, emotion, gaze, scoring, frame sampling vs.) asıl analiz fonksiyonları.

models/: (Varsa) input/output model tanımları.

requirements.txt, Dockerfile: Bağımlılıklar ve servis container’ı.

voice_analyzer/ ve whisper_service/

Temelde benzer yapı ve akış, farklı analiz türleri.

2. Ana Backend (Node.js/TypeScript) – src/
   config/: Redis, Mongo, BullMQ ve ağırlıklar için konfigürasyon dosyaları.

models/: Mongoose modelleri, pipeline ve analiz adımlarının şemaları.

modules/services/: Her iş adımı için servis katmanı. (AI API ile konuşma, dosya indirme, GPT analizi vs.)

modules/worker/: Her pipeline adımı için BullMQ Worker (ör. faceAnalysis.worker.ts).

schedulers/:

faceAnalysisResultPoller.ts: Face analiz sonucu "waiting" durumunda polling ile kontrol edilir.

pipelineScheduler.ts: Pipeline adımlarının sırasını ve otomasyonunu yönetir.

monitor/queueDashboard.ts: Bull Board ile kuyruk monitoring dashboard’u.

3. Dosya Akışı ve İşleyiş
   Bir işin başından sonuna tipik yolculuğu:

Kullanıcı video yanıtı bırakır, VideoAnalysisPipelineJob Mongo'ya kaydedilir.

Her pipeline adımı için ilgili queue’ya iş atılır. (örn. video download, audio extract, face analysis ...)

Worker ilgili işlemi yapar veya dış bir AI servise (face_analyzer, voice_analyzer) isteği yollar.

Python AI servisi kuyruğa eklenen işi analiz eder, Redis’e sonucu yazar.

Node.js poller'ı sonucu belirli aralıklarla çekip pipeline’ı Mongo’da günceller.

En son tüm skorlar hesaplanır ve raporlanır.

4. Ortak Kaynaklar
   tmp/: Tüm geçici dosyalar (video, audio, transcript). Hem Node.js hem Python konteyneri tarafından erişilebilir.

docker-compose.yml: Bütün servislerin (Node, Python AI servisleri, Mongo, Redis) containerlarını yönetir.

README.md, docs/: Geliştiriciler için API örnekleri, teknik detaylar ve entegrasyon açıklamaları.

Dikkat Edilecek Teknik Detaylar
Kuyruk İsimleri:

Node.js tarafı ve Python servisleri arasında queue (veya Redis key) isimlerinin tutarlı olması çok önemli. Değiştirirsen, iki tarafta da güncelle!

Pipeline ve Kuyruk State’leri:

Bir iş BullMQ’da "completed" olabilir, ama pipeline’ın kendisi "waiting"de olabilir. Akışı Mongo ve pipeline state’lerinden izle.

Çevrimdışı/Asenkron Akış:

Özellikle AI analizleri (yüz/göz/duygu/voice) tamamlanana kadar beklenmez. Polling (scheduler) ile sonucu almak zorundasın.

Temporary Files:

Tüm medya ve output dosyaları /tmp altına yazılır. Dosya isimleri çoğunlukla UUID’li ve geçici. Temizliği unutma.

Python Servislerinin Ayrı Worker’ları:

Her mikroservisin worker.py gibi kendi Redis kuyruğunu çeken bir işçisi vardır; bunlar bağımsız container olarak ayakta tutulur.

Bull Board & Monitoring:

src/monitor/queueDashboard.ts ile BullMQ kuyrukları için canlı dashboard açılır. Pipeline ilerlemesini buradan değil, MongoDB’den takip et.

.env / environment variables:

Redis, Mongo, service endpointleri, path’ler vs. environment değişkenleriyle yönetilir.

Geliştiriciye Pratik Notlar
Yeni bir pipeline adımı/analiz ekleyeceksen:

Mongo pipeline schema’sını güncelle.

Node.js tarafında ilgili worker ve queue’yu tanımla.

AI servisinin endpointini ve kuyruğunu belirle.

Sonucu polling ve adım geçişine entegre et.

Konteyner başlatmadan önce:

Gerekli ağırlık dosyaları (AI modelleri) ve sistem bağımlılıklarının image’larda olduğuna emin ol.

Python ve Node konteynerlerinin aynı tmp klasörüne eriştiğinden emin ol (docker-compose ile mount!).

Hataları takip için:

Node.js ve Python worker loglarını ayrı ayrı izle.

Redis’te işleri manuel izlemek için redis-cli veya visual Redis UI’ları (örn. Medis, RedisInsight) kullanabilirsin.

Daha fazla örnek, fixture, API request veya debugging notu için docs/ dizinine bakmayı unutma!
