# UniBoard

UniBoard is a structured academic collaboration platform for students, teachers, project groups, and institutional operators.

It brings classroom discussion, room-based collaboration, deadlines, resources, search, planning, moderation, analytics, and AI assistance into one organized workspace. The purpose of UniBoard is to replace scattered academic communication with a clear, searchable, governed, and intelligent system that people can use every day without feeling overwhelmed.

This README explains the application in plain language. It is written for technical and non-technical readers, including founders, teachers, students, administrators, reviewers, product managers, and stakeholders who need to understand what the platform does and how to explain it.

No technical implementation knowledge is required to understand this document.

---

## 1. Executive Summary

UniBoard is an academic operating workspace.

Most academic communication is fragmented across group chats, emails, screenshots, notes, classroom announcements, file links, and private conversations. Important information gets lost, questions are repeated, deadlines are missed, and teachers often have limited visibility into what students are confused about.

UniBoard solves this by organizing academic work into focused rooms.

Inside each room, users can create structured posts, discuss topics in threads, share resources, track deadlines, ask questions, save useful content, search past knowledge, and use AI assistance that is aware of room context.

The platform is designed around five major outcomes:

- Keep academic collaboration organized.
- Make important information searchable and reusable.
- Help students understand what matters next.
- Give teachers better visibility and moderation control.
- Use AI as a grounded knowledge companion, not as a disconnected chatbot.

In one sentence:

UniBoard is an AI-assisted academic collaboration workspace that helps classes, study groups, and institutions organize communication, deadlines, resources, knowledge, and room activity in one structured system.

---

## 2. The Problem UniBoard Solves

Academic collaboration usually breaks down because information lives in too many places.

A class may use one messaging app for questions, another platform for files, email for announcements, screenshots for deadlines, verbal reminders for clarifications, and informal student groups for exam preparation. This creates confusion because no single place holds the full academic picture.

Common problems include:

- Students ask the same questions again because old answers are hard to find.
- Deadlines are shared informally and then forgotten.
- Important teacher guidance disappears inside long message threads.
- Project teams lose track of blockers, responsibilities, and updates.
- Students hesitate to ask questions when they feel exposed.
- Teachers cannot easily see which topics are causing confusion.
- Institutions lose useful academic knowledge every semester.
- AI tools answer generally because they do not understand the actual class context.

UniBoard addresses these issues by creating a structured academic workspace where communication, knowledge, planning, and AI assistance all connect to the same room-based system.

---

## 3. What UniBoard Is

UniBoard is a room-based collaboration system built for academic work.

A room is a focused workspace for a class, subject, project, lab, revision group, study circle, or supervised discussion area. Each room contains posts, comments, members, filters, activity signals, room settings, and optional AI support.

UniBoard is not just a chat application.

It is closer to an academic command center because it combines:

- room-based communication
- structured academic posts
- threaded discussion
- deadline tracking
- searchable academic memory
- personal planning
- teacher moderation
- institutional governance
- AI summaries and answers
- role-aware permissions

The goal is to help users move from scattered communication to organized academic action.

---

## 4. Who UniBoard Is For

UniBoard serves multiple audiences, but each audience uses the system differently.

## Students

Students use UniBoard to understand their academic work more clearly.

They can:

- join rooms for classes, projects, and study groups
- read structured academic posts
- ask questions inside the correct room
- comment in focused threads
- track deadlines
- save important content
- search old explanations
- use AI help inside the knowledge base or room discussions
- manage planning around upcoming work

For students, UniBoard reduces confusion and makes academic information easier to recover.

## Teachers

Teachers use UniBoard to guide, supervise, and organize academic collaboration.

They can:

- create or supervise official rooms
- post announcements
- share deadlines
- answer questions
- pin important guidance
- monitor room activity
- moderate content
- review participation signals
- use room summaries to understand discussion faster
- rely on structured posts instead of repeating the same answer in many places

For teachers, UniBoard reduces repeated explanation and improves visibility into student needs.

## Project Groups

Project groups use UniBoard as a focused workspace for coordination.

They can:

- create project updates
- track blockers
- share resources
- assign discussion around milestones
- keep decisions visible
- use AI to summarize context or clarify next steps

