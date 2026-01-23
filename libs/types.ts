// Domain models only (used across dashboard)

export interface Post {
  id: string
  content: string
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "tiktok"
  status: "scheduled" | "draft" | "sent" | "pending"
  scheduledTime: string
  imageUrl?: string
}

export interface Metric {
  label: string
  value: string
  change: number
  trend: "up" | "down"
}
