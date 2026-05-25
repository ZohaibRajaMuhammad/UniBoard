# UniBoard AI

UniBoard AI is an AI-powered academic collaboration platform designed for universities, departments, teachers, and students who need one structured environment for discussion, deadlines, knowledge reuse, moderation, and real-time classroom coordination. The system combines a responsive web application, a real-time backend, role-aware collaboration logic, and a grounded AI layer that operates only on authorized academic context.

This README is written as a complete product, architecture, feature, AI, and experience guide. Its purpose is to help a founder, designer, presenter, technical reviewer, product manager, investor, professor, student ambassador, or implementation engineer understand exactly what UniBoard AI does, why it exists, how it works, and how its intelligence layer behaves.

## 1. Product Vision

Universities suffer from fragmentation. Academic collaboration is usually spread across chat apps, learning management systems, file tools, personal notes, informal groups, email threads, and deadline reminders that never stay synchronized. UniBoard AI exists to replace that fragmentation with one intelligent academic operating layer.

The core product vision is simple:

One platform where students collaborate, professors oversee, and AI assists in real time.

UniBoard AI is not a generic social network, not a loose chat room, and not a file dump. It is a structured academic workspace. Every room, post, comment, reminder, and AI answer is meant to serve a real educational purpose.

## 2. Strategic Product Goals

UniBoard AI is designed to achieve seven major goals.

First, centralize academic collaboration into one room-based workspace.

Second, reduce missed deadlines, scattered discussions, and duplicated explanations.

Third, give teachers visibility into engagement, participation, and emerging risk.

Fourth, preserve knowledge from one semester so that future students do not start from zero.

Fifth, provide students with immediate AI help when teachers or classmates are unavailable.

Sixth, make real-time collaboration feel fast, reliable, and intuitive across desktop and mobile.

Seventh, create a data model that is academically structured rather than noisy, unsearchable, or disposable.

## 3. Primary Users

UniBoard AI serves multiple audiences with different needs.

### Students

Students use UniBoard AI to join rooms, ask questions, post notes, share resources, participate in projects, save important posts, track deadlines, build personal reputation, search past knowledge, and ask AI for grounded academic help.

### Professors and Teachers

Teachers use UniBoard AI to create and manage academic rooms, monitor participation, publish structured course updates, summarize active discussion, identify risk early, moderate content, and keep course communication organized.

### Institutions and Departments

Institutions use UniBoard AI as a long-term academic memory system. The value at this level comes from preserved knowledge, structured room data, reusable course intelligence, clearer engagement patterns, and reduced tool sprawl.

### Moderators and Administrators

Administrative users manage room policy, handle moderation, control membership roles, resolve misuse, and ensure the platform remains academically useful.

## 4. Product Philosophy

UniBoard AI follows a strong set of design and product principles.

Academic-first, not social-first.

Structured content, not endless chat streams.

Grounded AI, not hallucination-first AI.

Role-aware workflows, not one-size-fits-all behavior.

Fast real-time sync, not manual refresh.

Reusable knowledge, not disappearing semester-by-semester context.

Minimal friction onboarding, not heavy setup burden.

## 5. Core Product Model

The platform revolves around rooms.

A room represents an academic collaboration unit such as a course, lab, project workspace, revision group, studio space, or supervised discussion cluster.

Inside each room, users can create structured posts. Those posts are not all the same. The product recognizes different post formats because academic collaboration is not a single behavior. A question is different from an announcement. A deadline is different from a resource. A project update is different from a note.

Every feature in the system is built around this idea:

Structured academic signal is more valuable than generic messaging noise.

## 6. Feature Overview

UniBoard AI includes the following major product surfaces:

Authentication and onboarding

Dashboard shell

Room discovery and joining

Private room join-code flow

Room feed and structured posting

Comments and threaded discussion

AI mention reply system

Global AI assistant widget

AI knowledge base question answering

AI composer and drafting support

AI room summary

AI deadline risk analysis

AI study planning and learning profile

Search and live suggestions

Saved posts

Notifications

Planner

Analytics

Leaderboard and reputation

Teacher moderation panel

Profile and settings

Responsive mobile and desktop app shell

## 7. Authentication and Identity Logic

UniBoard AI uses Clerk for authentication and Convex for user persistence and application data.

The identity model works in stages.

When a user signs in or signs up, Clerk authenticates the session.

That identity is then synchronized into Convex. The system stores the user’s name, email, optional image URL, role, presence state, joined rooms count, reputation signals, badges, notification preferences, and profile metadata.

