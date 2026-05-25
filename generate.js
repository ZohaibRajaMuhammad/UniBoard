const fs = require("node:fs");
const path = require("node:path");
const PptxGenJS = require("pptxgenjs");

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

const OUT = path.resolve("uniboard-ai-presentation.pptx");
const W = 13.33;

const C = {
  bgDark: "0D1B2A",
  bgLight: "F0F4F8",
  blue: "3A86FF",
  green: "06D6A0",
  amber: "FFB703",
  purple: "A855F7",
  red: "EF4444",
  panel: "1E3048",
  darkPanelDeep: "0A1628",
  white: "FFFFFF",
  textDark: "FFFFFF",
  bodyDark: "CBD5E1",
  textLight: "0D1B2A",
  bodyLight: "334155",
  muted: "94A3B8",
  slate: "334155"
};

const SHADOW = { type: "outer", blur: 3, offset: 2, angle: 45, color: "000000", opacity: 0.25 };

function addTitle(slide, title, dark) {
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 12.3,
    h: 0.7,
    fontFace: "Trebuchet MS",
    fontSize: 38,
    bold: true,
    align: "center",
    margin: 0,
    color: dark ? C.textDark : C.textLight,
    fit: "shrink"
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 6.07,
    y: 1.1,
    w: 1.2,
    h: 0,
    line: { color: C.blue, pt: 3 }
  });
}

function addBulletRow(slide, x, y, text, dark, w) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y: y + 0.03,
    w: 0.3,
    h: 0.3,
    fill: { color: C.blue },
    line: { color: C.blue, pt: 1 }
  });
  slide.addText(text, {
    x: x + 0.42,
    y,
    w,
    h: 0.34,
    fontFace: "Calibri",
    fontSize: 12,
    color: dark ? C.bodyDark : C.bodyLight,
    margin: 0,
    fit: "shrink"
  });
}

function statCard(slide, x, y, number, numberColor, label) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 5.5,
    h: 1.05,
    rectRadius: 0.1,
    fill: { color: C.panel },
    line: { color: C.panel, pt: 1 },
    shadow: SHADOW
  });
  slide.addText(number, {
    x: x + 0.15,
    y: y + 0.1,
    w: 1.2,
    h: 0.85,
    fontFace: "Trebuchet MS",
    fontSize: 52,
    bold: true,
    align: "center",
    margin: 0,
    color: numberColor,
    fit: "shrink"
  });
  slide.addText(label, {
    x: x + 1.4,
    y: y + 0.2,
    w: 3.9,
    h: 0.65,
    fontFace: "Calibri",
    fontSize: 11,
    color: C.bodyDark,
    margin: 0,
    fit: "shrink"
  });
}

function valueCard(slide, x, y, circleColor, header, bullets) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 3.6,
    h: 3.3,
    rectRadius: 0.12,
    fill: { color: "FFFFFF" },
    line: { color: C.blue, pt: 1.5 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.4,
    y: y + 0.05,
    w: 0.6,
    h: 0.6,
    fill: { color: circleColor },
    line: { color: circleColor, pt: 1 }
  });
  slide.addText(header, {
    x: x + 1.1,
    y: y + 0.1,
    w: 2.1,
    h: 0.35,
    fontFace: "Trebuchet MS",
    fontSize: 17,
    bold: true,
    color: C.textLight,
    margin: 0,
    fit: "shrink"
  });
  bullets.forEach((bullet, index) => {
    addBulletRow(slide, x + 0.18, y + 0.82 + index * 0.56, bullet, false, 2.9);
  });
}

function featureCard(slide, x, y, border, title, body, tag) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 6.0,
    h: 1.65,
    rectRadius: 0.1,
    fill: { color: "FFFFFF" },
    line: { color: "D9E2EC", pt: 1 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.06,
    h: 1.65,
    fill: { color: border },
    line: { color: border, pt: 0.5 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.15,
    y: y + 0.1,
    w: 0.45,
    h: 0.45,
    fill: { color: border },
    line: { color: border, pt: 1 }
  });
  slide.addText(title, {
    x: x + 0.7,
    y: y + 0.05,
    w: 4.6,
    h: 0.25,
    fontFace: "Trebuchet MS",
    fontSize: 15,
    bold: true,
    color: C.textLight,
    margin: 0,
    fit: "shrink"
  });
  slide.addText(body, {
    x: x + 0.7,
    y: y + 0.46,
    w: 4.95,
    h: 0.48,
    fontFace: "Calibri",
    fontSize: 11,
    color: C.bodyLight,
    margin: 0,
    fit: "shrink"
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.7,
    y: y + 1.18,
    w: 1.9,
    h: 0.24,
    rectRadius: 0.08,
    fill: { color: "EFF6FF" },
    line: { color: border, pt: 1 }
  });
  slide.addText(tag, {
    x: x + 0.78,
    y: y + 1.22,
    w: 1.74,
    h: 0.12,
    fontFace: "Calibri",
    fontSize: 9,
    color: border,
    align: "center",
    margin: 0,
    fit: "shrink"
  });
}

