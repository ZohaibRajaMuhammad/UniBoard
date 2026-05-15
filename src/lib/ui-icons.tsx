import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  BadgeHelp,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  BriefcaseBusiness,
  Database,
  Flame,
  FlaskConical,
  FolderKanban,
  Globe2,
  GraduationCap,
  HandHelping,
  Heart,
  Laptop2,
  Link2,
  Megaphone,
  PencilLine,
  Ruler,
  Smile,
  Sparkles,
  ThumbsUp,
  Wrench,
  Zap
} from "lucide-react";

export const ROOM_ICON_OPTIONS = [
  { value: "book-open", label: "Course", icon: BookOpen },
  { value: "laptop", label: "Engineering", icon: Laptop2 },
  { value: "brain", label: "Research", icon: Brain },
  { value: "flask", label: "Lab", icon: FlaskConical },
  { value: "ruler", label: "Design", icon: Ruler },
  { value: "graduation-cap", label: "Academics", icon: GraduationCap },
  { value: "zap", label: "Systems", icon: Zap },
  { value: "globe", label: "Network", icon: Globe2 },
  { value: "wrench", label: "Build", icon: Wrench },
  { value: "database", label: "Data", icon: Database }
] as const;

const ROOM_ICON_ALIASES: Record<string, string> = {
  "📚": "book-open",
  "💻": "laptop",
  "🧮": "brain",
  "🔬": "flask",
  "📐": "ruler",
  "🎓": "graduation-cap",
  "⚡": "zap",
  "🌐": "globe",
  "🧠": "brain",
  "🛠": "wrench",
  AI: "bot",
  SD: "ruler",
  DB: "database",
  FY: "folder-kanban"
};

const EXTRA_ROOM_ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  "folder-kanban": FolderKanban
};

export function getRoomIcon(value?: string | null): LucideIcon {
  const normalized = value ? ROOM_ICON_ALIASES[value] ?? value : ROOM_ICON_OPTIONS[0].value;
  const option = ROOM_ICON_OPTIONS.find((item) => item.value === normalized);
  if (option) {
    return option.icon;
  }
  return EXTRA_ROOM_ICONS[normalized ?? ""] ?? BookOpen;
}

export function getPostTypeIcon(type: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    note: PencilLine,
    deadline: AlarmClock,
    question: BadgeHelp,
    resource: Link2,
    announcement: Megaphone,
    poll: BarChart3,
    project: BriefcaseBusiness
  };

  return map[type] ?? PencilLine;
}

export const REACTION_OPTIONS = [
  { value: "👍", label: "Support", icon: ThumbsUp },
  { value: "❤️", label: "Appreciate", icon: Heart },
  { value: "😂", label: "Light", icon: Smile },
  { value: "🔥", label: "Strong", icon: Flame },
  { value: "😮", label: "Insightful", icon: Sparkles },
  { value: "😢", label: "Concern", icon: HandHelping }
] as const;

export function getReactionIcon(value: string): LucideIcon {
  return REACTION_OPTIONS.find((item) => item.value === value)?.icon ?? ThumbsUp;
}
