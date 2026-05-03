export const ROOM_COLORS = ["blue", "green", "purple", "amber", "red", "teal", "pink", "indigo"] as const;

export const ROOM_EMOJIS = ["📚", "💻", "🧮", "🔬", "📐", "🎓", "⚡", "🌐", "🧠", "🛠"] as const;

export const BATCHES = ["SP26-BS(SE)-AM", "SP26-BS(SE)-BM", "SP26-BS(CS)-AM", "FA25-BS(SE)-AM", "FA25-BS(CS)-AM"] as const;

export const DEPARTMENTS = [
  "Software Engineering",
  "Computer Science",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering"
] as const;

export const POST_TYPES = ["note", "deadline", "question", "resource", "announcement", "poll", "project"] as const;

export const POST_TYPE_CONFIG = {
  note: { label: "Note", emoji: "📝" },
  deadline: { label: "Deadline", emoji: "⏰" },
  question: { label: "Question", emoji: "❓" },
  resource: { label: "Resource", emoji: "🔗" },
  announcement: { label: "Announcement", emoji: "📢" },
  poll: { label: "Poll", emoji: "📊" },
  project: { label: "Project", emoji: "🚀" }
} as const;

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "😢"] as const;

export const ROOM_MENTION_AI = "@uniboardai";