function nodeCard(slide, x, badgeColor, number, title, body) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y: 2.2,
    w: 1.65,
    h: 1.85,
    rectRadius: 0.1,
    fill: { color: C.panel },
    line: { color: C.blue, pt: 1.5 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: x + 0.615,
    y: 2.34,
    w: 0.42,
    h: 0.42,
    fill: { color: badgeColor },
    line: { color: badgeColor, pt: 1 }
  });
  slide.addText(number, {
    x: x + 0.615,
    y: 2.455,
    w: 0.42,
    h: 0.12,
    fontFace: "Trebuchet MS",
    fontSize: 13,
    bold: true,
    align: "center",
    margin: 0,
    color: badgeColor === C.amber ? C.textLight : C.white,
    fit: "shrink"
  });
  slide.addText(title, {
    x: x + 0.12,
    y: 2.86,
    w: 1.41,
    h: 0.28,
    fontFace: "Trebuchet MS",
    fontSize: 11,
    bold: true,
    color: C.white,
    align: "center",
    margin: 0,
    fit: "shrink"
  });
  slide.addText(body, {
    x: x + 0.1,
    y: 3.28,
    w: 1.45,
    h: 0.55,
    fontFace: "Calibri",
    fontSize: 9,
    color: C.muted,
    align: "center",
    margin: 0,
    fit: "shrink"
  });
}

function stepStrip(slide, y, border, number, title, body, numberTextColor) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y,
    w: 6.3,
    h: 0.72,
    rectRadius: 0.08,
    fill: { color: "FFFFFF" },
    line: { color: "D9E2EC", pt: 1 },
    shadow: SHADOW
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y,
    w: 0.06,
    h: 0.72,
    fill: { color: border },
    line: { color: border, pt: 0.5 }
  });
  slide.addShape(pptx.ShapeType.ellipse, {
    x: 0.65,
    y: y + 0.07,
    w: 0.38,
    h: 0.38,
    fill: { color: border },
    line: { color: border === C.bgDark ? C.blue : border, pt: border === C.bgDark ? 1 : 0.8 }
  });
  slide.addText(number, {
    x: 0.65,
    y: y + 0.18,
    w: 0.38,
    h: 0.1,
    fontFace: "Trebuchet MS",
    fontSize: 12,
    bold: true,
    align: "center",
    margin: 0,
    color: numberTextColor,
    fit: "shrink"
  });
  slide.addText(title, {
    x: 1.15,
    y: y + 0.03,
    w: 2.2,
    h: 0.18,
    fontFace: "Trebuchet MS",
    fontSize: 13,
    bold: true,
    color: C.textLight,
    margin: 0,
    fit: "shrink"
  });
  slide.addText(body, {
    x: 1.15,
    y: y + 0.28,
    w: 5.25,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 11,
    color: C.bodyLight,
    margin: 0,
    fit: "shrink"
  });
}

function roadmapNode(slide, x, color, fillColor, label, title, body, outlined = false) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y: 4.75,
    w: 0.5,
    h: 0.5,
    fill: { color: fillColor, transparency: outlined ? 100 : 0 },
    line: { color, pt: outlined ? 2 : 1 }
  });
  slide.addText(label, {
    x,
    y: 4.89,
    w: 0.5,
    h: 0.11,
    fontFace: "Trebuchet MS",
    fontSize: 12,
    bold: true,
    align: "center",
    margin: 0,
    color: outlined ? color : C.white,
    fit: "shrink"
  });
  slide.addText(title, {
    x: x - 0.35,
    y: 5.33,
    w: 1.2,
    h: 0.15,
    fontFace: "Calibri",
    fontSize: 11,
    bold: true,
    align: "center",
    margin: 0,
    color: outlined ? color : title === "v1.0 Launch" ? C.white : color,
    fit: "shrink"
  });
  slide.addText(body, {
    x: x - 0.85,
    y: 5.58,
    w: 2.2,
    h: 0.3,
    fontFace: "Calibri",
    fontSize: 9,
    align: "center",
    margin: 0,
    color: C.muted,
    fit: "shrink"
  });
}