For project teams, UniBoard makes collaboration more traceable and less dependent on scattered chat history.

## Administrators and Super Admins

Administrative users use UniBoard to manage the health and governance of the platform.

They can:

- review user access
- approve teacher role requests
- oversee rooms
- manage archived rooms
- monitor governance needs
- support controlled academic operations

For administrators, UniBoard provides institutional control without removing the everyday usability students and teachers need.

---

## 5. Product Philosophy

UniBoard follows a practical product philosophy.

## Academic Work Comes First

The platform is designed for learning, coordination, explanation, deadlines, and academic discussion. It is not designed to maximize casual engagement or social noise.

## Structure Creates Clarity

Different academic messages have different meanings. A deadline is not the same as a question. A resource is not the same as an announcement. A project update is not the same as a normal note.

UniBoard separates these content types so users can scan and filter rooms more easily.

## Context Matters

The meaning of a post depends on the room, the author, the thread, the role of the user, and the surrounding discussion. UniBoard keeps context attached to academic content instead of flattening everything into one generic feed.

## AI Must Be Grounded

AI in UniBoard is intended to answer from available workspace context whenever possible. It should be concise, professional, and useful. It should avoid pretending to know things when the room knowledge is weak or unavailable.

## Governance Is Part of the Product

Academic collaboration needs trust. UniBoard includes role control, moderation, teacher approval, room visibility rules, and administrative oversight so the platform can scale beyond informal student groups.

## Calm Interface, Strong Function

The experience should feel stable, readable, and operational. UniBoard is meant to support repeated academic use, not distract users with unnecessary visual noise.

---

## 6. Core Concepts

UniBoard is easiest to understand through its core concepts.

## Rooms

Rooms are the main workspaces. Every major academic conversation happens inside a room.

A room may represent:

- a course
- a class section
- a project team
- a study group
- a lab
- a revision space
- a discussion area

Rooms keep collaboration organized by context.

## Posts

Posts are the primary units of communication.

Instead of treating every message as the same kind of content, UniBoard gives posts types such as notes, deadlines, questions, resources, announcements, polls, and project updates.

## Comments

Comments allow discussion under a specific post.

This keeps answers, clarifications, and follow-up questions attached to the correct academic context.

## Knowledge

Knowledge is the reusable value created by rooms, posts, comments, deadlines, and resources.

UniBoard is designed so useful academic information does not disappear after the moment it is posted.

## AI Assistance

AI helps users interpret and use workspace information.

It can support room summaries, knowledge base answers, post drafting, planning help, and replies when explicitly mentioned in a discussion.

## Governance

Governance defines who can create, join, moderate, approve, archive, and manage different parts of the platform.

This is what makes UniBoard suitable for serious academic environments.

---

## 7. Main Product Areas

UniBoard includes several major areas:

- landing and access screens
- dashboard
- room discovery
- room workspace
- post composer
- comment threads
- search
- knowledge base
- planner
- analytics
- notifications
- saved items
- leaderboard
- reputation
- profile
- settings
- admin portal
- AI assistant

Each area supports a specific part of the academic workflow.

---

## 8. Account Access and Onboarding

Users enter UniBoard through account sign-in or account creation.

After authentication, the platform needs to understand the user's academic identity. A login alone is not enough because UniBoard must know what role the person has and what level of access they should receive.

The onboarding flow helps establish:

- user identity
- academic role
- student or teacher intent
- department or batch context
- profile information
- access readiness

The platform can treat users as active or pending depending on their status.

## Pending Users

A pending user is someone who has an account but has not yet received full workspace capability.

This matters because teacher access and governed academic actions should not be available to every new user automatically.

Pending access supports:

- controlled onboarding
- teacher approval workflows
- safer institutional deployment
- clearer user governance

---

## 9. Roles and Permissions

UniBoard uses role-aware behavior so the platform can serve students, teachers, and administrators safely.

## Student

A student can participate in rooms, read posts, comment, ask questions, save content, search accessible knowledge, and use student-appropriate collaboration features.

Student room creation may be limited depending on governance rules. This prevents student-created spaces from being confused with official academic rooms.

## Teacher

A teacher has stronger academic authority.

Teachers may create or supervise official rooms, post announcements, moderate discussions, review activity, and guide students through structured academic content.

