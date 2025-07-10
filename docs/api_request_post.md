{
  "meta": {
    "apiVersion": "1.0.0",
    "requestId": "d1e54c93-8fd0-4c4f-9a2f-14d4e6f2c7ab",
    "callbackUrl": "https://app-backend.example.com/webhooks/analysis-ready",
    "timestamp": "2025-07-10T12:34:56Z"
  },
  "application": {
    "id": "app-64fe4ec920e1",
    "candidate": {
      "name": "Ayşe",
      "surname": "Yılmaz",
      "email": "ayse@example.com",
      "education": [
        { "school": "ODTÜ", "degree": "BS CS", "graduationYear": 2024 }
      ],
      "experience": [
        { "company": "ABC", "position": "Frontend Dev", "duration": "1y" }
      ],
      "skills": {
        "technical": ["React", "TypeScript"],
        "personal": ["team-player"],
        "languages": ["tr", "en"]
      }
    }
  },
  "interview": {
    "id": "int-64ab1d7e80c1",
    "title": "Frontend Engineer – Level 1",
    "questions": [
      {
        "id": "q1-64ab1db2b0b3",
        "order": 1,
        "duration": 90,
        "questionText": "Takım içi çatışmayı nasıl yönetirsiniz?",
        "expectedAnswer": "Açık iletişim, aktif dinleme ve ortak hedef vurgusu...",
        "keywords": ["çatışma", "iletişim", "liderlik"],
        "aiMetadata": {
          "complexityLevel": "medium",
          "requiredSkills": ["communication", "leadership"]
        },
        "video": {
          "videoResponseId": "v1-6500aa12f32b",
          "url": "https://storage.example.com/videos/ayse_q1.mp4"
        }
      },
      {
        "id": "q2-64ab1dd4c1f0",
        "order": 2,
        "duration": 60,
        "questionText": "Son projende karşılaştığın en büyük teknik zorluk neydi?",
        "expectedAnswer": "Ölçeklenebilirlik problemi...",
        "keywords": ["ölçeklenebilirlik", "performans"],
        "aiMetadata": {
          "complexityLevel": "high",
          "requiredSkills": ["architecture", "problem-solving"]
        },
        "video": {
          "videoResponseId": "v2-6500aa33dac1",
          "url": "https://storage.example.com/videos/ayse_q2.mp4"
        }
      }
    ]
  }
}