If the user does not yet have a full academic profile, they can complete onboarding by specifying role, batch, department, optional student ID, and short bio.

Identity is split into two layers:

Authentication identity, which proves the user is real and signed in.

Academic product identity, which determines how the user behaves inside UniBoard AI.

## 8. Role System

UniBoard AI currently recognizes five platform-level roles.

Student

Teacher

Admin

Super admin

Pending

Pending is important because onboarding and verification may happen before a user becomes fully active as a student or teacher.

Inside each room, there is also a room-specific role system:

Member

Moderator

Owner

This separation matters because a platform-level teacher may still need room-level membership logic, and a room owner may have stronger room powers than a normal moderator.

## 9. Room System

Rooms are the main collaboration unit of the application.

A room contains:

Name

Subject

Batch

Description

Creator

Visibility state

Join code if private

Policy toggles such as anonymous posting and AI enablement

Counts such as member count and post count

Activity timestamps

Optional visual metadata such as color, icon, or cover feel

### Public Rooms

Public rooms are discoverable through the rooms page. A user can join them directly by selecting the room.

### Private Rooms

Private rooms are not meant to be casually discoverable. The correct private-room flow is:

Teacher creates private room.

System generates join code.

Teacher shares join code.

Student opens the rooms page.

Student enters join code.

System validates access conditions.

Student joins and is redirected into the room.

### Room Access Protection

A user cannot join if the room is archived.

A banned member cannot rejoin.

A private room requires join-code-based access rather than casual public entry.

### Room Presence

When a user opens a room, the system marks the room as seen and updates room-level presence. This powers active-in-room indicators and reduces stale unread counts.

## 10. Dashboard Shell

The shell is designed as the persistent operating frame of the product. It includes:

Desktop sidebar

Mobile sidebar drawer

Mobile bottom navigation

Global AI assistant access

Unread indicators

Room shortcuts

Profile and settings controls

The shell is intentionally designed so that the application feels like one academic operating environment rather than disconnected pages.

## 11. Responsive UX Model

UniBoard AI is intended to be fully usable on desktop, tablet, and mobile.

Desktop priorities:

Persistent navigation

Wide room feed

Faster moderation access

High information density

Mobile priorities:

Accessible sidebar trigger

Bottom navigation

Composable modals instead of oversized inline surfaces

Single visible primary action

Touch-safe controls

Contained scrolling

The responsive design principle is that the interface should never force users to fight with nested scroll areas, hidden buttons, clipped composers, or inaccessible off-screen content.

## 12. Structured Post Types

UniBoard AI supports multiple academic post types because each one represents a different intent.

### Note

Used for updates, study notes, clarifications, or lightweight room communication.

### Deadline

Used for assignment due dates, deliverables, milestones, and exam-related schedules.

### Question

Used when a student or teacher needs an answer, clarification, or discussion around uncertainty.

### Resource

Used to share links, references, readings, files, or learning materials.

### Announcement

Used for formal room-wide communication that should be prominent and low-noise.

### Poll

Used when the room needs a structured decision, preference signal, or vote.

### Project

Used for project coordination, milestones, group work direction, and team collaboration.

Each type influences UI treatment, filtering behavior, and future analysis possibilities.

## 13. Feed and Discussion Model

Inside a room, the feed is the main academic timeline.

The room feed supports:

Live post loading

Filtering by content type

Pinned content

Comment expansion

Reactions

Upvotes

Save state

Moderation actions

Highlighting deep-linked posts from search

Discussion is thread-based rather than freeform infinite messaging. That means a single post can accumulate focused discussion while preserving the context of the original topic.

## 14. Post Lifecycle Logic

A post can be created, viewed, commented on, saved, reacted to, upvoted, edited, hidden, pinned, reported, flagged, resolved, deleted, or reposted depending on context and permissions.

### Create

User submits post data from the composer.

Backend validates room access and policy constraints.

Post is stored.

Room counts are updated.

Notifications may be generated.

Live subscribers receive the update immediately.

### Edit

Authors can edit permitted fields while preserving moderation rules and room integrity.

### Hide

Authors can hide their own post if they want to reduce visibility without full deletion.

### Pin

Teachers or high-authority moderators can pin important posts.

### Resolve

Question posts can be marked resolved once the issue is answered.

### Report and Flag

Members can report issues.

Moderators can flag and review higher-risk content.

### Delete

Deletion is soft and policy-aware, preserving governance logic rather than treating everything as hard erasure.

## 15. Comments and Threading

Comments support:

Top-level discussion

Replies to comments

