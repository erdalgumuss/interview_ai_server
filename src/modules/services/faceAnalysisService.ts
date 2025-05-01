export const analyzeFaceAndGestures = async (videoPath: string): Promise<{
    engagementScore: number;
    confidenceScore: number;
    emotionLabel: string;
  }> => {
  
    console.log('🎭 Mocking face analysis for video:', videoPath);
  
    // Mock skorlar (test amaçlı)
    return {
      engagementScore: 82,
      confidenceScore: 75,
      emotionLabel: 'Confident',
    };
  };
  