export async function generateCaption(prompt: string) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "caption",
      prompt,
    }),
  })

  const data = await res.json()
  return data.result
}

export async function analyzeEngagement(metrics: any) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "analyze",
      metrics,
    }),
  })

  const data = await res.json()
  return data.result
}