Mention insertion

Visible or anonymous mode depending on room policy

AI-triggered follow-up when the assistant is mentioned

Soft deletion

Threaded comments are critical because they keep academic questions attached to the original post instead of scattering explanation across multiple channels.

## 16. Search

The search experience is based on academic retrieval rather than generic browsing.

Search can use:

Post content

Titles

Tags

Room access scope

Live search suggestions derived from accessible room data

The goal is to let users find prior knowledge, important deadlines, and meaningful room content without remembering where it was originally posted.

## 17. Saved Posts

Saved posts provide a personal review queue. This supports student workflows such as:

Save a difficult explanation for later revision

Save an announcement to revisit

Save a resource before an exam

Save a thread that contains an important clarification

This feature is intentionally lightweight, because the value is in recall, not in building yet another productivity subsystem.

## 18. Notifications

Notifications are user-specific and event-driven.

They can include signals such as:

New post

New comment

Reply activity

Upvotes

Announcements

Mentions

Notifications are controlled by user preferences rather than one rigid global rule. The product aims to preserve important academic attention while minimizing low-value alert noise.

## 19. Planner

The planner converts academic dates and manual commitments into a personal study and action view.

It brings together:

Room deadlines

User-created manual deadlines

Completion state

Estimated work effort

Calendar export

Potential AI-generated planning support

The planner is useful because academic coordination often fails at the transition point between room-level communication and personal execution.

## 20. Analytics

Analytics turn collaboration data into decision support.

Workspace analytics can include:

Activity over time

Post type distribution

Participation intensity

Resolved questions

Anonymous activity totals

Upcoming deadlines

Room analytics can include:

Member-level activity

Engagement snapshots

Moderation indicators

Teacher intervention surfaces

Analytics are intended for decision-making, not vanity. The platform is interested in who needs help, what rooms are active, what content formats matter, and where teaching attention should go next.

## 21. Leaderboard and Reputation

UniBoard AI includes contribution and reputation surfaces that reward meaningful academic participation.

Signals can include:

Posts created

Upvotes received

Engagement contribution

Helpfulness over time

Room activity

Reputation exists to reinforce constructive academic behavior, not to gamify noise.

## 22. Teacher Panel and Moderation

Teachers and high-authority moderators have access to additional room controls.

These controls include:

View room analytics

Review reported content

Change member roles

Mute members

Ban members

Promote moderators

Demote moderators

Observe room health signals

This panel exists because academic collaboration requires governance, not just participation.

## 23. Profile and Settings

The profile surface stores and presents user identity in an academic format.

It includes:

Name

Bio

Department

Student ID

Batch

Badges

Saved content context

The settings page focuses on functional user controls rather than cosmetic novelty. Current emphasis is on notification tuning and clear personal workspace behavior.

## 24. Real-Time Architecture

UniBoard AI uses Next.js 14 on the frontend and Convex as the real-time backend.

This combination is central to the product experience.

Why this matters:

The app does not need brittle manual refresh logic.

Room feeds can update live.

Unread counts can stay current.

Teacher panels can react to activity changes.

Notifications and comments can appear in near real time.

The system is built to feel live, not periodically synchronized.

## 25. Frontend Architecture

The frontend is built with the App Router model in Next.js.

The major frontend layers are:

Root layout

Protected dashboard layout

Public landing page

Feature pages under the dashboard

Composable UI components

Hooks for user and unread state

AI widget and AI-driven pages

The frontend is componentized around product surfaces rather than just generic primitives. That is a practical architecture choice because the product is highly workflow-driven.

## 26. Backend Architecture

The backend is built on Convex with domain-oriented query and mutation files.

Primary backend domains include:

Users

Rooms

Posts

Comments

Votes

Notifications

Analytics

Planner

Reputation

AI fallback functions

Shared backend permission helpers

This structure keeps logic close to its domain while still sharing common permission and author-sanitization rules.

## 27. Data Model

The persistent model includes the following core tables.

Users

Rooms

Room members

Posts

Comments

Votes

Reactions

Notifications

Moderation logs

Post shares

Saved posts

Planner deadlines

This model is intentionally structured so that both product UX and AI retrieval can rely on clean, typed records.

## 28. Permission Model

Permission logic is one of the most important parts of the system.

The backend checks:

Whether a user is authenticated

Whether a user belongs to the room

Whether room policy allows the requested action

Whether the user has moderation authority

Whether the author should be visible or sanitized

Whether the member is muted or banned

Whether the room is private, public, or archived

Permission logic is enforced server-side rather than trusted to UI state.

