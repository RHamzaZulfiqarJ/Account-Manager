import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

export async function generateCaption(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
You are a professional social media manager.
Create a high-engagement caption based on this input:

"${prompt}"

Include 3 relevant hashtags.
Keep it punchy and elegant.
    `,
    config: {
      temperature: 0.7,
      topP: 0.9,
    },
  })

  return response.text
}

export async function analyzeEngagement(metrics: any) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `
Analyze these social media metrics and provide 3 actionable insights:
${JSON.stringify(metrics)}
    `,
  })

  return response.text
}
