import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "OpenAI Codex";
pptx.company = "UniBoard AI";
pptx.subject = "UniBoard AI presentation";
pptx.title = "UniBoard AI";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Trebuchet MS",
  bodyFontFace: "Calibri",
  lang: "en-US"
};

const W = 13.33;
const H = 7.5;
const OUT = path.resolve("uniboard-ai-presentation.pptx");

const C = {
  bgDark: "0D1B2A",
  bgLight: "F0F4F8",
  blue: "3A86FF",
  green: "06D6A0",
  amber: "FFB703",
  purple: "A855F7",
  red: "EF4444",
  panel: "1E3048",
  white: "FFFFFF",
  darkHead: "0D1B2A",
  darkBody: "334155",
  lightBody: "CBD5E1",
  muted: "94A3B8",
  slate: "334155",
  line: "334155"
};

const SHADOW = { type: "outer", color: "000000", blur: 3, distance: 2, angle: 45, opacity: 0.25 };
const FONT_HEAD = "Trebuchet MS";
const FONT_BODY = "Calibri";

function addSlideBase(slide, title, dark) {
  slide.background = { color: dark ? C.bgDark : C.bgLight };
  slide.addText(title, {
    x: 1,
    y: 0.35,
    w: 11.33,
    h: 0.45,
    fontFace: FONT_HEAD,
    bold: true,
    fontSize: 38,
    color: dark ? C.white : C.darkHead,
    align: "center",
    valign: "mid",
    margin: 0,
    fit: "shrink"
  });
  slide.addShape(pptx.ShapeType.line, {
    x: (W - 1.2) / 2,
    y: 0.92,
    w: 1.2,
    h: 0,
    line: { color: C.blue, pt: 3 }
  });
}

function addBullet(slide, x, y, text, dark, w = 4.9, fs = 14) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y: y + 0.02,
    w: 0.18,
    h: 0.18,
    fill: { color: C.blue },
    line: { color: C.blue, pt: 1 }
  });
  slide.addText(text, {
    x: x + 0.28,
    y: y - 0.02,
    w,
    h: 0.34,
    fontFace: FONT_BODY,
    fontSize: fs,
    color: dark ? C.lightBody : C.darkBody,
    margin: 0,
    fit: "shrink"
  });
}

function statBox(slide, x, y, num, numColor, label) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 2.5,
    h: 1.1,
    rectRadius: 0.08,
    fill: { color: C.panel },
    line: { color: C.panel, pt: 1 },
    shadow: SHADOW
  });
  slide.addText(num, {
    x: x + 0.12,
    y: y + 0.08,
    w: 0.92,
    h: 0.48,
    fontFace: FONT_HEAD,
    bold: true,
    fontSize: 52,
    color: numColor,
    margin: 0,
    fit: "shrink"
  });
  slide.addText(label, {
    x: x + 1.06,
    y: y + 0.16,
    w: 1.26,
    h: 0.72,
    fontFace: FONT_BODY,
    fontSize: 11,
    color: C.lightBody,
    margin: 0.02,
    valign: "mid",
    fit: "shrink"
  });
}

