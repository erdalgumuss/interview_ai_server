FROM python:3.10-slim

WORKDIR /app

# Gereksiz dosyalar yoksa, sadece gerekli dosyaları kopyalamak daha hızlı olur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Her servisin portunu compose’dan ayarlayacağımız için burada default’u 8001, 8002, 8003 ayarlayacağız
# main.py içinde app'in portunu dışarıdan alacak şekilde yaparsan daha dinamik olur

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