## 29. AI Philosophy

UniBoard AI does not aim to be a general-purpose chatbot with unrestricted imagination.

Its AI layer follows a grounded academic assistance model:

Only answer from accessible workspace context when context is needed.

Use direct deterministic replies for certain simple assistant intents.

Label low-confidence or fallback states.

Do not leak room data the user should not see.

Do not behave like a generic always-confident chat assistant.

This is a context-engineered product, not just a chat wrapper.

## 30. AI Feature Set

The AI layer currently supports five major academic capabilities plus one global assistant experience.

### Global AI Assistant

This is the floating academic copilot available from the dashboard shell.

It can:

Summarize what needs attention

Suggest what to study next

Find urgent deadlines

Answer grounded academic questions

Use accessible workspace signal only

### AI Mention Reply in Discussion

When a user explicitly mentions the assistant inside a post or comment using the supported mention aliases, the platform can trigger a contextual AI reply that becomes part of the room discussion.

### Smart Composer

This AI feature helps generate or polish academic posts, replies, announcements, and structured discussion content.

### Room Summarizer

This produces a high-level summary of visible discussion and extracts key points for room participants or teachers.

### Knowledge Base Q&A

This feature answers questions by retrieving relevant content from accessible room history and turning it into a useful academic answer.

### Deadline Risk Predictor

This feature evaluates academic risk signals related to deadlines and participation patterns.

### Study Plan and Learning Profile

This feature family produces study guidance, learning posture views, and AI-generated profile-level academic interpretation.

## 31. AI Architecture

The AI architecture combines:

API routes inside the Next.js app

A central AI service layer

Prompt safety logic

Retrieval and chunk ranking

Fallback logic

Convex queries for data access

Token-based scoped retrieval

Structured response envelopes

The sequence is usually:

User triggers AI request.

API route receives request.

AI service checks request type and scope.

System gathers only authorized room data.

Safety checks run.

Context is chunked and ranked if retrieval is needed.

LLM call runs if available.

Fallback path runs if LLM is unavailable or not appropriate.

Response is wrapped in metadata.

UI renders result with confidence and mode labeling where needed.

## 32. AI Retrieval Logic

The retrieval layer is the backbone of grounded answers.

Its purpose is to avoid answering from vague memory when the system should instead reason from actual academic content.

The retrieval flow is:

Collect scoped posts the user is allowed to access.

Convert those posts into chunks.

Create embeddings.

Compare user question embedding with chunk embeddings.

Rank chunks by similarity.

Pass top chunks into the answering step.

Enforce prompt and context budgets.

Map resulting answer back to accessible sources.

This is what turns AI into a context-aware academic assistant rather than a detached generative tool.

## 33. AI Safety Logic

Safety checks attempt to reduce misuse and prompt injection risk.

The system checks for unsafe prompt patterns and enforces context budget limits. It aims to prevent requests from breaking out of the academic frame or forcing the model to ignore retrieval and policy boundaries.

The goal is not absolute censorship. The goal is bounded, reliable academic assistance.

## 34. AI Fallback Logic

UniBoard AI has deterministic fallback behavior for cases where the primary model path is unavailable, too weakly grounded, or not necessary.

Fallback logic is important because educational systems cannot depend on perfect external model availability.

The fallback layer supports continuity for:

Knowledge responses

Deadline risk output

Learning profile views

Other limited academic inferences

This improves resilience and product trust.

## 35. AI Prompt Engineering Strategy

The system uses prompt engineering as workflow design, not decorative prompting.

Each AI capability has a different prompt objective.

### Assistant Prompt Objective

Interpret the user’s intent, preserve academic tone, answer only from visible scope when context matters, and clearly avoid unsupported certainty.

### Composer Prompt Objective

Turn a rough academic intent into clean, concise, useful collaborative writing suitable for room posting.

### Room Summary Prompt Objective

Condense long room activity into a brief, structured, actionable summary with key takeaways.

### Knowledge Q&A Prompt Objective

Use retrieved academic content to answer a question accurately and directly while staying close to available evidence.

### Risk Prompt Objective

Interpret patterns that may indicate deadline or participation risk and convert them into a teacher-usable early warning signal.

### Study Plan Prompt Objective

Translate upcoming work and context into a practical, student-friendly plan rather than generic motivation.

### Learning Profile Prompt Objective

Describe strengths, gaps, or focus areas in a way that feels useful, bounded, and explicitly inferential rather than absolute.

## 36. AI Prompt Lineup in Practical Terms