Teacher access should be trusted, so a professional platform treats teacher status as something that may require approval.

## Super Admin

A super admin manages the portal at a higher level.

This role can oversee governance, review access requests, manage user roles, supervise room state, and support platform health.

## Room-Level Authority

A user's platform role is not the only authority in the system.

Rooms can also have room-level membership and control. A person may be a member, moderator, or owner inside a room depending on their relationship to that workspace.

This gives UniBoard flexibility because authority can be global or room-specific.

---

## 10. Room Discovery and Joining

Users need ways to find and enter the rooms that matter to them.

Rooms can be public or private.

## Public Rooms

Public rooms are easier to discover.

They are useful for:

- open class discussions
- common study groups
- public academic communities
- accessible revision spaces

Users can browse public rooms and join them when allowed.

## Private Rooms

Private rooms are controlled spaces.

They are useful for:

- official course groups
- teacher-led classes
- closed project teams
- sensitive academic discussions
- rooms that require supervised membership

Private rooms may require a join code or approved access.

## Why Join Rules Matter

Room access controls help prevent academic work from becoming exposed, disorganized, or misused. They also help teachers and administrators supervise the correct spaces without forcing every room to be public.

---

## 11. Room Creation

Room creation is one of the most important governance points in UniBoard.

A room is not just a container. It creates a new collaboration environment with members, posts, visibility, settings, moderation rules, and potentially AI behavior.

When a room is created, the creator defines its purpose and structure.

Important room properties may include:

- room name
- subject or academic category
- description
- visibility
- join behavior
- AI availability
- anonymous posting rules
- moderation expectations

## Student-Created Rooms

Student-created rooms can be useful for study groups and project collaboration.

However, they should be governed so that they do not appear to be official course spaces unless approved.

## Teacher-Created Rooms

Teacher-created rooms can represent official academic spaces.

These rooms may support announcements, deadlines, moderation, and structured class communication.

## Admin Governance

Administrators can oversee room behavior to ensure the portal remains organized and safe at scale.

---

## 12. The Dashboard

The dashboard is the user's main entry point after sign-in.

It helps users quickly understand:

- which rooms they belong to
- what activity needs attention
- which deadlines are coming
- whether their workspace is active
- what AI guidance is available

The dashboard is not just a navigation page. It is a workspace overview that helps the user decide where to go next.

For a student, the dashboard answers:

- What rooms should I check?
- Are there deadlines coming?
- What needs my attention?

For a teacher, it answers:

- Which rooms are active?
- Where might students need help?
- What academic activity is happening?

---

## 13. The Room Workspace

The room workspace is the center of daily use.

Inside a room, users can:

- read posts
- create posts
- comment in threads
- filter the feed
- view room intelligence
- see active member presence
- access pinned guidance
- use AI mentions
- open teacher tools when permitted
- switch between feed views

The room screen is designed to keep posts as the primary collaboration surface while still giving users enough context to understand the room state.

## Room Intelligence

Room intelligence is the operational overview at the top of the room.

It communicates:

- workspace identity
- current room state
- AI availability
- member and post counts
- room visibility
- feed mode
- available actions
- content filters

The purpose is orientation. A user should quickly understand what room they are in, what is happening, and what they can do next.

## Presence

Presence shows active room participation.

This gives users awareness that the room is alive without turning the workspace into a noisy chat interface.

## Feed Views

The room can support multiple reading modes.

Overview mode helps users understand room context first.

Split feed mode balances the post stream with room context.

Full feed mode gives maximum attention to posts, comments, and continuous reading.

## Pinned Context

Pinned posts or guidance allow important information to stay visible.

This is useful for:

- assignment rules
- official clarification
- project requirements
- exam guidance
- frequently referenced resources

---

## 14. Post Types

UniBoard uses structured post types so academic content is easier to scan, filter, search, moderate, and reuse.

## Note

A note is a general academic update.

It can be used for:

- explanations
- reminders
- class observations
- normal updates
- revision points

## Deadline

A deadline is a time-sensitive academic item.

It can be used for:

- assignment due dates
- exam schedules
- submission cutoffs
- project milestones
- lab report deadlines

Deadline posts are important because they can feed planning, urgency awareness, and academic reminders.

## Question

