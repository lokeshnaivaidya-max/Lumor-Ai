import { NextResponse } from "next/server"
import { generateText } from "@/lib/ai/provider"
import { AiConfigError, AiBillingError, getAiErrorDiagnostic } from "@/lib/ai/provider"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  let body: {
    symbol: string
    buyPrice: number
    quantity: number
    budget: number
    target: number
    stopLoss: number
    holdingPeriod: string
    riskLevel?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { symbol, buyPrice, quantity, budget, target, stopLoss, holdingPeriod, riskLevel } = body
  if (!symbol || !buyPrice || !quantity) {
    return NextResponse.json({ error: "Symbol, buy price, and quantity are required." }, { status: 400 })
  }

  const investmentRequired = buyPrice * quantity
  const potentialProfit = target ? (target - buyPrice) * quantity : 0
  const potentialLoss = stopLoss ? (stopLoss - buyPrice) * quantity : 0
  const riskAmount = stopLoss ? (buyPrice - stopLoss) * quantity : 0
  const rewardAmount = target ? (target - buyPrice) * quantity : 0
  const riskRewardRatio = riskAmount > 0 && rewardAmount > 0 ? (rewardAmount / riskAmount).toFixed(2) : "—"
  const profitPercent = target ? (((target - buyPrice) / buyPrice) * 100).toFixed(2) : 0
  const lossPercent = stopLoss ? (((stopLoss - buyPrice) / buyPrice) * 100).toFixed(2) : 0

  try {
    const systemPrompt = `You are Lumora, a trusted trade planning assistant. Analyze the user's trade plan and provide a structured assessment in JSON format.

Output valid JSON with these fields:
- recommendation: "Buy" or "Wait"
- recommendationReason: short explanation string
- betterEntry: suggested better entry price as a string with currency symbol, or "Current price seems reasonable"
- investmentRequired: number (total cost)
- estimatedProfit: number (potential profit in currency)
- estimatedLoss: number (potential loss in currency)
- riskRewardRatio: string (e.g. "1:2.5")
- confidenceScore: number (0-100)
- probabilityOfProfit: number (0-100)
- probabilityOfLoss: number (0-100)
- suggestedTarget: string
- suggestedStopLoss: string
- beginnerExplanation: string (max 80 words, simple language)
- supportResistance: string (brief support/resistance levels based on price action)
- positionSizing: string (position sizing advice based on the risk level and budget)`

    const prompt = `Trade Plan Assessment:
- Symbol: ${symbol}
- Planned Buy Price: ${buyPrice}
- Quantity: ${quantity}
- Budget: ${budget}
- Target Price: ${target || "Not set"}
- Stop Loss: ${stopLoss || "Not set"}
- Holding Period: ${holdingPeriod}
- Risk Level: ${riskLevel || "Medium"}

Calculated Metrics:
- Investment Required: ${investmentRequired}
- Potential Profit: ${potentialProfit} (${profitPercent}%)
- Potential Loss: ${potentialLoss} (${lossPercent}%)
- Risk/Reward Ratio: 1:${riskRewardRatio}

Assess this trade plan. Is it a Buy or Wait opportunity? Provide a better entry suggestion if applicable. Give confidence score and probability estimates. Include a beginner-friendly explanation. Also include brief support/resistance levels and position sizing advice based on the ${riskLevel || "Medium"} risk level.`

    const res = await generateText({
      model: "gemini-2.0-flash-lite",
      system: systemPrompt,
      prompt,
      temperature: 0.3,
    })

    const text = res?.text?.trim()
    if (!text) throw new Error("Empty AI response")

    let aiResult
    try {
      aiResult = JSON.parse(text)
    } catch {
      aiResult = JSON.parse(text.replace(/```(?:json)?\s*/gi, "").trim())
    }

    return NextResponse.json({
      ...aiResult,
      investmentRequired,
      estimatedProfit: potentialProfit,
      estimatedLoss: potentialLoss,
      riskRewardRatio: `1:${riskRewardRatio}`,
    })
  } catch (err) {
    const message =
      err instanceof AiBillingError
        ? "AI analysis is temporarily unavailable — quota exhausted."
        : err instanceof AiConfigError
          ? "AI analysis is not configured. Add an OPENROUTER_API_KEY in Project Settings to enable it."
          : "AI analysis temporarily unavailable."
    console.error("[Trade Planner] AI error", getAiErrorDiagnostic(err))
    return NextResponse.json({
      recommendation: "Wait",
      recommendationReason: message,
      betterEntry: "—",
      investmentRequired,
      estimatedProfit: potentialProfit,
      estimatedLoss: potentialLoss,
      riskRewardRatio: `1:${riskRewardRatio}`,
      confidenceScore: 0,
      probabilityOfProfit: 0,
      probabilityOfLoss: 0,
      suggestedTarget: target ? `$${target}` : "—",
      suggestedStopLoss: stopLoss ? `$${stopLoss}` : "—",
      beginnerExplanation: "Unable to generate AI analysis right now. Please check the calculated metrics above and try again later.",
      supportResistance: "—",
      positionSizing: "—",
    })
  }
}
