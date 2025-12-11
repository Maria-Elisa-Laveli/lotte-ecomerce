import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
console.log("🔑 API Key carregada:", process.env.GEMINI_API_KEY ? "SIM ✅" : "NÃO ❌");

const app = express();
app.use(express.json());
app.use(cors());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/cronograma", async (req, res) => {
  try {
    const respostas = req.body.respostas;

    const prompt = `
      Você é um especialista em cuidados capilares. 
      Com base nas respostas abaixo, monte um CRONOGRAMA CAPILAR de 4 semanas, em formato de TABELA HTML.
      Não use asteriscos (*). Evite textos longos, e deixe a resposta bem organizada e visual.
      Use tons suaves e títulos claros na tabela.

      Respostas:
      - Tipo de cabelo: ${respostas.tipo}
      - Principal necessidade: ${respostas.necessidade}
      - Possui química: ${respostas.quimica}
      - Frequência de lavagem: ${respostas.lavagem}
      - Objetivo do tratamento: ${respostas.objetivo}

      A tabela deve conter:
      - Colunas: Semana | Segunda | Quarta | Sexta | Domingo
      - Cada célula com o tipo de tratamento (Hidratação, Nutrição, Reconstrução)
      - Uma breve legenda abaixo da tabela explicando o foco de cada tipo.
      Responda apenas com HTML formatado.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const html = response.text();

    res.json({ cronograma: html });
  } catch (error) {
    console.error("Erro ao gerar cronograma:", error);
    res.status(500).json({ error: "Falha ao gerar cronograma" });
  }
});

app.listen(3000, () => console.log("✅ Servidor rodando em http://localhost:3000"));
