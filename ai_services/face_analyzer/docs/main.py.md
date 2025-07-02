main.py Geliştirici Notu & Özeti
Amaç
Bu dosya, FastAPI tabanlı Face Analyzer servisinin ana uygulama başlatıcısıdır.

Sistemin yalın, sürdürülebilir, kolay genişletilebilir bir çekirdek API yapısı olması hedeflenmiştir.

İşlevler
FastAPI uygulamasını başlatır.

Yüz analiziyle ilgili tüm endpointleri /face prefix’i ile dışarıya açar.

Docker veya benzeri container ortamlarında health check için /health endpointi sağlar.

MVP Felsefesi
Gereksiz kod, değişken veya konfigürasyon barındırmaz.

Tüm iş mantığı modüllere ayrılarak, test edilebilirlik ve sürdürülebilirlik amaçlanmıştır.

Kodun kendisi hem production, hem local development ortamında değişiklik gerektirmeden çalışır.

Geliştiriciye Notlar
Production ortamında CORS, logging, environment variable gibi eklemeler gerekebilir (örnek kodda belirtilmiştir).

Servis ölçeklenecekse, Uvicorn parametreleri veya reverse proxy ile yük dengesi ayarlanmalıdır.

Ortam değişkenleri için .env veya config.py benzeri bir çözüm ileride projeye eklenebilir.

Yeni endpoint ekleyecekseniz, ilgili router’ı ayrı dosyada tanımlayıp burada include edin.