A question is used when someone needs clarification.

It can be used for:

- concept confusion
- assignment instructions
- project uncertainty
- exam preparation
- teacher clarification

Question posts are valuable because they often become reusable knowledge after they are answered.

## Resource

A resource is supporting academic material.

It can be used for:

- links
- readings
- slides
- references
- videos
- guides
- external learning material

## Announcement

An announcement is formal room communication.

It is typically used by teachers or authorized users for important updates that should stand above ordinary discussion.

## Poll

A poll is used for lightweight group decisions or preference collection.

It can help choose:

- meeting times
- project options
- revision topics
- group preferences

## Project

A project post is used for group coordination.

It can include:

- milestones
- blockers
- ownership
- deliverables
- demo risks
- progress updates

This post type helps teams separate project work from general class discussion.

---

## 15. Posting Workflow

The post composer is how users add new academic content to a room.

A typical post workflow includes:

- choosing the post type
- writing the main message
- adding relevant details
- adding tags when useful
- adding deadline information when the post is time-sensitive
- adding resource information when sharing material
- deciding whether anonymous posting is appropriate
- publishing the post into the room feed

The composer is designed to make structured posting fast.

The purpose is not to slow users down. The purpose is to preserve meaning so the platform can filter, search, summarize, and reuse academic content later.

## Anonymous Posting

Anonymous posting can help students ask sensitive or basic questions without fear of embarrassment.

This is useful in academic environments because many students avoid asking questions publicly even when they need help.

Anonymous posting must still respect room rules and moderation controls.

## AI-Assisted Drafting

The platform can help users improve or draft academic posts.

This is useful when a user knows what they want to say but wants a clearer structure, better wording, or a more professional tone.

AI drafting should support the user. It should not replace the user's academic responsibility.

---

## 16. Comments and Replies

Comments keep discussion attached to the correct post.

This is important because a room can contain many topics at the same time. Without threaded comments, answers and clarifications become scattered and hard to recover.

Users can:

- reply to a post
- continue a focused discussion
- ask follow-up questions
- mention the AI assistant
- receive AI replies in context
- delete or moderate comments when permitted

Threaded discussion makes the room more useful over time because answers stay connected to the original academic question.

---

## 17. AI Mentions Inside Posts and Comments

Users can call the AI assistant directly inside a room discussion by mentioning it.

This is useful when a user wants help without leaving the thread.

The AI mention flow is designed to consider:

- the user's actual question
- the room where the request happened
- the post content
- the parent comment when relevant
- nearby discussion context when available
- accessible room knowledge

Good AI mention behavior should:

- answer the specific question
- stay concise
- use room context
- avoid generic filler
- reply in the correct discussion location
- ask for clarification when the question is too vague

Example:

A student posts a question about a database topic and mentions the AI. The AI should answer in that room context, not as a random general chatbot.

If the user writes a vague request, the system should make the limitation clear rather than silently failing or pretending to know the answer.

---

## 18. Search

Search helps users recover academic information that already exists in accessible rooms.

Users can search for:

- posts
- deadlines
- resources
- questions
- explanations
- project discussions
- room-specific topics

Search is important because academic questions repeat. A good search system reduces repeated effort by helping users find what has already been discussed.

## Search Behavior

Search should be permission-aware.

Users should only see content they are allowed to access.

Search should also handle imperfect data gracefully. If a result is incomplete or malformed, the experience should remain stable instead of breaking the entire screen.

## Search Suggestions

Suggestions help users discover common search terms and reduce effort.

They are especially useful when users do not know the exact wording of an old post.

---

## 19. Knowledge Base

The knowledge base is the central academic intelligence surface in UniBoard.

It allows users to ask questions against the information available inside their accessible workspace.

The knowledge base is different from normal search.

Search finds content.

The knowledge base interprets content and produces an answer.

## What the Knowledge Base Is For

It helps users:

- recover old explanations
- understand previous discussions
- find which room contained a topic
- summarize academic context
- answer questions from accessible workspace knowledge
- reduce repeated teacher explanations

## How It Should Behave

A strong knowledge base answer should:

- be grounded in accessible content
- be clear and concise
- cite or point to supporting context when possible
- avoid unsupported certainty
- explain when the available evidence is weak
- invite a better prompt when the question is too vague

