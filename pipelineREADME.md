Video Analiz Pipeline – Geliştirici Rehberi
Genel Mimarinin Özeti
Bu sistemde bir başvuruya ait tüm videolar için, her biri bağımsız şekilde işleyen dağıtık bir analiz pipeline’ı tasarlanmıştır.
Node.js servisleri, başvuru yönetimi ve ana pipeline’ın çoğunu üstlenir.
Bazı adımlar ise bağımsız Python AI servislerine delege edilir (ör: Face & Voice analizi).
Tüm adımların senkronizasyonu için Redis (BullMQ + custom polling), ana veri kaydı için MongoDB kullanılır.

Pipeline’ın Adım Adım Akışı
Başvuru Kaydı (API Endpoint)

/api/application-submissions endpoint’i ile başvuru ve ilişkili video listesi MongoDB’ye kaydedilir.

Her video için pipeline başlatılır; Redis’te her biri için job açılır.

Job Dispatch

Her video için:

Bağlantılı bilgileri (videoId, questionId, videoUrl, vs.) içeren bir job Redis kuyruğuna eklenir.

Redis’te pipeline status ve AI step flag’leri başlatılır (queued, pending, vs.).

Worker Adımları

Her worker tek bir adım için sorumludur! (Aşağıda “worker” bir process/service demektir.)

Worker adım mantığı:

Kendisini ilgilendiren işleri Redis’ten polling ile çeker (getJobsToX fonksiyonları).

İşi işler (örn: video indir, audio çıkar, transcript al…).

Sonucu kaydeder (markX fonksiyonları) ve status günceller.

Sıradaki işçiye iş bırakır.

Node.js Worker’ları

videoDownloadWorker – video dosyasını indirir.

audioExtractorWorker – videodan sesi çıkarır.

transcriptionWorker – ses dosyasından transcript üretir (örn. Whisper, OpenAI).

inputNormalizerWorker – transcript ve metadata’yı normalize eder, AI analizine hazırlar.

aiAnalysisWorker – Bu adımda “fork” olur:

GPT (Node.js veya Python)

Face ve Voice analizleri için Python servisleri devreye girer.

Python servisleri de Redis’i polling yaparak yeni iş arar ve sonuçları MongoDB’ye/Redis’e yazar!

scoreCalculatorWorker – Sonuçlardan skorları hesaplar.

resultSaverWorker – Tüm analizleri MongoDB’ye kaydeder, status günceller.

cleanupWorker – Geçici dosyaları ve pipeline artıkları temizler.

Python AI Servisleri (Face, Voice, Duygu, vs.)

Tamamen bağımsız servislerdir.

Ortak Redis kuyruğunu polling ile dinler: Kendi adımına ait iş bulursa işler (örn: yeni videoPath gelmişse, yüz analizi yapar).

Sonucu MongoDB’de ilgili videoResponse’ın içine veya ayrı bir koleksiyona kaydeder.

Durumu yine Redis’te kendi step flag’ini “in_progress” → “completed”/”failed” olarak günceller.

Hatalı bir işte pipeline “failed” olarak işaretlenir ve sonraki adımlar durur.

Durum İzleme ve Kontrol

Her job için status ve adım adım ilerleme, Redis’ten videoAnalysisJob:JOBID hash’i ile izlenir.

Geliştiriciler veya client, status endpoint’i ile pipeline’ın anlık adımını görebilir.

Tam analiz ve sonuçlar ise MongoDB’den çekilir.

Senaryo Örneği (Step-by-Step)
Başvuru yapıldı:

POST → applicationSubmission

Mongo’ya kayıt → videoResponses array’inde videolar listelendi.

Her video için birer iş pipeline’a dispatch edildi.

Video indirildi:

videoDownloadWorker iş buldu, indirdi, status “video_downloaded”.

Sonraki işçi (audioExtractor) kuyruğu kontrol ediyor.

Audio çıkarıldı:

audioExtractorWorker aldı, audioPath üretti, status “audio_extracted”.

Transcript çıkarıldı:

transcriptionWorker aldı, transcript üretti, status “audio_transcribed”.

Normalize edildi:

inputNormalizerWorker aldı, normalize etti, status “input_normalized”.

AI Analizleri:

aiAnalysisWorker status “running_ai_analyses”.

Python face/voice servisleri kendi adımlarında iş bulursa işliyor ve statuslerini güncelliyor.

Skor hesaplandı:

scoreCalculatorWorker AI analizler tamamlandıktan sonra overall/communication score hesapladı.

Sonuç kaydedildi:

resultSaverWorker Mongo’da ilgili videoResponse objesine tüm analiz ve skorları yazdı.

Cleanup:

cleanupWorker geçici dosyaları temizledi, işin “cleaned” statusunu yazdı.

Hata ve Durdurma Prensipleri
Her worker sadece kendi işini yapar, asla başka adımı tetiklemez.

Hata durumunda job status “failed” yapılır, neden Redis/Mongo’ya yazılır.

İsteyen adım yeniden denenebilir veya manuel olarak recovery yapılabilir.

Node.js ve Python Worker Entegrasyonu
Python servisleri (örn. face_analyzer, voice_analyzer)

Kendi polling worker kodunu yazar (Redis bağlantılarını, status okuma/yazma helper’larını paylaşır).

Ortak MongoDB modelini kullanır veya uyumlu bir şekilde günceller.

Sonuçlar ortak pipeline’a geri döner, diğer adımlar bu bilgiyi kullanır.

Bu sayede farklı dilde çalışan AI worker’lar pipeline’a kolayca entegre olur, hepsi aynı iş listesini görüp status güncelleyebilir.

Geliştirici İçin Pratikler
Yazılımı modüler tutun: Her iş adımı kendi worker’ında tek bir sorumluluk.

Status helper’larını (jobStatusHelpers) paylaşın: Hem Node.js hem Python tarafı aynı Redis schema ile konuşur.

Veri akışını her adımda Mongo’ya ve Redis’e eksiksiz kaydedin.

Her adımda log bırakın, gerekirse alert ve metric sistemlerine bağlayın.

Bir adımda hata varsa, pipeline durur, sonraki işçiler o işi görmez.

Kod ve Servis Akışını Gözünüzde Canlandırın
css
Kopyala
Düzenle
Başvuru → (Her video için job) → [Video Indir] → [Audio Çıkar] → [Transcript] → [Normalize] → [AI Analiz (GPT, Face, Voice)] → [Skorla] → [Kaydet] → [Temizle]
Her adım izole, tekrar denenebilir, başka servislere dağıtılabilir, kendi statüsünü ve çıktısını hem Redis’te hem Mongo’da bırakır.
Ekstra AI step eklemek isterseniz, yeni bir worker/service eklemeniz yeterli!
