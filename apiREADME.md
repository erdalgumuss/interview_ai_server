📦 Video Interview Application Pipeline – Developer Guide
Genel Bakış
Bu sistem, bir adayın video mülakat başvurusunu ve çok adımlı analiz sürecini modern, dağıtık ve scalable bir pipeline mimarisiyle yönetir.
Tüm iş akışı, başvurunun alınmasından video analizlerine kadar tam otomasyon ve yüksek gözlenebilirlik ile tasarlanmıştır.

Başvuru Süreci (API → Kuyruk)

1. API Endpoint
   Aday veya işveren tarafı, aşağıdaki JSON formatında /api/application-submissions endpoint’ine bir POST isteği gönderir:

http
Kopyala
Düzenle
POST /api/application-submissions
Content-Type: application/json

{
"applicationId": "...",
"interviewId": "...",
"candidate": { ... },
"personalityTest": { ... },
"interview": {
"title": "...",
"questions": [
{ "questionId": "...", "questionText": "...", ... },
...
]
},
"videoResponses": [
{
"videoResponseId": "...",
"questionId": "...",
"videoUrl": "https://...",
"aiAnalysis": null
},
...
]
} 2. Başvuru Kaydı (MongoDB)
API isteği, ApplicationSubmissionModel üzerinden MongoDB’ye tüm detaylarıyla kaydedilir.

Her başvuru, ilişkili tüm videoları ve soruları tek bir dokümanda barındırır.

3. Her Video için Pipeline Job Dispatch
   Kayıt tamamlanınca, sistem başvurudaki her video için bağımsız bir iş (job) oluşturur.

dispatchVideoAnalysisJobs fonksiyonu çağrılır:

Her video için:

applicationSubmissionId, videoResponseId, videoUrl, questionId, interviewId gibi bilgilerden bir payload hazırlanır.

Bu payload, BullMQ queue’suna (videoAnalysisQueue) ayrı bir job olarak eklenir.

4. Pipeline Status’un Başlatılması (Redis)
   Her job oluşturulurken:

Pipeline adımlarının (örn. video_downloaded, audio_extracted, transcribed, ...) tamamı ‘pending’ olarak başlatılır.

AI analizleri için ayrı bir status alanı (ai: {"gpt": "pending", "face": "pending", ...}) set edilir.

Statüler, Redis üzerinde videoAnalysisJob:<jobId> hash’i olarak tutulur.

5. API Yanıtı
   Başvuru başarıyla kaydedildiğinde, API şu bilgileri döner:

Başvurunun unique ID’si

Her video için: videoResponseId ve ilgili jobId eşleşmeleri

Başlangıç statüleri

json
Kopyala
Düzenle
{
"status": "success",
"message": "Başvuru başarıyla kaydedildi.",
"applicationSubmissionId": "...",
"dispatchedJobs": [
{ "jobId": "...", "videoResponseId": "..." },
...
],
"videoResponses": [
{ "videoResponseId": "...", "questionId": "...", "status": "pending" },
...
]
}
Pipeline Mimarisi – Kısa Akış Diyagramı
csharp
Kopyala
Düzenle
[API İsteği]
↓
[MongoDB’ye başvuru kaydı]
↓
[Her video için job dispatch]
↓
[Pipeline adımlarının Redis’te başlatılması]
↓
[Worker’lar adım adım işleri alır ve işler]
↓
[Her adımda status güncellenir, sonuçlar Mongo’ya yazılır]
Notlar & İyi Pratikler
Her video için ayrı job olduğundan, farklı sayıda video veya farklı pipeline adımları sorun yaratmaz.

Statü güncellemeleri yalnızca ilgili worker tarafından yapılır. Her job bağımsız çalışır.

Pipeline’ın devamında, status ve sonuç API’leri ile ilerleme ve analiz skorları kolayca çekilebilir.

Sıradaki Adımlar
Worker’ların her bir adım için nasıl çalıştığı (örn. video indirme, audio çıkarma, transkript, AI analiz, skor) ayrı başlık altında açıklanabilir.

Status ve sonuç endpointleri (Redis ve Mongo’dan), monitoring paneli entegrasyonu gibi konular ilerleyen rehberlerde yer alabilir.

Kısa Özet:
API’ye başvuru geldiği anda:

Mongo’ya kaydolur

Her video için job queue’ya eklenir

Pipeline statüleri Redis’te başlatılır

Worker’lar süreci adım adım işler

Her adımda güncel statü ile progress izlenebilir.
