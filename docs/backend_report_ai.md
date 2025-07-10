Uygulama-backend geliştiricisinin yapması gerekenler
(AI-backend ile tamamen bağımsız ama senkron çalışan mimari için kontrol listesi)

1. Veriyi toparla → payload’ı inşa et
   Kaynak Alan(lar) Not
   Application belgesi id, candidate.\* CV/PDF varsa URL olarak koy.
   Interview belgesi id, title, questions[] Her sorunun aiMetadata ve duration’ı dolu olmalı.
   VideoResponse belgesi videoResponseId, url URL, AI-backend’in HTTP GET ile erişebileceği yerde (S3, CloudFront, GDrive “uc?export=download” vb.).

Application, Interview ve VideoResponse’ları aynı aggregate/lookup ile çek.

Yukarıdaki tüm alanları tek JSON objesinde birleştir (önceki Postman örneği).

Büyük dosya kendisi değil, yalnızca indirilebilir URL’si gönderilmeli.

2. HTTP çağrısını yap
   bash
   Kopyala
   Düzenle
   POST $AI_BACKEND_URL/v1/analysis/video
   Headers:
   Authorization: Bearer <APP→AI JWT>
   Content-Type: application/json
   Body: { ...toplanan JSON... }
   JWT: HMAC-signed, kısa ömürlü (≤15 dk). AI-backend’e secret’ı ver.

Timeout: 10 sn’lik connect timeout + 30 sn body timeout yeterli.

Başarılı yanıt {"jobIds":[…]} döner.

3. Yanıtı sakla & statü takibi ayarla
   Yapılacak Nasıl?
   Job eşlemesini kaydet VideoResponse.jobId = response.jobIds[i].jobId alanı ekle.
   Başvuru statüsünü güncelle status = 'awaiting_ai_analysis'.
   Takip ① AI-backend’ten callback al (webhook), veya ② her 30 sn’de bir GET /analysis/video/:jobId ile poll et.
   Tamamlanınca Gelen skoru aiAnalysisResults listesine push et; latestAIAnalysisId set et; status = 'completed'.

4. Webhook (isteğe bağlı ama önerilir)
   ts
   Kopyala
   Düzenle
   // POST /webhooks/analysis-ready
   {
   jobId: "bull-987654",
   videoResponseId: "v1-6500…",
   status: "done",
   overallScore: 83,
   aiAnalysisId: "ai-6612…"
   }
   jobId ile kendi VideoResponse’unu bul.

VideoResponse statüsünü done/failed yap.

aiAnalysisId’yi Application belgesine ekle.

Güvenlik: HMAC-SHA256 signature header - X-Signature: hex(hmac(body, SHARED_SECRET))

5. Hata & retry stratejisi
   Durum Eylem
   POST 400 / 401 Logla, immediate fail. Kullanıcıya “analiz başlatılamadı” bildir.
   5xx / timeout 3 denemeye kadar exponential backoff (1 s, 4 s, 16 s).
   Callback’de status: failed VideoResponse’u analysis_failed, Application’u allowRetry = true yap. UI’de yeniden yüklet.

6. Çevresel değişkenler
   env
   Kopyala
   Düzenle
   AI_BACKEND_URL=https://ai-backend.example.com
   AI_BACKEND_SECRET=**_ # JWT imzalama
   AI_CALLBACK_SECRET=_** # AI->App webhook imzası
7. Versiyon uyumluluğu
   Her istek meta.apiVersion alanı ("1.0.0").

AI-backend 409 Conflict dönerse versiyon uyuşmazlığı var ⇒ hemen client güncelle.

8. Test & Postman koleksiyonu
   Postman’da ortam değişkenleri: {{AI_BACKEND_URL}}, {{JWT}}.

“Tests” sekmesinde:

js
Kopyala
Düzenle
pm.environment.set("jobId", pm.response.json().jobIds[0].jobId);
İkinci request:
GET {{AI_BACKEND_URL}}/v1/analysis/video/{{jobId}}

9. Loglama & İzleme
   Uygulama logu: requestId, jobId, applicationId ile korelasyon ID’leri tut.

Metric: başlatılan analiz/başarı-oranı, ortalama tamamlama süresi, hata sayısı.

Alert: 5 dk içinde callback gelmezse Slack uyarısı.

10. Özet akış
    mermaid
    Kopyala
    Düzenle
    sequenceDiagram
    participant FE
    participant AppAPI
    participant AIAPI
    participant AIMongo
    FE->>AppAPI: video upload + form
    AppAPI->>AIAPI: POST /analysis/video (payload)
    AIAPI->>AIMongo: job + payload kayıt
    AIAPI-->>AppAPI: jobIds[]
    AppAPI-->>FE: “Analiz başlatıldı”
    AIAPI->>AIMongo: pipeline çalıştır → sonuç
    AIAPI->>AppAPI: webhook /analysis-ready
    AppAPI->>FE: “Analiz tamamlandı, skor X”
    Bu adımları izleyerek App-backend geliştiricisi, AI-backend’i tamamen bağımsız bırakırken gerekli tüm verileri eksiksiz aktarır, statü takibini otomatize eder ve hata senaryolarını güvenle yönetir.