## Why It Matters

The knowledge base turns room history into reusable academic memory.

This is one of the most important long-term advantages of UniBoard. Over time, useful answers and resources become easier to recover instead of disappearing inside old discussions.

---

## 20. Global AI Assistant

The global AI assistant is a workspace companion available outside a specific thread.

It can help with:

- workspace briefing
- room-related questions
- deadline awareness
- planning support
- knowledge base queries
- learning profile insights
- drafting help
- general academic navigation

The assistant is meant to be useful and restrained.

It should help users act faster, not flood them with unnecessary text.

## AI Response Standard

AI responses should be:

- professional
- concise
- grounded
- relevant
- structured
- honest about uncertainty

The assistant should not behave like an unrestricted public chatbot when the user is asking about room-specific academic content.

---

## 21. Planner

The planner helps users turn academic information into action.

It can bring together:

- upcoming deadlines
- manually created deadline items
- room-derived deadline signals
- urgency levels
- planning recommendations
- calendar-oriented output

The planner is useful because academic users often know what is due but still struggle to organize when to do it.

The planner helps answer:

- What is coming soon?
- What should I prioritize?
- Which deadlines are risky?
- What can I plan around this week?

---

## 22. Notifications

Notifications keep users aware of important activity.

They can represent:

- new posts
- comments
- replies
- mentions
- announcements
- reactions
- room activity

The purpose is awareness without constant manual checking.

Good notification behavior should avoid overwhelming the user. It should surface meaningful academic events without turning the platform into a distraction machine.

---

## 23. Saved Items

Saved items give each user a personal academic memory list.

Users can save content such as:

- useful explanations
- deadline posts
- resources
- important questions
- project updates
- teacher guidance

Saved items are useful because people often recognize that something matters before they know exactly when they will need it again.

---

## 24. Analytics

Analytics help teachers and operators understand academic activity.

Analytics can show:

- total posts
- room activity patterns
- content type distribution
- deadline pressure
- unresolved questions
- participation signals
- recent activity over time

For teachers, analytics answer:

- Is the room active?
- Are students asking questions?
- Are deadlines creating pressure?
- Are there unresolved discussions?
- Which areas need intervention?

Analytics should be operational. They should help people make decisions, not just display numbers.

---

## 25. Reputation and Leaderboard

UniBoard includes contribution visibility through reputation and leaderboard concepts.

The goal is not to turn academic work into a game.

The goal is to recognize helpful participation.

Reputation can reflect:

- useful posts
- comments
- reactions
- contribution quality
- consistent participation
- helpful academic behavior

Leaderboards can help surface constructive contributors and encourage students to support one another.

This feature should be handled carefully so it rewards meaningful help rather than empty activity.

---

## 26. Profile

The profile area represents the user's academic identity.

It may include:

- name
- avatar
- role
- department
- batch
- bio
- academic context
- onboarding state

The profile is important because UniBoard is not an anonymous-only tool. Most academic collaboration depends on identity, trust, and role clarity.

---

## 27. Settings and Appearance

Settings allow users to control their experience.

This can include:

- theme preference
- notification behavior
- account-related preferences
- workspace experience settings

## Dark Mode and Light Mode

UniBoard supports appearance control so users can switch between visual modes.

Dark mode is important for long study sessions and low-light environments.

Light mode is important for users who prefer higher brightness or institutional presentation settings.

The appearance system should apply consistently across the whole platform, including rooms, feeds, forms, dashboards, admin surfaces, and AI panels.

---

## 28. Admin Portal

The admin portal gives governance users a place to manage platform health.

It can support:

- teacher access review
- user role oversight
- room governance
- archived room management
- operational monitoring

The admin portal matters because academic software needs more than user-facing collaboration. It needs authority, review, and control.

## Teacher Approval

Teacher status should not be casually self-claimed in a serious academic platform.

Teacher approval helps protect:

- official announcements
- moderation authority
- room creation power
- student trust
- institutional credibility

## Room Governance

Administrators can supervise rooms to ensure they remain useful, safe, and aligned with the platform's academic purpose.

---

## 29. Teacher and Moderator Tools

Teachers and moderators need tools that normal participants do not need.

These tools can include:

