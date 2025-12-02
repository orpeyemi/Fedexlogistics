import { GoogleGenAI, Type } from "@google/genai";
import { ShipmentStatus } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Function to generate a polite, professional status update message
export const generateStatusMessage = async (
  status: string,
  location: string,
  details: string
): Promise<string> => {
  if (!ai) return `${status} at ${location}. ${details}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, professional, and reassuring logistics status update sentence for a customer tracking their package.
      Current Status: ${status}
      Location: ${location}
      Context/Details: ${details}
      
      Keep it under 20 words. Do not include quotes.`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return `${status} at ${location}. ${details}`;
  }
};

// Function to parse unstructured text into structured shipment data
export const parseManifest = async (text: string): Promise<any[]> => {
  if (!ai) {
    throw new Error("AI API Key not configured.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following logistics manifest text into a JSON array of shipment objects.
      
      Text to parse:
      "${text}"
      
      Extract: sender, recipient, origin, destination, trackingNumber (if present, else generate a placeholder), currentStatus (infer from text, default to Created).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sender: { type: Type.STRING },
              recipient: { type: Type.STRING },
              origin: { type: Type.STRING },
              destination: { type: Type.STRING },
              trackingNumber: { type: Type.STRING },
              status: { type: Type.STRING }, // will map to enum later
              estimatedDeliveryDays: { type: Type.NUMBER, description: "Estimated days until delivery" }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Manifest Parse Error:", error);
    throw error;
  }
};

export const getSmartActionSuggestion = async (status: ShipmentStatus): Promise<string> => {
    if (!ai) return "";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Given the logistics status "${status}", suggest a very short (3-5 words) immediate next action for the logistics manager.`
        });
        return response.text.trim();
    } catch (e) {
        return "";
    }
}

export const getChatResponse = async (history: {role: 'user' | 'model', text: string}[], message: string): Promise<string> => {
  if (!ai) return "I'm sorry, my AI brain is currently offline. Please try again later.";
  
  try {
    // Construct a simple chat history string or use the proper chat API
    // For simplicity with this structure, we'll use generateContent with system instruction context
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: "You are a helpful, professional, and friendly customer support assistant for FedEx Logistics. You help users understand shipping terms, track packages (ask them to use the search bar on the page if they give a number, as you don't have direct database access), and provide general shipping advice. Keep answers concise.",
      }
    });

    // Replay history (simplified)
    for (const turn of history) {
       // In a real implementation, we would append to history properly. 
       // Here we are just starting a fresh chat turn for the demo or assuming stateless for simplicity if history is managed externally.
       // However, to keep context:
       if (turn.role === 'user') {
         await chat.sendMessage({ message: turn.text });
       }
    }
    
    const result = await chat.sendMessage({ message: message });
    return result.text.trim();
  } catch (e) {
    console.error(e);
    return "I'm having trouble connecting to the server. Please try again.";
  }
}