# UniBoard Presentation Master

This document is the single source of truth for the UniBoard presentation. It is written so it can be reused in two ways:

1. As a command-line reference when you need to generate slides or speaker notes.
2. As a notebook-friendly source for an LLM that is producing a spoken presentation script.

## Project Details

- Course Instructor: Miss Sumera Syed
- Subject: AICT (Advanced Information and Communication Technology)
- Project Title: UniBoard - AI-Powered Academic Collaboration Platform
- Project Creators: Raja Muhammad Zohaib, Abdullah Pervaiz
- Version: 1.0

## Project Summary

UniBoard is an AI-powered academic collaboration platform for students, teachers, and super admins.
It keeps rooms, posts, comments, deadlines, notifications, saved posts, search, analytics, and AI support in one workspace.

The platform is designed to feel professional, practical, and easy to demo.
Students can join rooms, save important posts, track deadlines, and ask grounded AI questions.
Teachers can manage rooms, publish announcements, review submissions, and moderate activity.
Super admins can oversee the platform and validate governance.

## System Architecture

Frontend:
- Next.js App Router
- React components
- Tailwind CSS
- Framer Motion
- Radix UI

Backend:
- Convex live database
- Convex queries and mutations
- Clerk authentication
- OpenAI-backed AI routes with deterministic fallbacks

Core folders:
- `src/app` for routes and pages
- `src/components` for reusable UI and feature panels
- `src/lib` for utilities, AI helpers, and shared logic
- `convex` for schema, queries, mutations, and seed data

## Deliverables Overview

The product includes:
- login and signup
- student, teacher, and super admin roles
- dashboard with live summaries
- rooms with public discovery and private join codes
- room pages with posts, comments, and teacher tools
- saved posts
- notifications
- search
- planner
- analytics
- knowledge base
- AI assistant
- assignment submissions

## Screen 1: User Authentication

Purpose:
The entry point for the app. Users authenticate through Clerk and then sync into Convex.

What happens:
- The user signs in or signs up.
- Clerk validates the account.
- The app syncs the user into Convex.
- The correct role, batch, and profile data are loaded.

Presentation line:
"This is the login layer. Once the user signs in, the app connects that identity to the live workspace data in Convex so the dashboard, rooms, posts, and notifications all load under the correct account."

Demo credentials:
- Super Admin: `davidshead0@gmail.com` / `DavidAdmin123!`
- Teacher: `robinseo82@gmail.com` / `RobinTeacher123!`
- Student: `zohaib99080@gmail.com` / `ZohaibStudent123!`

## Screen 2: Dashboard

Purpose:
The dashboard is the home screen and the control center.

What it shows:
- joined rooms
- upcoming deadlines
- workspace momentum
- AI briefing card
- room previews

How it works:
- It reads live room data from Convex.
- It reads deadline data from the planner snapshot.
- It shows a grounded AI briefing using workspace data.

Presentation line:
"The dashboard is the control center. It gives the user a quick summary of rooms, deadlines, and current workspace activity before they open any detailed screen."

## Screen 3: Saved Posts

Purpose:
Saved Posts is the user's personal reference area.

What it does:
- stores posts the user wants to revisit
- keeps important resources and deadlines easy to find
- helps students return to useful material quickly

Presentation line:
"Saved Posts works like a personal academic bookmark list. A user can save important posts and come back to them without searching through the full room feed again."

## Screen 4: Notifications

Purpose:
Notifications tell the user what needs attention.

What triggers notifications:
- new posts
- new comments
- replies
- pinned posts
- resolved questions
- assignment submissions
- room invitations
- upvotes

What it does:
- shows unread and total counts
- lets the user mark items read
- opens the relevant room or post when clicked

Presentation line:
"Notifications are live records, not just badges. The system writes them when room activity happens, so the user can quickly move from the alert to the exact source context."

## Screen 5: Search Page

Purpose:
Search helps users find room content quickly across authorized data.

What it searches:
- posts
- deadlines
- resources
- questions
- tags

Presentation line:
"Search is the fastest way to locate room knowledge. The results stay limited to what the user is allowed to see, so the workspace stays secure and grounded."

## Remaining Screens and Features

### Rooms page

What it includes:
- public room discovery
- private room join by code
- create room flow
- search rooms by title, subject, batch, or description

Presentation line:
"This page is where users discover or enter classes. Public rooms are visible to the batch, and private rooms require a join code from the room owner or teacher."

### Room page

What it includes:
- post feed
- comments and replies
- pinned post context
- AI room summary
- teacher tools
- feed view modes
- assignment submission panel

Presentation line:
"The room page is the collaboration hub. It combines discussion, AI summaries, teacher controls, and assignment submissions in one place."

### Assignment submission

What it does:
- students submit to the room creator
- the room creator acts as the reviewer and admin
- review access stays limited to the room creator and moderators

Presentation line:
"Assignment submissions are intentionally scoped to the room admin. That keeps student work private and aligns review with the person who created and owns the room."

### Planner

What it does:
- converts deadlines into a study schedule
- shows upcoming work
- supports manual deadlines
- exports calendar and document formats

### Analytics

What it does:
- shows deadline risk
- shows activity trends
- shows content distribution
- shows AI risk radar

### Knowledge base

What it does:
- answers grounded workspace questions
- uses authorized room data
- abstains when evidence is weak

### AI assistant

What it does:
- gives live chat help
- stays room-aware
- uses deterministic fallbacks when the model is unavailable

### Admin tools

What it does:
- room moderation
- governance review
- role oversight
- seeded demo validation

## Private Room Flow

1. The room owner or teacher creates a room.
2. If the room is private, the system generates a join code.
3. The owner shares the code with the intended user.
4. The user opens Rooms and joins using the code.
5. Convex records the membership and the room becomes visible in the user's joined rooms.

Presentation note:
If asked why a room is private, explain that private rooms are for controlled class or project spaces. The join code is the access gate.

## Presentation Creation Workflow

### Command mode

Use this file as the source of truth when generating slide content, slide notes, or a short demo outline from the terminal.

Suggested workflow:
- read this master file
- extract the relevant section for the required audience
- generate a speaker script or slide outline from that section
- copy the generated outline into PowerPoint slide titles and speaker notes
- keep each slide aligned to one section from this document
- use the exact project details above on the title slide or opening slide

### Notebook LLM mode

Use this file when working in a notebook-style LLM workflow.

Suggested workflow:
- paste one section at a time
- ask the model to expand it into spoken lines
- keep the output grounded in the exact features documented here
- turn the expanded text into PPT speaker notes or a presentation script
- keep the order of slides consistent with the sections in this file

### PowerPoint usage instruction

For PPT creation, use this document in the following order:
1. Start the deck with the Project Details section.
2. Use the Project Summary section for the opening explanation.
3. Follow the screen sections in the same order they appear here.
4. Use the spoken lines as speaker notes.
5. Use the short demo notes for a cleaner live presentation.

## Closing Summary

UniBoard is a professional academic collaboration platform built to keep class activity organized, searchable, and grounded in live data.
The combination of rooms, notifications, saved posts, planner, analytics, AI, and moderation makes the system useful for day-to-day use and for live presentation.