- viewing room members
- reviewing room activity
- moderating posts
- hiding inappropriate content
- pinning important posts
- managing member behavior
- reviewing analytics
- supervising open questions

The goal is not to make rooms restrictive. The goal is to keep academic collaboration clear and trustworthy.

---

## 30. Moderation and Safety

Moderation protects the quality of the workspace.

A room may need moderation when:

- content is inappropriate
- a post is misleading
- discussion becomes disruptive
- a user violates room expectations
- anonymous posting is misused
- academic work needs official correction

Moderation actions can include:

- hiding content
- deleting content
- muting users
- banning users from a room
- pinning official guidance
- resolving questions
- archiving inactive rooms

Safety and moderation make the system more suitable for real academic use.

---

## 31. Room Settings

Room settings define how a room behaves.

Settings may include:

- room name
- description
- visibility
- join code behavior
- AI enablement
- anonymous posting rules
- moderation policies
- archive state

Room settings matter because not every academic room should behave the same way.

A public revision room, a private teacher-led class, and a student project room require different rules.

---

## 32. Room Lifecycle

A room has a lifecycle.

## Creation

The room is created for a class, subject, project, lab, or study purpose.

## Activation

Members join, posts begin, questions appear, deadlines are shared, and the room becomes a working space.

## Growth

The room accumulates explanations, resources, comments, pinned guidance, and knowledge.

## Maturity

The room becomes easier to search and summarize because it contains meaningful academic history.

## Archiving

When the room is no longer active, it can be archived or preserved.

Archived rooms still matter because they may contain useful academic memory.

---

## 33. AI Architecture in Plain Language

UniBoard's AI should be understood as a workspace-aware assistant.

It does not simply answer from nowhere. It should first consider the academic context available to the user.

The AI system can use:

- accessible room content
- posts
- comments
- deadlines
- room summaries
- planner context
- activity signals
- user intent

The AI should then decide whether it has enough useful context to answer.

If it has enough context, it should answer directly.

If it has partial context, it should qualify the answer.

If it does not have enough context, it should ask for a clearer question or explain the limitation.

This behavior is important because academic trust depends on accuracy.

---

## 34. AI Use Cases

UniBoard's AI can support several practical use cases.

## Room Summary

The AI can summarize what is happening inside a room so users and teachers can understand activity faster.

## Knowledge Question

The user can ask a question and receive an answer based on accessible academic information.

## Mention Reply

The user can mention the AI inside a post or comment and receive a contextual reply in the discussion.

## Post Drafting

The AI can help write clearer posts, announcements, updates, or academic explanations.

## Deadline Risk

The AI can help identify time-sensitive work and point users toward urgent items.

## Study Planning

The AI can help organize work into a practical study direction.

## Learning Profile

The AI can provide bounded insight into engagement or learning behavior where enough data exists.

---

## 35. Search vs Knowledge Base vs AI Mention

These three features are related, but they serve different needs.

## Search

Search is used when the user wants to find existing content.

Example:

"Find the post about API authentication."

## Knowledge Base

The knowledge base is used when the user wants an answer from accessible workspace knowledge.

Example:

"Which room discussed API authentication tradeoffs?"

## AI Mention

AI mention is used when the user wants help inside an active discussion.

Example:

"@UniBoardAI explain this Convex issue in the context of this post."

This distinction matters because each feature needs a different response style.

Search should retrieve.

Knowledge base should answer with grounding.

AI mention should reply briefly inside the thread.

---

## 36. Non-Technical Explanation of AI Grounding

AI grounding means the assistant should use the information inside the user's workspace instead of making unsupported guesses.

A simple explanation:

The AI reads the relevant room information it is allowed to see, then answers based on that context.

This helps avoid generic answers when the user is asking about a specific class, project, deadline, or discussion.

Grounded AI is important because:

- academic facts can be specific to a room
- deadlines change
- teacher instructions matter more than generic internet knowledge
- private room content should remain private
- users need trustworthy answers

---

## 37. Example User Journeys

## Student Asking a Question

A student enters a database engineering room, sees the room feed, creates a question post, and asks about a topic they do not understand.

Other members can reply in the thread.

The student can also mention the AI if they want a fast explanation based on the room context.

Later, another student can search or ask the knowledge base to recover the answer.

