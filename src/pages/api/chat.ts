import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { PROMPT_STEP1 } from "@/constant/prompt/generate-plan-step1";
import { PROMPT_STEP2 } from "@/constant/prompt/generate-plan-step2";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, step } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  // step에 따른 system prompt 설정
  let systemPrompt = "";
  if (step === "summary") {
    systemPrompt = PROMPT_STEP1;
  } else if (step === "details") {
    systemPrompt = PROMPT_STEP2;
  } else {
    systemPrompt =
      "당신은 여행 계획 전문가입니다. 사용자의 취향에 맞는 맞춤형 여행 계획을 JSON 형식으로 생성해주세요.";
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      // JSON 모드: 구문상 유효한 JSON 출력을 보장 (깨진 JSON 근본 차단).
      // 모든 step의 프롬프트가 "JSON" 출력을 명시하므로 요구사항 충족.
      response_format: { type: "json_object" },
      max_tokens: 7000,
      temperature: 0.6,
      top_p: 0.9,
      // frequency/presence penalty 제거: JSON은 키·따옴표·괄호가 반복되는
      // 구조라 penalty가 그 반복 토큰을 억제 → 따옴표 누락·구조 붕괴를 유발.
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const response = completion.choices[0]?.message?.content || "";

    return res.status(200).json({ response });
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}