import { NextResponse } from "next/server"
import { generateCaption, analyzeEngagement } from "@/libs/gemini"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (body.type === "caption") {
      const result = await generateCaption(body.prompt)
      return NextResponse.json({ result })
    }

    if (body.type === "analyze") {
      const result = await analyzeEngagement(body.metrics)
      return NextResponse.json({ result })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Gemini API error" },
      { status: 500 }
    )
  }
}
