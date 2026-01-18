# Project Plan: greenhousemd.org

## Goal

Establish greenhousemd.org as the premier digital ecosystem for mental health development, seamlessly integrating diverse services and resources to empower both patients and professionals. Our platform will foster a trusted, supportive, and accessible environment, driving engagement and advancing mental well-being while upholding the highest standards of privacy and accessibility.

---

## Phase 0: Define Objectives & Success Metrics

### Objectives
- Increase qualified bookings (adult + child) and telehealth adoption.
- Build trust via credentials, outcomes, and warm design.
- Reduce staff time spent answering repetitive questions.

### KPIs (track in analytics)
- Booking conversion rate (homepage → booked consult).
- Calls/Clicks on “Book” or phone number.
- Form completion rate & abandonment points.
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms.
- Accessibility score ≥ 95 (axe/lighthouse); WCAG 2.2 AA compliance.

### Non-negotiables
- HIPAA-aware data handling (no PHI through non-BAA tools).
- Clear pricing & insurance info.
- English/Spanish support.

---

## Phase 1: Discovery & Audit

### Inputs
- Current site map, analytics (if any), hosting details, booking flow.
- Brand assets (logo, colors, type), photography, testimonials.

### Activities
- Content inventory & gap analysis (pages, PDFs, forms).
- UX teardown of current flows (home → book, services → book).
- Competitive benchmark (top 5 peers), tone & messaging analysis.
- Identify PHI touchpoints (forms, chat, email).

### Deliverables
- Audit report with prioritized issues (P0/P1/P2) and quick wins.
- Updated sitemap draft.
- Risk log (HIPAA, security, legal copy needs).

---

## Phase 2: Information Architecture (IA)

### Sitemap (proposed)
- **Home**
- **About**
    - Our Story & Philosophy
    - Dr. Green & Team
- **Services**
    - Adults (Medication Mgmt, Psychotherapy)
    - Children & Adolescents
    - Family & Couples
- **Conditions** (Anxiety, ADHD, Depression, Bipolar, OCD, Trauma, etc.)
- **Patients**
    - What to Expect
    - Fees & Insurance
    - Telehealth
    - Intake Forms
- **FAQs**
- **Resources** (Articles, Guides, Videos – EN/ES)
- **Book Appointment**
- **Contact**

### Acceptance criteria
- Every page answers “Who is this for? What does this help with? What’s next?”
- Max 3 clicks from Home to any service booking.

---

## Phase 3: UX & Wireframes

### Key flows to wireframe
- Homepage → Service → Book
- Homepage → Fees & Insurance → Book
- Condition page → Book
- Spanish homepage → Book
- Telehealth onboarding (pre-visit checklist).

### Components to define
- Header with sticky “Book” button; language toggle (EN/ES).
- Trust blocks (credentials, affiliations, testimonials, outcomes if available).
- Service cards with “What we treat,” “How it works,” “Who it helps,” clear CTAs.
- Pricing table with insurance guidance and OON instructions.
- FAQ accordion; contact options; emergency disclaimer.

### Deliverables
- Low-fidelity wireframes (mobile-first + desktop).
- Clickable prototype for the 5 key flows.

---

## Phase 4: Visual Design & Design System

### Brand refresh (light-touch)
- **Color palette:** soothing greens + neutral sand/stone; accessible contrast.
- **Typography:** modern, friendly sans (e.g., Inter/Source Sans) + humanist serif for headings.
- **Imagery:** real people, natural light, plants; avoid stock clichés; alt text for all.

### Design tokens
- Colors, spacing, radii, shadows, typography scale, motion timings.

### UI kit
- Buttons, inputs, selects, toggles, alerts, cards, tabs, accordions, breadcrumb, pagination, toast.
- **Illustration style:** subtle “growth” motifs (leaf/vine), motion on hover/scroll that respects reduced-motion.

### Deliverables
- Figma library + page templates (Home, Service, Condition, Fees, Article, Book, Contact, 404).

---

## Phase 5: Content Strategy & Production

### Voice & tone
- Warm, plain language; strengths-based; inclusive; trauma-informed.

### Microcopy examples:
- **CTA:** “Book a compassionate consult”
- **Fees:** “No surprises—transparent pricing and help with claims.”
- **Telehealth:** “Private, secure video sessions from home.”

### Pages to (re)write
- Home hero (promise + proof) with primary CTA.
- Services & Conditions pages (problem → approach → what to expect → CTA).
- About/Team bios (credentials + personal philosophy).
- Fees & Insurance (pricing table, OON steps, sliding scale policy, accepted plans).
- Spanish translations (human-verified).

### Content governance
- **Editorial calendar (2 articles/month):** Topics: sleep hygiene, teen therapy, ADHD supports, how medication management works, coping with anxiety.
- **Style guide:** (inclusive language, reading level ~8th grade).

### Structured data
- Schema.org for MedicalBusiness/Physician, FAQ, Article, LocalBusiness.

---

## Phase 6: Technology & Implementation

