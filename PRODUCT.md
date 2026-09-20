# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (React) with CSS Modules. Data stored in local JSON (data.json).

## Users

- **Primary:** Wedding guests (viewing the invitation, reading stories, confirming RSVP, leaving guestbook messages).
- **Secondary:** Bride and Groom (administering the content, managing guest list, tracking RSVPs).

## Product Purpose

To provide a beautiful, interactive, and romantic digital wedding invitation that informs guests about the event, shares the couple's journey, showcases their photos, and collects attendance confirmations (RSVP). Success means guests are impressed by the elegance and can easily navigate and RSVP, especially on mobile.

## Positioning

A premium, highly personalized "Liquid Glass" style invitation that feels like a modern, high-end digital experience rather than a basic template.

## Operating Context

- **Environment:** Mostly viewed on mobile phones by guests on the go.
- **Workflows:** Admin fills out info -> generates links -> sends to guests -> guests view and RSVP -> Admin checks RSVPs.

## Capabilities and Constraints

- Mobile-first responsiveness and fast loading are critical.
- Real-time updates via Admin UI backed by data.json.
- Visual theme is strictly Liquid Glass (glassmorphism), Beige/White/Gold gradient, romantic, smooth decelerating animations (cubic-bezier).

## Brand Commitments

- Font: Fleur De Leah for prominent names, romantic aesthetic.
- Embellishments: Floating flowers, Cat cursor for guests, 🍀💚 in Guestbook.
- Tone: Elegant, romantic, welcoming.

## Evidence on Hand

- Existing React codebase (src/components/InvitationUI.js, src/app/admin/page.js).
- Assets: Logo, background images, gallery photos (mocked or uploaded by user).
- Existing styling in Invitation.module.css.

## Product Principles

1. **Elegance First:** Every visual decision should feel premium, smooth, and deliberate.
2. **Performance matters:** Ensure fast load times on mobile devices.
3. **Admin Simplicity:** The couple should be able to update all text and images easily without touching code.