function valueCard(slide, opts) {
  const { x, y, color, title, bullets, iconType } = opts;
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 3.5, h: 3.4,
    rectRadius: 0.08,
    fill: { color: "FFFFFF" },
    line: { color: C.blue, pt: 1.5 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.18, y: y + 0.22, w: 0.7, h: 0.7,
    fill: { color }, line: { color, pt: 1 }
  });
  if (iconType === "cap") {
    slide.addShape(pptx.ShapeType.chevron, {
      x: x + 0.25, y: y + 0.38, w: 0.56, h: 0.14, rotate: 270,
      fill: { color: C.white }, line: { color: C.white, pt: 1 }
    });
    slide.addShape(pptx.ShapeType.line, {
      x: x + 0.39, y: y + 0.55, w: 0.22, h: 0.08,
      line: { color: C.white, pt: 1.2 }
    });
  } else if (iconType === "bars") {
    [0.1, 0.2, 0.32].forEach((hx, i) => {
      slide.addShape(pptx.ShapeType.rect, {
        x: x + 0.28 + hx,
        y: y + 0.56 - i * 0.08,
        w: 0.07,
        h: 0.14 + i * 0.08,
        fill: { color: C.white },
        line: { color: C.white, pt: 0.5 }
      });
    });
  } else if (iconType === "bolt") {
    slide.addText("⚡", {
      x: x + 0.26, y: y + 0.3, w: 0.54, h: 0.36,
      fontFace: FONT_HEAD, bold: true, fontSize: 22, color: C.white, align: "center", margin: 0
    });
  }
  slide.addText(title, {
    x: x + 0.18, y: y + 1.02, w: 3.1, h: 0.28,
    fontFace: FONT_HEAD, bold: true, fontSize: 18, color: C.darkHead, margin: 0, fit: "shrink"
  });
  bullets.forEach((b, i) => {
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.18, y: y + 1.46 + i * 0.43, w: 0.14, h: 0.14,
      fill: { color: C.blue }, line: { color: C.blue, pt: 1 }
    });
    slide.addText(b, {
      x: x + 0.38, y: y + 1.39 + i * 0.43, w: 2.86, h: 0.26,
      fontFace: FONT_BODY, fontSize: 13, color: C.darkBody, margin: 0, fit: "shrink"
    });
  });
}

function featureCard(slide, { x, y, border, title, body, tag, iconText = "" }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.8, h: 1.7,
    rectRadius: 0.07,
    fill: { color: "FFFFFF" },
    line: { color: "D6DEE8", pt: 1 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w: 0.05, h: 1.7,
    fill: { color: border }, line: { color: border, pt: 0.5 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.18, y: y + 0.24, w: 0.5, h: 0.5,
    fill: { color: border }, line: { color: border, pt: 1 }
  });
  if (iconText) {
    slide.addText(iconText, {
      x: x + 0.18, y: y + 0.28, w: 0.5, h: 0.18,
      fontFace: FONT_HEAD, bold: true, fontSize: 16, color: C.white, align: "center", margin: 0
    });
  }
  slide.addText(title, {
    x: x + 0.8, y: y + 0.18, w: 3.8, h: 0.28,
    fontFace: FONT_HEAD, bold: true, fontSize: 16, color: C.darkHead, margin: 0, fit: "shrink"
  });
  slide.addText(body, {
    x: x + 0.8, y: y + 0.48, w: 4.6, h: 0.56,
    fontFace: FONT_BODY, fontSize: 12, color: C.darkBody, margin: 0, fit: "shrink"
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.8, y: y + 1.18, w: 1.7, h: 0.26,
    rectRadius: 0.12,
    fill: { color: "EFF6FF" },
    line: { color: border, pt: 1 }
  });
  slide.addText(tag, {
    x: x + 0.86, y: y + 1.205, w: 1.58, h: 0.16,
    fontFace: FONT_BODY, fontSize: 10, color: border, align: "center", margin: 0, fit: "shrink"
  });
}