## Teacher Posting a Deadline

A teacher creates a deadline post for an assignment.

Students can see it in the room feed, the planner can surface it as upcoming work, notifications can make users aware, and analytics can show deadline pressure.

## Project Team Tracking Work

A project team creates project posts for milestones, blockers, and ownership.

Instead of losing decisions in chat, the room keeps project history visible.

AI can summarize the state of the room or help clarify next steps.

## Admin Reviewing Teacher Access

A user requests teacher access.

The admin reviews the request before granting teacher authority.

This prevents unverified users from gaining official academic powers.

---

## 38. Practical Use Cases

UniBoard can support many academic scenarios.

## Course Communication

Teachers and students use one room for announcements, questions, resources, and deadlines.

## Exam Revision

Students collect notes, ask questions, search old explanations, and save important material.

## Lab Coordination

Lab groups track requirements, questions, resources, deadlines, and project deliverables.

## Final Year Projects

Project teams organize progress, blockers, demo risks, resources, and supervisor guidance.

## Department Communities

Departments create spaces for shared academic updates and resources.

## Teacher Office Support

Teachers reduce repeated private questions by answering once in a structured room thread.

## Institutional Knowledge Retention

Rooms preserve useful discussion beyond one semester or one cohort.

---

## 39. Why Structured Content Matters

Structured content is one of UniBoard's strongest ideas.

When a user marks something as a deadline, question, resource, or project update, the platform can treat it intelligently.

Structured content improves:

- filtering
- search
- planning
- analytics
- AI retrieval
- moderation
- user scanning
- long-term knowledge reuse

This is why UniBoard should avoid becoming a generic wall of messages.

---

## 40. Why Governance Matters

Governance makes the platform credible.

Without governance:

- anyone could claim teacher authority
- official and unofficial rooms could blur together
- moderation would be weak
- public rooms could become noisy
- academic trust would decline

With governance:

- roles are clearer
- rooms are safer
- teacher authority is protected
- administrators can supervise the portal
- institutions can adopt the platform more confidently

---

## 41. Why the Room Screen Matters

The room screen is the most important daily workspace.

It must balance two needs:

- users need immediate access to posts
- users also need room context, status, filters, and actions

The ideal room screen should communicate:

- what room the user is in
- what the room is for
- whether AI is active
- how many members and posts exist
- what feed mode is active
- what filters are available
- how to create a post
- where to begin reading

If the room screen is too crowded, users feel stress.

If it hides the feed too deeply, users feel lost.

A strong room screen makes the post feed primary while keeping operational context nearby.

---

## 42. Enterprise Experience Standard

UniBoard should feel like professional academic infrastructure.

That means the experience should be:

- calm
- structured
- readable
- consistent
- role-aware
- responsive
- trustworthy
- scalable
- focused on action

It should avoid:

- noisy dashboards
- unclear hierarchy
- decorative clutter
- too many equal-priority controls
- unsupported AI confidence
- hidden primary workflows
- inconsistent dark mode
- confusing role behavior

The user should always understand where they are, what is happening, and what they can do next.

---

## 43. Feature Summary Table

| Feature | What it does | Why it matters |
| --- | --- | --- |
| Rooms | Creates focused academic workspaces | Keeps collaboration organized by class, project, or topic |
| Structured posts | Separates academic content by type | Makes content easier to scan, filter, and reuse |
| Comments | Keeps discussion attached to posts | Preserves context and avoids scattered answers |
| AI mentions | Lets users call AI inside a discussion | Keeps help inside the active workflow |
| Knowledge base | Answers questions from accessible workspace knowledge | Turns room history into reusable academic memory |
| Search | Finds accessible posts and content | Reduces repeated questions and lost information |
| Planner | Organizes deadlines and academic work | Helps users act on what is due |
| Analytics | Shows participation and activity signals | Helps teachers and operators make decisions |
| Notifications | Alerts users to relevant activity | Protects awareness without constant checking |
| Saved items | Stores important content for later | Supports revision and recall |
| Reputation | Recognizes useful contribution | Encourages helpful academic behavior |
| Admin portal | Manages roles and governance | Supports institutional control |
| Theme control | Supports dark and light appearance | Improves usability across environments |

---

