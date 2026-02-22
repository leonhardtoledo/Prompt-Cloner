import { GoogleGenAI } from "@google/genai";

export async function analyzeImage(base64Image: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Analise esta imagem detalhadamente para criar um "prompt de clonagem" perfeito. 
  Sua tarefa é descrever cada aspecto técnico e visual para que outra IA possa recriar esta imagem com precisão máxima.
  
  O resultado deve ser estruturado da seguinte forma:
  
  ### 🚀 Prompt de Clonagem (Inglês)
  [Um prompt altamente detalhado em inglês, otimizado para Midjourney, Stable Diffusion ou DALL-E 3]
  
  ### 🔍 Análise de Detalhes (Português)
  - **Sujeito:** Detalhes físicos, expressão, pose.
  - **Estilo:** Técnica artística ou fotográfica.
  - **Iluminação:** Atmosfera e fontes de luz.
  - **Composição:** Enquadramento e profundidade.
  - **Cores:** Paleta e saturação.
  
  Seja extremamente específico. Se houver um rosto, descreva traços únicos. Se houver um corpo, descreva a anatomia e vestimenta.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType } },
        { text: prompt }
      ]
    }
  });

  return response.text;
}
