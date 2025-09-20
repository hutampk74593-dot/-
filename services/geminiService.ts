import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd want to handle this more gracefully,
  // but for this environment, throwing an error is fine.
  // The user won't see this; it's a build-time/runtime check.
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getFinancialTermDefinition = async (term: string): Promise<string> => {
  if (!API_KEY) {
     return Promise.reject("API 키가 설정되지 않았습니다. 애플리케이션 설정을 확인해주세요.");
  }

  try {
    const systemInstruction = `당신은 금융 용어 전문가입니다. 사용자가 입력한 금융 용어에 대해 한국어로 명확하고 이해하기 쉽게 설명해야 합니다. 금융을 처음 접하는 사람도 이해할 수 있도록 친절하게 설명해주세요. 답변은 마크다운 형식을 사용하여 가독성을 높여주세요 (예: 글머리 기호, **굵은 글씨**). 답변은 반드시 500자 이내로 요약해주세요.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: term,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching definition from Gemini API:", error);
    if (error instanceof Error) {
        return `API 호출 중 오류가 발생했습니다: ${error.message}`;
    }
    return "알 수 없는 오류가 발생하여 정의를 가져올 수 없습니다.";
  }
};