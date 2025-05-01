{
  "applicationId": "65fd32dcbacb7f3e60c81d0a",
  "interviewId": "65fd32dcbacb7f3e60c81d0b",
  "candidate": {
    "name": "Ali",
    "surname": "Kaya",
    "email": "ali.kaya@example.com",
    "phone": "+905554443322",
    "education": [
      {
        "school": "Boğaziçi Üniversitesi",
        "degree": "Bilgisayar Mühendisliği",
        "graduationYear": 2022
      }
    ],
    "experience": [
      {
        "company": "ABC Teknoloji",
        "position": "Frontend Developer",
        "duration": "2020 - 2023",
        "responsibilities": "React tabanlı dashboard geliştirme"
      }
    ],
    "skills": {
      "technical": ["JavaScript", "React", "TypeScript"],
      "personal": ["Takım Çalışması", "Problem Çözme"],
      "languages": [
        { "name": "İngilizce", "level": "C1" },
        { "name": "Almanca", "level": "A2" }
      ]
    },
    "documents": {
      "resume": "https://cdn.example.com/cv/ali_kaya.pdf",
      "certificates": ["https://cdn.example.com/cert/react_certificate.pdf"],
      "socialMediaLinks": [
        { "platform": "LinkedIn", "url": "https://linkedin.com/in/alikaya" },
        { "platform": "GitHub", "url": "https://github.com/alikaya" }
      ]
    }
  },
  "personalityTest": {
    "completed": true,
    "scores": {
      "openness": 78,
      "conscientiousness": 85,
      "extraversion": 62,
      "agreeableness": 73,
      "neuroticism": 40
    },
    "personalityFit": 82
  },
  "interview": {
    "title": "Senior Frontend Developer Mülakatı",
    "expirationDate": "2025-06-01T23:59:00.000Z",
    "stages": {
      "personalityTest": false,
      "questionnaire": true
    },
    "questions": [
      {
        "questionId": "65fd32dcbacb7f3e60c81aaa",
        "questionText": "React'te useEffect hook'u ne işe yarar?",
        "expectedAnswer": "Yan etkileri yönetmek için kullanılır...",
        "keywords": ["useEffect", "side effects", "lifecycle"],
        "order": 1,
        "duration": 120,
        "aiMetadata": {
          "complexityLevel": "medium",
          "requiredSkills": ["React", "Lifecycle"],
          "keywordMatchScore": 76
        }
      },
      {
        "questionId": "65fd32dcbacb7f3e60c81aab",
        "questionText": "JavaScript'te closure nedir?",
        "expectedAnswer": "Fonksiyon içinden dış kapsamın değişkenlerine erişimi...",
        "keywords": ["closure", "scope", "function"],
        "order": 2,
        "duration": 90,
        "aiMetadata": {
          "complexityLevel": "high",
          "requiredSkills": ["JavaScript", "Scope"],
          "keywordMatchScore": 64
        }
      }
    ]
  },
  "videoResponses": [
    {
      "videoResponseId": "663a0dceb7c4e9a0ff7c1111",
      "questionId": "65fd32dcbacb7f3e60c81aaa",
      "videoUrl": "https://cdn.example.com/videos/ali_q1.mp4",
      "aiAnalysis": {
        "transcriptionText": "React'te useEffect hook'u side effectleri yönetmek için kullanılır...",
        "overallScore": 82,
        "technicalSkillsScore": 85,
        "communicationScore": 78,
        "problemSolvingScore": 74,
        "personalityMatchScore": 80,
        "keywordMatches": ["useEffect", "side effect", "React"],
        "strengths": ["Net açıklama", "Konuşma temposu iyi"],
        "improvementAreas": [
          { "area": "Daha fazla örnek verilmesi", "recommendation": "Kod örneğiyle destekle" }
        ],
        "engagementScore": 0.75,
        "confidenceLevel": 0.82,
        "speechFluency": 88,
        "voiceConfidence": 91,
        "emotion": "Confident"
      }
    },
    {
      "videoResponseId": "663a0dceb7c4e9a0ff7c1222",
      "questionId": "65fd32dcbacb7f3e60c81aab",
      "videoUrl": "https://cdn.example.com/videos/ali_q2.mp4",
      "aiAnalysis": {
        "transcriptionText": "Closure, bir fonksiyonun dış kapsamdan veri tutmasını sağlar...",
        "overallScore": 79,
        "technicalSkillsScore": 80,
        "communicationScore": 76,
        "problemSolvingScore": 70,
        "personalityMatchScore": 77,
        "keywordMatches": ["closure", "scope", "function"],
        "strengths": ["Karmaşık konuyu sade anlatma"],
        "improvementAreas": [
          { "area": "Konuşma hızı", "recommendation": "Biraz daha yavaş ve net konuş" }
        ],
        "engagementScore": 0.72,
        "confidenceLevel": 0.79,
        "speechFluency": 83,
        "voiceConfidence": 87,
        "emotion": "Neutral"
      }
    }
  ]
}