## 44. How to Explain UniBoard to a Non-Technical Person

Use this explanation:

UniBoard is a digital academic workspace where each class or group gets its own room. In that room, people can post questions, deadlines, resources, announcements, and project updates. Everything stays organized, searchable, and connected to the right discussion. The AI helps users understand the information already inside the workspace, while teachers and administrators keep rooms governed and useful.

Shorter version:

UniBoard helps universities and students replace scattered classroom communication with one structured, searchable, AI-assisted academic workspace.

Even shorter:

UniBoard is a smarter, organized workspace for academic collaboration.

---

## 45. Stakeholder Value

## For Students

UniBoard gives students one place to understand rooms, deadlines, resources, questions, and AI help.

## For Teachers

UniBoard helps teachers organize communication, reduce repeated explanations, and supervise academic activity.

## For Project Teams

UniBoard gives teams a traceable space for updates, blockers, resources, and decisions.

## For Administrators

UniBoard provides role control, room governance, and institutional oversight.

## For Institutions

UniBoard creates reusable academic memory and reduces communication fragmentation.

---

## 46. Product Positioning

UniBoard can be positioned as:

An AI-assisted academic collaboration platform for structured rooms, searchable knowledge, deadlines, moderation, and planning.

It is not only a discussion tool.

It is not only a planner.

It is not only an AI assistant.

It is the combination of all of these inside one academic workspace that makes the product valuable.

---

## 47. What Makes UniBoard Different

UniBoard is different because it combines:

- academic rooms
- structured content types
- contextual discussion
- room-aware AI
- knowledge recovery
- deadline planning
- teacher moderation
- administrative governance
- contribution visibility
- search and saved items

Many tools solve one part of the problem.

UniBoard connects the whole academic workflow.

---

## 48. Quality Expectations

A mature UniBoard experience should meet the following standards.

## Reliability

Pages should load without client-side crashes. Public screens should degrade gracefully when external services are unavailable.

## Clarity

Users should understand each screen without needing instructions.

## Grounded AI

AI should answer from context when possible and avoid unsupported certainty when context is weak.

## Permission Safety

Users should only access rooms and knowledge they are allowed to see.

## Visual Consistency

Dark mode, light mode, cards, filters, forms, and panels should behave consistently across the platform.

## Workflow Completeness

Core actions such as joining rooms, posting, commenting, searching, planning, and asking AI should feel complete and visible.

---

## 49. Common Questions

## Is UniBoard a chat app?

No. UniBoard supports discussion, but it is structured around academic rooms, posts, deadlines, resources, and knowledge reuse.

## Is UniBoard a learning management system?

Not exactly. It is better described as an academic collaboration and intelligence layer. It can complement a formal learning management system by improving discussion, planning, and knowledge recovery.

## Why does UniBoard need AI?

AI helps users understand accumulated academic information faster. It can summarize rooms, answer knowledge questions, assist drafting, and respond inside discussions.

## Can students create rooms?

Student-created rooms can be useful for study groups and projects, but official academic room creation should be governed so authority remains clear.

## Why does teacher approval matter?

Teacher approval prevents unverified users from gaining official posting or moderation authority.

## Why are posts typed?

Post types make academic content easier to scan, filter, search, plan around, and summarize.

## What happens when AI does not have enough context?

The AI should say that the available information is not strong enough and ask for a clearer room, topic, or question.

## Is the knowledge base public?

The knowledge base should respect access rules. A user should only receive answers from content they are allowed to access.

---

## 50. Final Summary

UniBoard is built around a clear idea:

academic communication becomes more useful when it is structured, searchable, governed, and assisted by context-aware AI.

The platform gives users:

- rooms for focused collaboration
- posts for structured communication
- comments for contextual discussion
- deadlines for planning
- search for recall
- knowledge base answers for reuse
- AI mentions for in-thread help
- analytics for visibility
- moderation for trust
- admin tools for scale

For students, UniBoard reduces confusion.

For teachers, UniBoard improves visibility and reduces repetition.

For institutions, UniBoard preserves academic knowledge and provides a more organized collaboration layer.

The simplest way to remember UniBoard is:

UniBoard is a structured, searchable, AI-assisted academic workspace designed to make classroom and project collaboration clearer, safer, and more reusable.