### Recommended stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion.
- **CMS:** Headless (Sanity/Contentful) or WordPress (headless) with role-based editing.
- **Forms:** HIPAA-eligible vendor or in-house with secure backend; e-signature for intake (BAA required).
- **Search:** Algolia or lightweight client search for resources.
- **i18n:** next-intl or next-i18next with translated slugs.

### Performance budget
- Images via next/image + CDN; lazy-load below the fold.
- Third-party scripts kept to an absolute minimum; defer and use consent gating.
- Total JS on critical path under agreed KB budget; prefetch routes.

### Accessibility
- WCAG 2.2 AA; keyboard-first nav; visible focus states; ARIA only where semantic HTML can’t.
- Color contrast ≥ 4.5:1, alt text, captions/transcripts for video; skip links.

### Security & privacy
- HTTPS/HSTS; TLS 1.2+; strong CSP; Referrer-Policy; XFO; SRI for CDNs.
- Rate-limit & spam protection on forms; server-side validation.
- Cookie banner with granular consent; avoid sending PHI to analytics.
- Only use vendors offering BAA for any PHI (forms, chat, video, email).

### Infrastructure
- **Hosting/CDN:** Vercel/Cloudflare/Netlify; image optimization enabled.
- **Environments:** dev, staging, prod with preview deployments per PR.
- Backups & rollback plan; uptime monitoring.

---

## Phase 7: Integrations & Booking

### Scheduler
- Integrate EHR-native scheduler if available; otherwise vetted HIPAA-eligible scheduling.
- Expose real-time availability; confirmation emails/SMS via HIPAA-eligible provider.

### Telehealth
- HIPAA-eligible video platform; device test page; pre-visit checklist; fallback to phone if needed.

### Payments
- Online payments only via vendors who offer BAA (or collect no PHI). Clear refund/cancellation policy.

### FAQ/Chat
- Searchable FAQ first; optional chatbot trained on site content only; turn off unless consented.

---

## Phase 8: SEO & Local Presence

- Title/meta and H1 hygiene across templates.
- Clean URLs; canonical tags; XML sitemap; robots.txt; breadcrumbs.
- **Local SEO:** Google Business Profile optimization; consistent NAP; embedded map; driving/parking info.
- Internal linking: Services ↔ Conditions ↔ Resources.
- Open Graph & Twitter cards; favicons; app icons.

---

## Phase 9: Analytics & Measurement

- **Privacy-first analytics:** (GA4 or Plausible/Matomo). No PHI in events/URLs.
- **Events:** click Book, start form, submit form, call link, language toggle, telehealth start.
- Funnels & cohort tracking for service lines (Adult/Child/Family).
- **Error monitoring:** (Sentry) with PII scrubbing.

---

## Phase 10: QA & Compliance

### Functional
- All forms validate client + server side; confirmation emails tested; 404/500 pages friendly.

### Cross-device
- Test on iOS/Android, Safari/Chrome/Edge/Firefox; smallest to largest breakpoints.

### Accessibility
- Automated (axe) + manual keyboard testing; screen reader smoke test (NVDA/VoiceOver).

### Security
- Dependency scan; headers verified; CSP report-only trial before enforce.

### Content
- Proofread EN/ES; medical disclaimers; emergency info on every page footer.

---

## Phase 11: Launch & Post-Launch

### Launch checklist
- DNS cutover; SSL; 301s from old URLs; search console & sitemap submitted.
- Performance re-test; image/CDN checks; consent banner live.

### Post-launch
- Monitor vitals, error logs, and booking funnel.
- A/B test hero copy, pricing layout, CTA language.
- Quarterly accessibility and security audits.

---

## Backlog of “Best-in-Class” Enhancements

- Video welcome from Dr. Green + team; short animated explainer.
- Resource finder (filter by audience: adult, teen, parent; and by topic).
- Outcomes & impact page (de-identified stats, patient satisfaction, wait time reduction).
- Community page (talks, events, partnerships, scholarships).
- Spanish content parity and culturally-relevant examples.

---

## RACI (example roles)

- **Owner:** Practice lead / Dr. Green.
- **Project manager:** Coordinates phases, timelines, approvals.
- **Design:** UX/UI + accessibility lead.
- **Content:** Medical copywriter + translator (EN/ES).
- **Engineering:** Frontend + backend + DevOps.
- **Compliance:** HIPAA/privacy counsel.

---

## Acceptance Criteria (Go-Live)

- All P0 issues closed; HIPAA-impacted flows reviewed.
- Core Web Vitals within budget on mobile.
- WCAG 2.2 AA verified.
- Booking conversion uplift from baseline.
- Editorial workflow: anyone on the team can publish EN/ES resources without dev help.

---

## Next Practical Step

1.  **Pick CMS** (Sanity vs WordPress headless) and **booking vendor** (EHR-native if possible).
2.  I’ll then produce:
    - Mobile-first wireframes for the 5 key flows.
    - Copy deck templates (EN/ES) for Home, Services, Fees, Telehealth.
    - A development plan with tasks broken into tickets (GitHub/Jira).
