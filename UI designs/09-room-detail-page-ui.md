# Room Detail Page UI

## Page Purpose
- Provide the core collaborative classroom feed with posting, replies, AI help, and instructor cues.

## Visual Intent
- This page should feel active, content-rich, and academically engaged without looking like a generic social feed.

## Layout Structure
- Sidebar remains visible on desktop
- Main feed column capped around 760px to 780px
- Optional right rail or teacher panel
- Composer anchored near bottom of content flow
- AI summary bar or panel near top

## Exact Spacing Tokens
- main content padding: 24px to 28px vertical, 28px to 32px horizontal
- feed column max width: 760px to 780px
- feed card gap: 12px
- post internal padding: 16px to 20px
- composer top margin: 18px
- comment indent spacing: 16px
- right rail width: 300px to 340px when visible

## Exact Component Composition Tree
RoomDetailPage
  AppShell
    Sidebar
    FeedRegion
      RoomHeader
      AiSummaryBar
      FeedList
        PostCard
          AuthorRow
          Body
          Meta
          ActionRow
          CommentThread?
      Composer
        TypeSelector?
        Textarea
        AiSuggestionBar
        SubmitArea
    TeacherPanel?
    SummaryDrawer?
    MobileBottomNav

## Core UI Components
- room header
- feed posts
- vote/comment/save actions
- comment threads
- composer
- AI suggestion chips
- teacher panel
- summary drawer

## Responsive Behavior
- Desktop keeps multi-zone experience
- Tablet collapses right-side tools before compressing the feed
- Mobile prioritizes feed and composer, turning side tools into overlays

## Exact Breakpoint Rules
### Desktop
- Desktop uses three-zone logic when teacher rail is present
- Keep feed as the visual center of gravity
- Allow composer to remain directly tied to feed context

### Tablet
- Collapse teacher rail first
- Keep feed column wide enough for long academic text
- Turn summary or teacher tools into overlays if width is constrained

### Mobile
- Hide sidebar and right rail
- Use full-width feed cards
- Convert secondary tools to overlays and keep composer immediately reachable

## Typography And Tone
- Conversational and analytical at the same time, with strong content hierarchy.

## Interaction And State Rules
- Use consistent hover, focus, loading, error, success, and disabled states.
- Preserve spacing rhythm even when modules collapse.
- Keep primary actions visually dominant over secondary actions.
- Maintain dark-surface contrast and readable metadata hierarchy.
- Avoid local one-off component variants unless the page has a strong structural reason.

## Implementation Notes
- Post types need immediate visual distinction
- Do not let metadata compete with core post text
- Composer must stay inviting but compact
