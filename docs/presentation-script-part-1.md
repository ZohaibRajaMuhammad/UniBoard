# UniBoard Presentation Script - Part 1

This script covers:
- login and signup
- dashboard
- saved posts
- notifications
- search page

## Spoken Script

"I will start with the user entry flow.

The first screen is login and signup. This is where the user authenticates through Clerk, and then the app syncs that identity into Convex. That matters because the rest of the workspace, including rooms, posts, notifications, and saved content, all depend on the correct user record being loaded.

For the demo, I can sign in as a student, teacher, or super admin. The seeded accounts are already aligned to the live workspace data, so every role can show its own dashboard behavior.

After login, the user lands on the dashboard. The dashboard is the control center of the platform. It shows joined rooms, upcoming deadlines, workspace momentum, room previews, and a short AI briefing. The goal here is to give the user an immediate summary of what needs attention without making them open multiple pages.

Next is Saved Posts. This is the personal reference space. When a user saves a post, it is stored for later review, which is useful for deadlines, important explanations, and reusable class material. In practice, this works like an academic bookmark list.

After that is Notifications. Notifications are not just a visual badge. They are live records created from room activity such as new posts, comments, replies, pinned content, resolved questions, assignment submissions, room invitations, and upvotes. The user can open the notification and go directly to the source context.

The last screen in this section is Search. Search lets the user find room content across authorized data. It covers posts, deadlines, resources, questions, and tags. This is important because it turns the platform into a searchable academic workspace instead of a set of isolated feeds.

So this first part of the demo shows the basic product loop: authenticate, see the dashboard, save important content, respond to alerts, and find information quickly."

## Short Demo Notes

- Keep the login explanation simple and practical.
- Emphasize that the dashboard is live and role-aware.
- Use Saved Posts as a personal study tool example.
- Explain notifications as data-backed events, not static UI badges.
- Frame search as authorized workspace discovery.
