# Ocean Frontend Plan

This document outlines the step-by-step implementation plan for building the frontend of the Ocean project based on the provided Figma design.

---

## 📌 Phase 1 – Setup

- [ ] Set up project using chosen framework (e.g., SvelteKit, React, etc.)
- [ ] Install TailwindCSS and any necessary dependencies (icons, state management, router)
- [ ] Set up routing structure
- [ ] Create `Layout` component with persistent sidebar navigation

---

## 📌 Phase 2 – Page Integration

> Each page in this section will be added as a **component**, loaded inside the layout (except for full-screen pages).

- [ ] Feed Page (`Feed.svelte` / `Feed.jsx`)
- [ ] Product Page (`Product.svelte` / `Product.jsx`)
- [ ] Notification Page
- [ ] Saved Page
- [ ] Distress Sale Page
- [ ] Auctions Page
- [ ] Upload Page
- [ ] Settings Page
- [ ] Email Verification Page
  - Verify email tokens
  - Handle resend verification email
  - Show success/error states
  - Redirect to appropriate pages

---

## 📌 Phase 3 – Full Screen Page (Message)

> Message page will NOT use the layout wrapper. It renders full screen.

- [ ] Create a separate route for `Message` page (e.g., `/message`)
- [ ] Implement chat UI and logic

---

## 📌 Phase 4 – Shared UI Components

- [ ] Sidebar Navigation
- [ ] Header / Topbar (search, notifications, etc.)
- [ ] Feed Card Component
- [ ] Comment Box
- [ ] Profile Badge
- [ ] Image Carousel (for posts/products)
- [ ] Chat Message Component (inbox + chat screen)
- [ ] User Profile Card

---

## 📌 Phase 5 – Responsive Behavior

- [ ] Test and fix responsive layout (mobile/tablet/desktop)
- [ ] Sidebar behavior for mobile
- [ ] Message page responsive adjustments

---

## 📌 Phase 6 – Polishing

- [ ] Smooth transitions & page animations
- [ ] Add skeleton loaders / loading states
- [ ] Implement hover & active states
- [ ] Dark mode support (if required)
- [ ] Final pixel-perfect matching with Figma

---

## 📌 Phase 7 – Testing

- [ ] Functional test for each component
- [ ] Cross-browser testing
- [ ] Final responsive sweep

---

## 📝 Notes
- Cursor will prompt for **screenshots of each page** before development begins.
- Only the `Message` page is a full page. All others render inside layout.
- Prioritize clean component separation to enable easy backend hookup later.
- Stick to the Figma layout & colors strictly.

---

✅ Once each page is confirmed via screenshot, start building its component.