// Slide 1
{
  const s = pptx.addSlide();
  s.background = { color: C.bgDark };
  addTitle(s, "Academic Collaboration Is Broken", true);
  s.addText("The Problem", {
    x: 0.5, y: 1.4, w: 5.8, h: 0.5,
    fontFace: "Trebuchet MS", fontSize: 22, bold: true, color: C.blue, margin: 0, fit: "shrink"
  });
  statCard(s, 0.5, 1.95, "73%", C.amber, "of students say group projects lack clear structure");
  statCard(s, 0.5, 3.15, "60+", C.green, "tools used across a typical university ecosystem");
  statCard(s, 0.5, 4.35, "4.2hrs", C.blue, "wasted per student weekly chasing deadlines");
  [
    "No single space for discussion + files + deadlines",
    "Professors can't track struggling students in real time",
    "No AI guidance when students are stuck at 2 AM",
    "Knowledge from past semesters never reused"
  ].forEach((text, index) => addBulletRow(s, 0.55, 5.55 + index * 0.38, text, true, 4.9));

  s.addShape(pptx.ShapeType.ellipse, {
    x: 9.55, y: 3.2, w: 0.7, h: 0.7,
    fill: { color: C.panel }, line: { color: C.blue, pt: 1.5 }
  });
  s.addText("Student", {
    x: 9.58, y: 3.46, w: 0.64, h: 0.12,
    fontFace: "Calibri", fontSize: 10, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
  const satellites = [
    { t: "Email", x: 9.6, y: 1.5 },
    { t: "WhatsApp", x: 11.3, y: 2.2 },
    { t: "LMS", x: 11.4, y: 3.9 },
    { t: "Drive", x: 9.6, y: 4.8 },
    { t: "Notion", x: 7.6, y: 3.9 },
    { t: "Zoom", x: 7.5, y: 2.2 }
  ];
  satellites.forEach((item) => {
    s.addShape(pptx.ShapeType.line, {
      x: 9.9, y: 3.55, w: item.x + 0.55 - 9.9, h: item.y + 0.225 - 3.55,
      line: { color: C.muted, pt: 1 }
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: item.x, y: item.y, w: 1.1, h: 0.45,
      rectRadius: 0.08, fill: { color: C.slate }, line: { color: C.muted, pt: 1 }
    });
    s.addText(item.t, {
      x: item.x, y: item.y + 0.12, w: 1.1, h: 0.1,
      fontFace: "Calibri", fontSize: 10, color: C.white, align: "center", margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.line, {
    x: 7.5, y: 1.5, w: 4.3, h: 3.7,
    line: { color: C.red, pt: 4, transparency: 60 }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 11.8, y: 1.5, w: -4.3, h: 3.7,
    line: { color: C.red, pt: 4, transparency: 60 }
  });
  s.addText("Every student juggles 6+ disconnected tools. Nothing talks to anything.", {
    x: 7.2, y: 6.95, w: 5.6, h: 0.3,
    fontFace: "Calibri", fontSize: 10, italic: true, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
}

// Slide 2
{
  const s = pptx.addSlide();
  s.background = { color: C.bgLight };
  addTitle(s, "Meet UniBoard AI", false);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.0, y: 1.25, w: 11.3, h: 1.25,
    rectRadius: 0.15, fill: { color: C.bgDark }, line: { color: C.bgDark, pt: 1 }, shadow: SHADOW
  });
  s.addText("One intelligent platform where students collaborate, professors oversee, and AI assists — all in real time.", {
    x: 1.35, y: 1.63, w: 10.6, h: 0.45,
    fontFace: "Trebuchet MS", fontSize: 20, bold: true, align: "center", margin: 0, color: C.white, fit: "shrink"
  });
  valueCard(s, 0.5, 2.7, C.blue, "For Students", [
    "AI writing assistant in every discussion",
    "Smart deadline reminders",
    "Searchable knowledge base",
    "Real-time group workspaces"
  ]);
  valueCard(s, 4.87, 2.7, C.green, "For Professors", [
    "Live engagement analytics per room",
    "AI-generated room summaries",
    "Deadline risk alerts",
    "One dashboard for all course rooms"
  ]);
  valueCard(s, 9.23, 2.7, C.amber, "For Institutions", [
    "Structured academic data not chat noise",
    "Institutional knowledge preserved",
    "No extra tool subscriptions",
    "Scales 10 to 10,000 students"
  ]);
  s.addText("Built on Convex (real-time backend) + Anthropic Claude AI (claude-sonnet-4-20250514)", {
    x: 0.5, y: 6.85, w: 12.3, h: 0.35,
    fontFace: "Calibri", fontSize: 11, italic: true, align: "center", color: C.muted, margin: 0, fit: "shrink"
  });
}

// Slide 3
{
  const s = pptx.addSlide();
  s.background = { color: C.bgDark };
  addTitle(s, "How UniBoard AI Is Built", true);
  [["Students", 1.7], ["Professors", 5.47], ["Admin", 9.23]].forEach(([label, x]) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.5, w: 2.4, h: 0.65,
      rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.blue, pt: 1.5 }, shadow: SHADOW
    });
    s.addText(label, {
      x, y: 1.74, w: 2.4, h: 0.12,
      fontFace: "Calibri", fontSize: 13, align: "center", margin: 0, color: C.white, fit: "shrink"
    });
    s.addShape(pptx.ShapeType.line, {
      x: x + 1.2, y: 2.15, w: 0, h: 0.3,
      line: { color: C.blue, pt: 1.5, endArrowType: "triangle" }
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.67, y: 2.45, w: 9.99, h: 0.7,
    rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.green, pt: 2 }, shadow: SHADOW
  });
  s.addText("Next.js / React Frontend — Responsive Web App (Desktop + Mobile)", {
    x: 1.95, y: 2.68, w: 9.45, h: 0.14,
    fontFace: "Calibri", fontSize: 14, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.line, {
    x: 6.665, y: 3.15, w: 0, h: 0.25,
    line: { color: C.green, pt: 2, endArrowType: "triangle" }
  });
  [
    { x: 1.67, line: C.blue, title: "Convex", body: "Real-time DB + Sync\nWebSockets built-in\nInstant updates" },
    { x: 5.12, line: C.amber, title: "Claude AI", body: "5 AI Features:\nAssistant·Composer\nSummarizer·Q&A·Risk" },
    { x: 8.57, line: C.green, title: "Auth + Storage", body: "Clerk Authentication\nSecure File Uploads\nRole-based Access" }
  ].forEach((item) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: item.x, y: 3.4, w: 3.1, h: 1.15,
      rectRadius: 0.1, fill: { color: C.panel }, line: { color: item.line, pt: 2 }, shadow: SHADOW
    });
    s.addText(item.title, {
      x: item.x + 0.14, y: 3.52, w: 1.8, h: 0.14,
      fontFace: "Trebuchet MS", fontSize: 14, bold: true, color: item.line, margin: 0, fit: "shrink"
    });
    s.addText(item.body, {
      x: item.x + 0.14, y: 3.8, w: 2.8, h: 0.45,
      fontFace: "Calibri", fontSize: 10, color: C.bodyDark, margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.line, {
    x: 4.77, y: 3.98, w: 0.35, h: 0,
    line: { color: C.white, pt: 1.5, dash: "dash" }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 8.22, y: 3.98, w: 0.35, h: 0,
    line: { color: C.white, pt: 1.5, dash: "dash" }
  });
  s.addShape(pptx.ShapeType.line, {
    x: 6.67, y: 4.55, w: 0, h: 0.25,
    line: { color: C.white, pt: 1.5, endArrowType: "triangle" }
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.67, y: 4.8, w: 9.99, h: 0.55,
    rectRadius: 0.06, fill: { color: C.darkPanelDeep }, line: { color: C.muted, pt: 1, dash: "dash" }
  });
  s.addText("Convex Database (Real-time, Serverless) + Anthropic API (claude-sonnet-4-20250514)", {
    x: 1.95, y: 4.98, w: 9.45, h: 0.14,
    fontFace: "Calibri", fontSize: 12, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 11.8, y: 2.3, w: 1.3, h: 2.5,
    rectRadius: 0.06, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  s.addText("Legend", {
    x: 11.93, y: 2.42, w: 0.9, h: 0.1,
    fontFace: "Calibri", fontSize: 10, bold: true, color: C.muted, margin: 0, fit: "shrink"
  });
  [
    { y: 2.72, color: C.blue, label: "Data Flow" },
    { y: 3.1, color: C.green, label: "Core Layer" },
    { y: 3.48, color: C.amber, label: "AI Engine" }
  ].forEach((item) => {
    s.addShape(pptx.ShapeType.rect, {
      x: 11.93, y: item.y, w: 0.12, h: 0.12,
      fill: { color: item.color }, line: { color: item.color, pt: 1 }
    });
    s.addText(item.label, {
      x: 12.11, y: item.y - 0.01, w: 0.74, h: 0.12,
      fontFace: "Calibri", fontSize: 9, color: C.bodyDark, margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 11.93, y: 3.86, w: 0.12, h: 0.12,
    fill: { color: C.panel }, line: { color: C.white, pt: 1, dash: "dash" }
  });
  s.addText("External API", {
    x: 12.11, y: 3.85, w: 0.74, h: 0.12,
    fontFace: "Calibri", fontSize: 9, color: C.bodyDark, margin: 0, fit: "shrink"
  });
}

// Slide 4
{
  const s = pptx.addSlide();
  s.background = { color: C.bgLight };
  addTitle(s, "5 AI-Powered Capabilities", false);
  featureCard(s, 0.5, 1.5, C.blue, "Conversational AI Assistant", "Claude answers student questions in real time. Context-aware, academic-focused.", "Students · 24/7");
  featureCard(s, 6.83, 1.5, C.green, "Smart Composer", "AI drafts posts, announcements, discussion replies. One click to polish any message.", "Professors · Students");
  featureCard(s, 0.5, 3.35, C.amber, "Room Summarizer", "Condenses long discussion threads into structured summaries instantly.", "Professors · Admins");
  featureCard(s, 6.83, 3.35, C.purple, "Knowledge Base Q&A", "Students ask questions; AI searches course knowledge base, returns cited answers.", "Students · Learning");
  featureCard(s, 0.5, 5.2, C.red, "Deadline Risk Predictor", "AI flags students at risk of missing deadlines before it happens.", "Professors · Early Warning");
  featureCard(s, 6.83, 5.2, C.muted, "Real-Time Collaboration", "Rooms sync instantly via Convex WebSockets. No refresh. No lag. Ever.", "Platform Core");
}

// Slide 5
{
  const s = pptx.addSlide();
  s.background = { color: C.bgDark };
  addTitle(s, "End-to-End User Journey", true);
  const xs = [0.3, 2.25, 4.2, 6.15, 8.1, 10.05];
  const defs = [
    [C.blue, "1", "Sign Up / Log In", "Clerk Auth\nGmail / Email\n<30 seconds"],
    [C.green, "2", "Join a Course Room", "Invite link or\nroom code\nInstant access"],
    [C.amber, "3", "Post & Collaborate", "Start discussions\nUpload files\nTag teammates"],
    [C.purple, "4", "Ask the AI", "Type any question\nClaude responds\ninstantly in-room"],
    [C.red, "5", "Professor Reviews", "AI summary ready\nRisk flags\nEngagement chart"],
    [C.green, "6", "Knowledge Grows", "Q&A saved to KB\nFuture students\nbenefit too"]
  ];
  defs.forEach((item, index) => {
    nodeCard(s, xs[index], item[0], item[1], item[2], item[3]);
  });
  [1.97, 3.92, 5.87, 7.82, 9.77].forEach((x) => {
    s.addShape(pptx.ShapeType.rightArrow, {
      x, y: 3.08, w: 0.3, h: 0.22,
      fill: { color: C.blue }, line: { color: C.blue, pt: 1.5 }
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 4.35, w: 5.8, h: 1.3,
    rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0.5, y: 4.35, w: 0.06, h: 1.3,
    fill: { color: C.blue }, line: { color: C.blue, pt: 0.5 }
  });
  s.addText("Student Path", {
    x: 0.72, y: 4.56, w: 1.8, h: 0.12,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.blue, margin: 0, fit: "shrink"
  });
  s.addText("Post question → AI answers → Composer drafts → KB updated", {
    x: 0.72, y: 4.9, w: 5.2, h: 0.3,
    fontFace: "Calibri", fontSize: 11, color: C.bodyDark, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.0, y: 4.35, w: 5.8, h: 1.3,
    rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 7.0, y: 4.35, w: 0.06, h: 1.3,
    fill: { color: C.amber }, line: { color: C.amber, pt: 0.5 }
  });
  s.addText("Professor Path", {
    x: 7.22, y: 4.56, w: 2.0, h: 0.12,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.amber, margin: 0, fit: "shrink"
  });
  s.addText("Open dashboard → View AI Summary → Check Risk flags → Act early", {
    x: 7.22, y: 4.9, w: 5.15, h: 0.3,
    fontFace: "Calibri", fontSize: 11, color: C.bodyDark, margin: 0, fit: "shrink"
  });
}

// Slide 6
{
  const s = pptx.addSlide();
  s.background = { color: C.bgLight };
  addTitle(s, "Get Started in Under 5 Minutes", false);
  [
    [1.4, C.blue, "1", "Open the app", "Visit uniboard.ai in any browser — no install needed", C.white],
    [2.22, C.green, "2", "Create your account", "Click Sign Up → university email → verified in seconds", C.white],
    [3.04, C.amber, "3", "Join or create a room", "Enter professor's room code OR click New Room", C.textLight],
    [3.86, C.purple, "4", "Post your first message", "Type in discussion box → Enter → classmates see instantly", C.white],
    [4.68, C.red, "5", "Ask the AI anything", "Click Ask AI → type question → Claude answers in the room", C.white],
    [5.5, C.bgDark, "6", "You're live!", "Explore: Smart Composer, Summaries, Knowledge Base", C.white]
  ].forEach((item) => stepStrip(s, item[0], item[1], item[2], item[3], item[4], item[5]));

  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.1, y: 1.4, w: 5.7, h: 5.7,
    rectRadius: 0.15, fill: { color: C.bgDark }, line: { color: C.bgDark, pt: 1 }, shadow: SHADOW
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.4, w: 5.7, h: 0.38,
    fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  [C.red, C.amber, C.green].forEach((color, index) => {
    s.addShape(pptx.ShapeType.ellipse, {
      x: 7.25 + index * 0.2, y: 1.52, w: 0.14, h: 0.14,
      fill: { color }, line: { color, pt: 0.5 }
    });
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.4, y: 1.48, w: 2.8, h: 0.22,
    rectRadius: 0.06, fill: { color: C.darkPanelDeep }, line: { color: C.darkPanelDeep, pt: 1 }
  });
  s.addText("uniboard.ai", {
    x: 8.4, y: 1.54, w: 2.8, h: 0.08,
    fontFace: "Calibri", fontSize: 9, color: C.muted, align: "center", margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 7.1, y: 1.78, w: 1.15, h: 5.32,
    fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  [
    ["Rooms", 1.85, C.muted],
    ["● CS 101", 2.15, C.white],
    ["● Math 201", 2.4, C.muted],
    ["● Bio 301", 2.65, C.muted],
    ["+ New Room", 2.95, C.blue]
  ].forEach((item) => {
    s.addText(item[0], {
      x: 7.15, y: item[1], w: 0.95, h: 0.1,
      fontFace: "Calibri", fontSize: 9, color: item[2], margin: 0, fit: "shrink"
    });
  });
  s.addText("CS 101 — Discussion", {
    x: 8.35, y: 1.85, w: 2.3, h: 0.12,
    fontFace: "Calibri", fontSize: 11, bold: true, color: C.blue, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.35, y: 2.25, w: 3.6, h: 0.45,
    rectRadius: 0.1, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  s.addText("Ahmed: Can someone explain Big-O?", {
    x: 8.5, y: 2.4, w: 3.25, h: 0.11,
    fontFace: "Calibri", fontSize: 9, color: C.bodyDark, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.35, y: 2.85, w: 3.9, h: 0.7,
    rectRadius: 0.1, fill: { color: C.green }, line: { color: C.green, pt: 1 }
  });
  s.addText("AI: Big-O describes worst-case time complexity of an algorithm. Example: O(n) means...", {
    x: 8.52, y: 3.05, w: 3.55, h: 0.28,
    fontFace: "Calibri", fontSize: 9, color: C.textLight, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.35, y: 6.55, w: 3.5, h: 0.3,
    rectRadius: 0.08, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }
  });
  s.addText("Ask AI or message the room…", {
    x: 8.48, y: 6.64, w: 3.15, h: 0.08,
    fontFace: "Calibri", fontSize: 9, color: C.muted, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.ellipse, {
    x: 11.9, y: 6.55, w: 0.28, h: 0.28,
    fill: { color: C.blue }, line: { color: C.blue, pt: 1 }
  });
  s.addText("UniBoard AI interface — works in any browser", {
    x: 7.1, y: 7.15, w: 5.7, h: 0.25,
    fontFace: "Calibri", fontSize: 10, italic: true, align: "center", color: C.muted, margin: 0, fit: "shrink"
  });
}

// Slide 7
{
  const s = pptx.addSlide();
  s.background = { color: C.bgDark };
  addTitle(s, "Impact & What's Next", true);
  [
    [0.5, C.blue, "5 AI", "Fully integrated AI capabilities at launch"],
    [3.61, C.green, "<1s", "Real-time sync latency via Convex WebSockets"],
    [6.72, C.amber, "100%", "Browser-based — no installs, no friction"],
    [9.83, C.purple, "∞", "Knowledge base grows with every semester"]
  ].forEach((item) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: item[0], y: 1.4, w: 2.9, h: 1.85,
      rectRadius: 0.12, fill: { color: C.panel }, line: { color: C.panel, pt: 1 }, shadow: SHADOW
    });
    s.addShape(pptx.ShapeType.rect, {
      x: item[0], y: 1.4, w: 2.9, h: 0.08,
      fill: { color: item[1] }, line: { color: item[1], pt: 0.5 }
    });
    s.addText(item[2], {
      x: item[0], y: 1.6, w: 2.9, h: 0.45,
      fontFace: "Trebuchet MS", fontSize: 52, bold: true, align: "center", margin: 0, color: item[1], fit: "shrink"
    });
    s.addText(item[3], {
      x: item[0] + 0.18, y: 2.3, w: 2.54, h: 0.32,
      fontFace: "Calibri", fontSize: 11, color: C.bodyDark, align: "center", margin: 0, fit: "shrink"
    });
  });
  s.addShape(pptx.ShapeType.line, {
    x: 0.5, y: 3.5, w: 12.3, h: 0,
    line: { color: C.slate, pt: 1 }
  });
  s.addText("Roadmap", {
    x: 0.5, y: 3.65, w: 3.0, h: 0.3,
    fontFace: "Trebuchet MS", fontSize: 20, bold: true, color: C.green, margin: 0, fit: "shrink"
  });
  s.addShape(pptx.ShapeType.line, {
    x: 0.5, y: 5.0, w: 12.3, h: 0,
    line: { color: C.slate, pt: 1 }
  });
  roadmapNode(s, 1.0, C.green, C.green, "✓", "v1.0 Launch", "Core rooms, 5 AI features, Auth");
  roadmapNode(s, 4.3, C.blue, C.blue, "2", "v1.5 — Q3 2025", "Mobile app, LMS sync");
  roadmapNode(s, 7.6, C.amber, C.panel, "3", "v2.0 — Q1 2026", "Multi-university, Analytics API", true);
  roadmapNode(s, 10.9, C.purple, C.panel, "4", "v3.0 — 2026", "AI grading, Institutional licensing", true);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 6.75, w: 12.3, h: 0.55,
    rectRadius: 0.1, fill: { color: C.blue }, line: { color: C.blue, pt: 1 }, shadow: SHADOW
  });
  s.addText("Try UniBoard AI today → uniboard.ai  |  Questions? hello@uniboard.ai", {
    x: 0.8, y: 6.92, w: 11.7, h: 0.16,
    fontFace: "Trebuchet MS", fontSize: 15, bold: true, color: C.white, align: "center", margin: 0, fit: "shrink"
  });
}

pptx.writeFile({ fileName: OUT }).then(() => {
  if (!fs.existsSync(OUT)) {
    throw new Error(`Presentation was not created: ${OUT}`);
  }
  console.log(`Created ${OUT}`);
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