From a product standpoint, the AI behaves using a layered prompt lineup:

System intent layer:

You are an academic assistant operating inside a scoped educational workspace.

Policy layer:

Do not use inaccessible context, do not fabricate room evidence, and remain grounded.

Task layer:

Summarize, answer, suggest, assess risk, or draft depending on route.

Context layer:

Use retrieved room content, room metadata, post content, parent comment context, planner data, or direct user question data as appropriate.

Output layer:

Return a concise, useful, readable answer with predictable structure and confidence metadata where supported.

This layered approach is important because each feature has a different context envelope and different risk profile.

## 37. AI Assistant Direct Intent Logic

Not every assistant request should go through full retrieval.

The system includes direct intent resolution for queries such as:

How many classes the user has joined

How many rooms are visible

What needs attention this week

What should be studied next

What the most urgent upcoming deadline is

This direct-intent layer improves speed and removes unnecessary LLM overhead for simple, high-confidence product questions.

## 38. AI Mention Logic

Mention-based AI replies are explicitly triggered by supported mention aliases.

The assistant mention layer is not hidden. It is a clear user action.

The flow is:

User writes a comment or post mentioning the assistant.

Mention parser detects supported alias.

Prompt builder strips the mention marker and extracts the real academic request.

Additional context is assembled from the post and optional parent comment.

Assistant route is called.

If a grounded answer is produced, the backend stores an AI-authored reply inside the discussion.

This turns AI from a separate chat tool into a participant in structured academic discussion.

## 39. AI Room Summary Logic

Room summaries are only useful if they reduce cognitive load.

The room summary feature is designed to answer:

What happened here recently

What matters most

What should I pay attention to

It is not intended to restate every message. It is intended to compress signal.

## 40. AI Knowledge Base Logic

Knowledge base Q&A transforms historical room content into reusable academic memory.

This matters because the best explanation for a question is often already buried somewhere in previous room discussion, an older post, or a teacher clarification.

Knowledge Q&A gives that memory operational value.

## 41. AI Risk Logic

Risk logic is designed as early warning, not judgment.

It looks for patterns such as:

Upcoming deadlines

Low visible engagement

Potential inactivity

Missing academic momentum signals

The output is meant to help teachers intervene early and students recover earlier.

## 42. AI Learning Profile Logic

The learning profile is an interpretive layer rather than a formal academic grade.

It helps users understand:

Which topic areas appear strong

Where engagement or competence seems thinner

What direction further study may need

It should always be framed as inference, not immutable truth.

## 43. AI Response Envelope Logic

AI responses are wrapped with metadata so the frontend can distinguish:

Route used

Request ID

Latency

Operating mode

Confidence band

This is important for enterprise-style debugging, trust, analytics, and product iteration.

## 44. Deployment Model

The app expects:

Clerk public key

Clerk secret key

Convex URL

Optional webhook and issuer configuration for deeper production auth sync

If core configuration is missing, the app surfaces deployment guidance instead of failing silently.

## 45. Reliability and UX Quality Goals

UniBoard AI aims for the following quality bar:

No broken route-level auth experiences

No inaccessible room flows

No clipped composer or feed layouts

No hidden mobile navigation triggers

No unusable private room flow

No AI reply triggers that silently fail due to missing seeded user assumptions

No build dependency on unstable remote assets when avoidable

These are not cosmetic concerns. They directly influence trust.

## 46. Why the Product Matters

UniBoard AI matters because it solves a real educational coordination problem.

Students need clarity.

Teachers need visibility.

Institutions need continuity.

AI is only valuable when it is embedded into a real workflow with permissions, structure, and context. UniBoard AI is built around that principle.

## 47. Presentation-Ready Value Summary

If this product needs to be explained in presentation form, the strongest framing is:

UniBoard AI replaces fragmented academic collaboration with a real-time, structured, AI-assisted workspace for universities.

Students get one place to ask, post, save, study, and collaborate.

Teachers get one place to monitor, summarize, moderate, and intervene.

Institutions get structured academic memory instead of semester-by-semester information loss.

The backend is real-time.

The frontend is responsive.

The AI is grounded.

The product is designed as academic infrastructure, not a novelty layer.

## 48. Final Positioning Statement

UniBoard AI is best understood as an academic command center.

It combines room-based collaboration, structured academic content, real-time system design, role-aware governance, and context-grounded AI into one cohesive educational platform.

Its differentiator is not just that it has AI.

Its differentiator is that the AI is integrated into a permission-aware academic system with reusable knowledge, teacher visibility, and operational workflows that solve real university problems.
