import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function generateStudyNotes(topic: string, detailLevel: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate detailed study notes for the topic: "${topic}". 
      Detail level: ${detailLevel}. 
      Format the output in clean Markdown with sections like "Introduction", "Key Concepts", "Detailed Explanation", and "Summary".`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating notes:", error);
    return "Failed to generate notes. Please try again later.";
  }
}

export async function analyzeIncidentSeverity(description: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Analyze the following incident report for a college campus: "${description}".
      Determine the severity level: LOW, MEDIUM, or HIGH.
      Provide a brief reasoning and recommended immediate action.
      Return the response in JSON format with keys: "severity", "reasoning", "action".`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing severity:", error);
    return { severity: "UNKNOWN", reasoning: "Analysis failed.", action: "Contact security manually." };
  }
}
