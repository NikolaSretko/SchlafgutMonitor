import { GoogleGenAI } from "@google/genai";
import { DashboardData } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeShopPerformance(data: DashboardData): Promise<string> {
    try {
      const model = this.ai.models;
      
      const prompt = `
        Du bist ein Assistent für den Shop-Manager von "schlafgut.com".
        Analysiere die HEUTIGE Leistung basierend auf diesen Daten:
        
        Tagesumsatz: ${data.dailyRevenue.toFixed(2)} EUR
        Bestellungen heute: ${data.totalOrders}
        Ø Warenkorb heute: ${data.averageBasket.toFixed(2)} EUR
        Details der letzten Bestellungen: ${JSON.stringify(data.recentOrders.map(o => ({ time: o.orderDateTime, total: o.amountTotal, status: o.stateMachineState.name })))}

        Gib 1 oder 2 sehr kurze, prägnante Sätze auf Deutsch darüber ab, wie der Tag für "schlafgut.com" läuft.
        Wenn der Umsatz über 30.000 EUR liegt, reagiere sehr begeistert und beeindruckt! Verwende Emojis.
      `;

      const response = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Analysiere aktuellen Trend...";
    } catch (error) {
      console.error("Gemini Analysis Failed", error);
      return "KI macht gerade Pause.";
    }
  }
}