function stepNode(slide, x, color, n, title, sub) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y: 2.5, w: 1.7, h: 1.9,
    rectRadius: 0.08,
    fill: { color: C.panel },
    line: { color: C.blue, pt: 1.5 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.6, y: 2.68, w: 0.5, h: 0.5,
    fill: { color }, line: { color, pt: 1 }
  });
  slide.addText(String(n), {
    x: x + 0.6, y: 2.81, w: 0.5, h: 0.16,
    fontFace: FONT_HEAD, bold: true, fontSize: 14, color: color === C.amber ? C.darkHead : C.white, align: "center", margin: 0
  });
  slide.addText(title, {
    x: x + 0.12, y: 3.28, w: 1.46, h: 0.38,
    fontFace: FONT_HEAD, bold: true, fontSize: 12, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
  slide.addText(sub, {
    x: x + 0.12, y: 3.7, w: 1.46, h: 0.52,
    fontFace: FONT_BODY, fontSize: 10, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
}

function stepStrip(slide, y, border, num, title, body) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y, w: 6.5, h: 0.75,
    rectRadius: 0.05, fill: { color: "FFFFFF" }, line: { color: "D6DEE8", pt: 1 }, shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5, y, w: 0.05, h: 0.75,
    fill: { color: border }, line: { color: border, pt: 0.5 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 0.66, y: y + 0.16, w: 0.42, h: 0.42,
    fill: { color: border }, line: { color: border, pt: 1 }
  });
  slide.addText(String(num), {
    x: 0.66, y: y + 0.255, w: 0.42, h: 0.12,
    fontFace: FONT_HEAD, bold: true, fontSize: 14, color: border === C.amber ? C.darkHead : C.white, align: "center", margin: 0
  });
  slide.addText(title, {
    x: 1.2, y: y + 0.14, w: 2.2, h: 0.18,
    fontFace: FONT_HEAD, bold: true, fontSize: 14, color: C.darkHead, margin: 0, fit: "shrink"
  });
  slide.addText(body, {
    x: 1.2, y: y + 0.38, w: 4.95, h: 0.18,
    fontFace: FONT_BODY, fontSize: 11, color: C.darkBody, margin: 0, fit: "shrink"
  });
}

function roadmapNode(slide, x, color, label, title, body, done = false, outlined = false) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y: 4.85, w: 0.5, h: 0.5,
    fill: { color: outlined ? C.panel : color, transparency: outlined ? 100 : 0 },
    line: { color: outlined ? color : color, pt: outlined ? 2 : 1 }
  });
  slide.addText(done ? "✓" : label, {
    x, y: 4.97, w: 0.5, h: 0.16,
    fontFace: FONT_HEAD, bold: true, fontSize: 14,
    color: done ? C.white : outlined ? color : C.white,
    align: "center", margin: 0
  });
  slide.addText(title, {
    x: x - 0.28, y: 5.45, w: 1.2, h: 0.18,
    fontFace: FONT_BODY, bold: true, fontSize: 11, color: done ? C.white : color, align: "center", margin: 0, fit: "shrink"
  });
  slide.addText(body, {
    x: x - 0.7, y: 5.67, w: 2.05, h: 0.44,
    fontFace: FONT_BODY, fontSize: 10, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
}

// Slide 1
{
  const s = pptx.addSlide();
  addSlideBase(s, "Academic Collaboration Is Broken", true);
  s.addText("The Problem", {
    x: 0.5, y: 1.48, w: 2.6, h: 0.28,
    fontFace: FONT_HEAD, bold: true, fontSize: 22, color: C.blue, margin: 0
  });
  statBox(s, 0.5, 1.9, "73%", C.amber, "of students say group projects lack clear structure");
  statBox(s, 0.5, 3.15, "60+", C.green, "tools used across a typical university ecosystem");
  statBox(s, 0.5, 4.4, "4.2hrs", C.blue, "wasted per student weekly chasing deadlines");
  [
    "No single space for discussion + files + deadlines",
    "Professors can't track struggling students in real time",
    "No AI guidance when students are stuck at 2 AM",
    "Knowledge from past semesters never reused"
  ].forEach((t, i) => addBullet(s, 0.55, 5.72 + i * 0.36, t, true, 5.2, 13));

  const cx = 9.73, cy = 3.7;
  s.addShape(pptx.ShapeType.ellipse, {
    x: cx - 0.35, y: cy - 0.35, w: 0.7, h: 0.7,
    fill: { color: C.panel }, line: { color: C.blue, pt: 1.5 }
  });
  s.addText("Student", {
    x: cx - 0.3, y: cy - 0.05, w: 0.6, h: 0.12, fontFace: FONT_BODY, fontSize: 11, color: C.white, align: "center", margin: 0
  });
  const nodes = [
    ["Email", 8.5, 1.6], ["WhatsApp", 10.05, 1.75], ["LMS", 11.25, 3.0],
    ["Drive", 10.55, 4.95], ["Notion", 8.5, 5.1], ["Zoom", 7.4, 3.0]
  ];
  nodes.forEach(([label, x, y]) => {
    s.addShape(pptx.ShapeType.line, {
      x: cx, y: cy, w: x - cx + 0.55, h: y - cy + 0.22, line: { color: C.blue, pt: 1.2, beginArrowType: "none", endArrowType: "triangle" }
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 1.1, h: 0.45, rectRadius: 0.05,
      fill: { color: C.slate }, line: { color: C.muted, pt: 1 }
    });
    s.addText(label, {
      x, y: y + 0.1, w: 1.1, h: 0.14, fontFace: FONT_BODY, fontSize: 11, color: C.white, align: "center", margin: 0
    });
  });
  s.addShape(pptx.ShapeType.line, {
    x: 7.45, y: 1.45, w: 4.8, h: 4.7,
    line: { color: C.red, pt: 10, transparency: 60 }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 12.25, y: 1.45, w: -4.8, h: 4.7,
    line: { color: C.red, pt: 10, transparency: 60 }
  });
  s.addText("Every student juggles 6+ disconnected tools. Nothing talks to anything.", {
    x: 6.95, y: 6.45, w: 5.7, h: 0.2, fontFace: FONT_BODY, italic: true, fontSize: 11, color: C.muted, align: "center", margin: 0
  });
}

// Slide 2
{
  const s = pptx.addSlide();
  addSlideBase(s, "Meet UniBoard AI", false);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 1.5, w: 11.3, h: 1.3, rectRadius: 0.09,
    fill: { color: C.bgDark }, line: { color: C.bgDark, pt: 1 }, shadow: SHADOW
  });
  s.addText("One intelligent platform where students collaborate, professors oversee, and AI assists — all in real time.", {
    x: 1.35, y: 1.87, w: 10.6, h: 0.5, fontFace: FONT_HEAD, bold: true, fontSize: 22, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
  valueCard(s, {
    x: 0.5, y: 3.1, color: C.blue, title: "For Students",
    bullets: ["AI writing assistant in every discussion", "Smart deadline reminders", "Searchable knowledge base", "Real-time group workspaces"],
    iconType: "cap"
  });
  valueCard(s, {
    x: 4.9, y: 3.1, color: C.green, title: "For Professors",
    bullets: ["Live engagement analytics per room", "AI-generated room summaries", "Deadline risk alerts", "One dashboard for all course rooms"],
    iconType: "bars"
  });
  valueCard(s, {
    x: 9.3, y: 3.1, color: C.amber, title: "For Institutions",
    bullets: ["Structured academic data not chat noise", "Institutional knowledge preserved", "No extra tool subscriptions", "Scales 10 to 10,000 students"],
    iconType: "bolt"
  });
  s.addText("Built on Convex (real-time backend) + Anthropic Claude AI (claude-sonnet-4-20250514)", {
    x: 1.2, y: 6.82, w: 10.9, h: 0.18, fontFace: FONT_BODY, italic: true, fontSize: 11, color: C.muted, align: "center", margin: 0
  });
}

// Slide 3
{
  const s = pptx.addSlide();
  addSlideBase(s, "How UniBoard AI Is Built", true);
  [["Students", 1.0], ["Professors", 3.55], ["Admin", 6.1]].forEach(([t, x]) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.8, w: 2.4, h: 0.7, rectRadius: 0.07, fill: { color: C.panel }, line: { color: C.blue, pt: 1.5 }, shadow: SHADOW
    });
    s.addText(t, {
      x, y: 2.05, w: 2.4, h: 0.14, fontFace: FONT_BODY, fontSize: 13, color: C.white, align: "center", margin: 0
    });
    s.addShape(pptx.ShapeType.line, {
      x: x + 1.2, y: 2.5, w: 0, h: 0.5, line: { color: C.blue, pt: 1.5, endArrowType: "triangle" }
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.65, y: 3.0, w: 10, h: 0.75, rectRadius: 0.07, fill: { color: C.panel }, line: { color: C.green, pt: 2 }, shadow: SHADOW
  });
  s.addText("Next.js / React Frontend — Responsive Web App (Desktop + Mobile)", {
    x: 1.9, y: 3.26, w: 9.5, h: 0.16, fontFace: FONT_BODY, fontSize: 14, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.line, {
    x: 6.65, y: 3.75, w: 0, h: 0.35, line: { color: C.green, pt: 2, endArrowType: "triangle" }
  });

  const back = [
    { x: 1.05, c: C.blue, h: "Convex", b: "Real-time DB + Sync\nWebSockets built-in\nInstant updates across all users" },
    { x: 4.4, c: C.amber, h: "Claude AI", b: "5 AI Features:\nAssistant · Composer\nSummarizer · Q&A · Risk Predictor" },
    { x: 7.75, c: C.green, h: "Auth + Storage", b: "Clerk Authentication\nSecure File Uploads\nRole-based Access" }
  ];
  back.forEach((b) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: b.x, y: 4.1, w: 3.1, h: 1.2, rectRadius: 0.08, fill: { color: C.panel }, line: { color: b.c, pt: 2 }, shadow: SHADOW
    });
    s.addText(b.h, {
      x: b.x + 0.15, y: 4.23, w: 2.8, h: 0.16, fontFace: FONT_HEAD, bold: true, fontSize: 14, color: b.c, margin: 0
    });
    s.addText(b.b, {
      x: b.x + 0.15, y: 4.5, w: 2.8, h: 0.56, fontFace: FONT_BODY, fontSize: 11, color: C.lightBody, margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.line, {
    x: 4.15, y: 4.7, w: 0.25, h: 0, line: { color: C.white, pt: 1.5, dash: "dash", beginArrowType: "triangle", endArrowType: "triangle" }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 7.5, y: 4.7, w: 0.25, h: 0, line: { color: C.white, pt: 1.5, dash: "dash", beginArrowType: "triangle", endArrowType: "triangle" }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 6.65, y: 5.3, w: 0, h: 0.4, line: { color: C.blue, pt: 1.5, endArrowType: "triangle" }
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.65, y: 5.7, w: 10, h: 0.6, rectRadius: 0.04, fill: { color: "0A1628" }, line: { color: C.muted, pt: 1, dash: "dash" }
  });
  s.addText("Convex Database (Real-time, Serverless) + Anthropic API (claude-sonnet-4-20250514)", {
    x: 1.95, y: 5.9, w: 9.4, h: 0.16, fontFace: FONT_BODY, fontSize: 12, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 11.3, y: 2.5, w: 1.53, h: 3.5, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  s.addText("Legend", { x: 11.48, y: 2.68, w: 1.1, h: 0.14, fontFace: FONT_BODY, fontSize: 11, color: C.muted, bold: true, margin: 0 });
  [
    [C.blue, "Blue = Data Flow"], [C.green, "Green = Core Layer"], [C.amber, "Yellow = AI Engine"], [C.white, "Dashed = External API"]
  ].forEach(([cc, txt], i) => {
    s.addShape(pptx.ShapeType.rect, { x: 11.45, y: 3.05 + i * 0.48, w: 0.14, h: 0.14, fill: { color: cc }, line: { color: cc, pt: 1 } });
    s.addText(txt, { x: 11.66, y: 3.02 + i * 0.48, w: 0.95, h: 0.18, fontFace: FONT_BODY, fontSize: 10, color: C.lightBody, margin: 0, fit: "shrink" });
  });
}

// Slide 4
{
  const s = pptx.addSlide();
  addSlideBase(s, "5 AI-Powered Capabilities", false);
  featureCard(s, { x: 0.5, y: 1.7, border: C.blue, title: "Conversational AI Assistant", body: "Claude answers student questions in real time within any course room. Context-aware, academic-focused.", tag: "Students · 24/7" });
  featureCard(s, { x: 7.0, y: 1.7, border: C.green, title: "Smart Composer", body: "AI drafts academic posts, announcements, and discussion replies. One click to polish any message.", tag: "Professors · Students", iconText: "✍" });
  featureCard(s, { x: 0.5, y: 3.55, border: C.amber, title: "Room Summarizer", body: "Instantly condenses long discussion threads into structured summaries. Never miss what was decided.", tag: "Professors · Admins" });
  featureCard(s, { x: 7.0, y: 3.55, border: C.purple, title: "Knowledge Base Q&A", body: "Students ask questions; AI searches the course knowledge base and returns cited answers instantly.", tag: "Students · Learning" });
  featureCard(s, { x: 0.5, y: 5.4, border: C.red, title: "Deadline Risk Predictor", body: "AI analyzes engagement patterns and flags students at risk of missing deadlines — before it happens.", tag: "Professors · Early Warning", iconText: "⚠" });
  featureCard(s, { x: 7.0, y: 5.4, border: C.muted, title: "Real-Time Collaboration", body: "Rooms sync instantly for all participants via Convex WebSockets. No refresh. No lag. Ever.", tag: "Platform Core", iconText: "⚡" });
}

// Slide 5
{
  const s = pptx.addSlide();
  addSlideBase(s, "End-to-End User Journey", true);
  const xs = [0.3, 2.35, 4.4, 6.45, 8.5, 10.55];
  const cols = [C.blue, C.green, C.amber, C.purple, C.red, C.green];
  const defs = [
    ["Sign Up / Log In", "Clerk Auth\nGmail / Email\n< 30 seconds"],
    ["Join a Course Room", "Invite link or\nroom code\nInstant access"],
    ["Post & Collaborate", "Start discussions\nUpload files\nTag teammates"],
    ["Ask the AI", "Type any question\nClaude responds\ninstantly in-room"],
    ["Professor Reviews", "AI summary ready\nDeadline risk flags\nEngagement chart"],
    ["Knowledge Grows", "Q&A saved to KB\nFuture students\nbenefit too"]
  ];
  xs.forEach((x, i) => {
    stepNode(s, x, cols[i], i + 1, defs[i][0], defs[i][1]);
    if (i < xs.length - 1) {
      s.addShape(pptx.ShapeType.rightArrow, {
        x: x + 1.78, y: 3.15, w: 0.45, h: 0.28,
        fill: { color: C.blue }, line: { color: C.blue, pt: 2 }
      });
    }
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 5.2, w: 4.5, h: 1.3, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, { x: 1.5, y: 5.2, w: 0.05, h: 1.3, fill: { color: C.blue }, line: { color: C.blue, pt: 0.5 } });
  s.addText("Student Path", { x: 1.68, y: 5.4, w: 1.5, h: 0.16, fontFace: FONT_BODY, bold: true, fontSize: 11, color: C.blue, margin: 0 });
  s.addText("Post question → AI Assistant answers → Smart Composer helps draft → Knowledge Base updated", {
    x: 1.68, y: 5.68, w: 4.05, h: 0.48, fontFace: FONT_BODY, fontSize: 11, color: C.lightBody, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.0, y: 5.2, w: 4.5, h: 1.3, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, { x: 7.0, y: 5.2, w: 0.05, h: 1.3, fill: { color: C.amber }, line: { color: C.amber, pt: 0.5 } });
  s.addText("Professor Path", { x: 7.18, y: 5.4, w: 1.7, h: 0.16, fontFace: FONT_BODY, bold: true, fontSize: 11, color: C.amber, margin: 0 });
  s.addText("Open dashboard → View AI Summary → Check Risk flags → Take action early", {
    x: 7.18, y: 5.68, w: 4.05, h: 0.48, fontFace: FONT_BODY, fontSize: 11, color: C.lightBody, margin: 0, fit: "shrink"
  });
}

// Slide 6
{
  const s = pptx.addSlide();
  addSlideBase(s, "Get Started in Under 5 Minutes", false);
  const stepYs = [1.6, 2.42, 3.24, 4.06, 4.88, 5.7];
  [
    [C.blue, 1, "Open the app", "Visit uniboard.ai in any browser — no install needed"],
    [C.green, 2, "Create your account", "Click Sign Up → university email → verified in seconds"],
    [C.amber, 3, "Join or create a room", "Enter professor's room code OR click New Room"],
    [C.purple, 4, "Post your first message", "Type in discussion box → hit Enter → classmates see instantly"],
    [C.red, 5, "Ask the AI anything", "Click Ask AI → type question → Claude answers in the room"],
    [C.bgDark, 6, "You're live!", "Explore: Smart Composer, Summaries, Knowledge Base"]
  ].forEach((v, i) => stepStrip(s, stepYs[i], v[0], v[1], v[2], v[3]));

  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.3, y: 1.5, w: 5.6, h: 5.5, rectRadius: 0.1, fill: { color: C.bgDark }, line: { color: C.bgDark, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, { x: 7.3, y: 1.5, w: 5.6, h: 0.35, fill: { color: C.panel }, line: { color: C.panel, pt: 1 } });
  [C.red, C.amber, C.green].forEach((cc, i) => {
    s.addShape(pptx.ShapeType.ellipse, { x: 7.48 + i * 0.19, y: 1.61, w: 0.12, h: 0.12, fill: { color: cc }, line: { color: cc, pt: 0.5 } });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.05, y: 1.58, w: 2.5, h: 0.18, rectRadius: 0.05, fill: { color: "0A1628" }, line: { color: "0A1628", pt: 1 }
  });
  s.addText("uniboard.ai", { x: 8.05, y: 1.615, w: 2.5, h: 0.08, fontFace: FONT_BODY, fontSize: 9, color: C.muted, align: "center", margin: 0 });
  s.addShape(pptx.ShapeType.rect, { x: 7.3, y: 1.85, w: 1.1, h: 5.15, fill: { color: C.panel }, line: { color: C.panel, pt: 1 } });
  s.addText("Rooms", { x: 7.48, y: 2.04, w: 0.55, h: 0.1, fontFace: FONT_BODY, fontSize: 9, color: C.muted, margin: 0 });
  s.addText("• CS 101", { x: 7.48, y: 2.32, w: 0.72, h: 0.1, fontFace: FONT_BODY, fontSize: 9, color: C.white, margin: 0 });
  s.addText("• Math 201", { x: 7.48, y: 2.56, w: 0.72, h: 0.1, fontFace: FONT_BODY, fontSize: 9, color: C.muted, margin: 0 });
  s.addText("+ New Room", { x: 7.48, y: 2.84, w: 0.76, h: 0.1, fontFace: FONT_BODY, fontSize: 9, color: C.blue, margin: 0 });
  s.addText("CS 101 — Discussion", { x: 8.62, y: 2.06, w: 2.4, h: 0.12, fontFace: FONT_BODY, bold: true, fontSize: 11, color: C.blue, margin: 0 });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.62, y: 2.55, w: 2.35, h: 0.5, rectRadius: 0.06, fill: { color: C.blue }, line: { color: C.blue, pt: 1 }
  });
  s.addText("Ahmed: Can someone explain Big-O?", {
    x: 8.76, y: 2.72, w: 2.0, h: 0.14, fontFace: FONT_BODY, fontSize: 9, color: C.white, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 9.05, y: 3.3, w: 2.85, h: 0.72, rectRadius: 0.06, fill: { color: C.green }, line: { color: C.green, pt: 1 }
  });
  s.addText("AI", {
    x: 9.18, y: 3.46, w: 0.24, h: 0.12, fontFace: FONT_HEAD, bold: true, fontSize: 9, color: C.darkHead, margin: 0
  });
  s.addText("Big-O describes worst-case complexity of an algorithm...", {
    x: 9.48, y: 3.46, w: 2.16, h: 0.18, fontFace: FONT_BODY, fontSize: 9, color: C.darkHead, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.62, y: 6.28, w: 3.7, h: 0.42, rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  s.addText("Ask AI or message the room…", {
    x: 8.82, y: 6.405, w: 2.6, h: 0.1, fontFace: FONT_BODY, fontSize: 9, color: C.muted, margin: 0
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: 11.9, y: 6.29, w: 0.38, h: 0.38, fill: { color: C.blue }, line: { color: C.blue, pt: 1 }
  });
  s.addText("➜", { x: 11.9, y: 6.37, w: 0.38, h: 0.1, fontFace: FONT_HEAD, bold: true, fontSize: 10, color: C.white, align: "center", margin: 0 });
  s.addText("Actual UniBoard AI interface — works in any browser", {
    x: 7.45, y: 7.02, w: 5.3, h: 0.14, fontFace: FONT_BODY, italic: true, fontSize: 11, color: C.muted, align: "center", margin: 0
  });
}

// Slide 7
{
  const s = pptx.addSlide();
  addSlideBase(s, "Impact & What's Next", true);
  const boxes = [
    [0.5, C.blue, "5 AI", "Fully integrated AI capabilities at launch"],
    [3.62, C.green, "<1s", "Real-time sync latency via Convex WebSockets"],
    [6.74, C.amber, "100%", "Browser-based — no installs, no friction"],
    [9.86, C.purple, "∞", "Knowledge base grows with every semester"]
  ];
  boxes.forEach(([x, c, num, label]) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.6, w: 2.9, h: 1.9, rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
    });
    s.addShape(pptx.ShapeType.rect, { x, y: 1.6, w: 2.9, h: 0.05, fill: { color: c }, line: { color: c, pt: 0.5 } });
    s.addText(num, {
      x, y: 2.05, w: 2.9, h: 0.52, fontFace: FONT_HEAD, bold: true, fontSize: 52, color: c, align: "center", margin: 0
    });
    s.addText(label, {
      x: x + 0.18, y: 2.82, w: 2.54, h: 0.42, fontFace: FONT_BODY, fontSize: 11, color: C.lightBody, align: "center", margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.line, { x: 0.5, y: 4.2, w: 12.3, h: 0, line: { color: C.line, pt: 1 } });
  s.addText("Roadmap", { x: 0.5, y: 4.4, w: 2.2, h: 0.24, fontFace: FONT_HEAD, bold: true, fontSize: 20, color: C.green, margin: 0 });
  s.addShape(pptx.ShapeType.line, { x: 0.5, y: 5.1, w: 12.3, h: 0, line: { color: C.line, pt: 1 } });
  roadmapNode(s, 1.2, C.green, "1", "v1.0 Launch", "Core rooms, 5 AI features, Auth", true, false);
  roadmapNode(s, 4.5, C.blue, "2", "v1.5 — Q3 2025", "Mobile app, Grade integration, LMS sync", false, false);
  roadmapNode(s, 7.9, C.amber, "3", "v2.0 — Q1 2026", "Multi-university, Analytics dashboard, API", false, true);
  roadmapNode(s, 11.3, C.purple, "4", "v3.0 — 2026", "AI grading assist, Institutional licensing", false, true);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 6.8, w: 12.3, h: 0.55, rectRadius: 0.06, fill: { color: C.blue }, line: { color: C.blue, pt: 1 }, shadow: SHADOW
  });
  s.addText("Try UniBoard AI today → uniboard.ai  |  Questions? hello@uniboard.ai", {
    x: 0.8, y: 6.97, w: 11.7, h: 0.16, fontFace: FONT_HEAD, bold: true, fontSize: 16, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
}

await pptx.writeFile({ fileName: OUT });

if (!fs.existsSync(OUT)) {
  throw new Error(`Presentation was not created: ${OUT}`);
}

console.log(`Created ${OUT}`);
