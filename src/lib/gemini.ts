/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";

// FIXED: Vite apps must use import.meta.env
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
});

export async function analyzeMentalState(text: string) {
  const sentences = text
    .split("\n")
    .filter((s) => s.trim().length > 0);

  if (sentences.length === 0) return [];

  try {
    const response = await ai.models.generateContent({
      // FIXED: valid stable Gemini model
      model: "gemini-2.5-flash",

      contents: `Analyze the following sentences for emotional content. 
    For each sentence, provide the predicted emotion (sadness, joy, love, anger, fear, surprise) 
    as it might be classified by three different Transformer models: RoBERTa, DistilBERT, and ELECTRA.
    Provide slight variations between models to reflect different biases, but keep them generally consistent with the sentiment of the text.
    
    Sentences to analyze:
    ${sentences.join("\n")}`,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,

          properties: {
            analyses: {
              type: Type.ARRAY,

              items: {
                type: Type.OBJECT,

                properties: {
                  sentence: { type: Type.STRING },

                  roberta: {
                    type: Type.STRING,
                    description: "Predicted emotion label",
                  },

                  distilbert: {
                    type: Type.STRING,
                    description: "Predicted emotion label",
                  },

                  electra: {
                    type: Type.STRING,
                    description: "Predicted emotion label",
                  },

                  confidence: {
                    type: Type.OBJECT,

                    properties: {
                      roberta: { type: Type.NUMBER },

                      distilbert: { type: Type.NUMBER },

                      electra: { type: Type.NUMBER },
                    },

                    required: [
                      "roberta",
                      "distilbert",
                      "electra",
                    ],
                  },
                },

                required: [
                  "sentence",
                  "roberta",
                  "distilbert",
                  "electra",
                  "confidence",
                ],
              },
            },
          },

          required: ["analyses"],
        },
      },
    });

    try {
      const data = JSON.parse(response.text || '{"analyses": []}');
      return data.analyses;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error);
      return [];
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
}