

# Adaline — SaaS Talent & Work Matching Platform

A clean, minimal freelance matching platform connecting business owners with freelancers through intelligent skill-based matching.

---

## 1. Landing Page
- Hero section with clear value proposition and CTA buttons ("Post a Project" / "Find Work")
- How it works section (3-step flow for both business owners and freelancers)
- Key benefits section
- Footer with links

## 2. Authentication & Onboarding
- Sign up / Sign in with email (Supabase Auth via Lovable Cloud)
- Role selection during onboarding: **Business Owner** or **Freelancer**
- Profile completion flow based on selected role

## 3. Freelancer Profile & Dashboard
- **Profile creation**: Name, bio, skills (tags), hourly rate, portfolio links, availability status
- **Dashboard**: View matched project opportunities, track submitted proposals and their statuses
- **Proposal submission**: Apply to projects with a cover message and rate quote

## 4. Business Owner Dashboard
- **Post a project**: Title, description, required skills, budget range, timeline, category
- **AI-powered description enhancement**: Using Lovable AI to refine and validate job descriptions for clarity
- **View matched freelancers**: Curated list of freelancers whose skills match project requirements
- **Manage proposals**: Review, accept, or decline freelancer applications

## 5. Skill-Based Matching Engine
- When a project is posted, automatically match it against freelancer skill profiles stored in Supabase
- Surface top matches on the business owner's dashboard
- Notify matched freelancers about new relevant opportunities

## 6. Email Notifications (Resend API)
- Notify freelancers when they match a new project
- Notify business owners when they receive a proposal
- Confirmation emails for key actions (project posted, proposal submitted)

## 7. Database Schema (Supabase / Lovable Cloud)
- **Users** table with role (business_owner / freelancer)
- **Profiles** table (skills, bio, portfolio, rates)
- **Projects** table (title, description, skills needed, budget, status)
- **Proposals** table (freelancer → project, message, status)
- Row-level security policies for data isolation

## 8. Design & UX
- Clean, minimal aesthetic with generous whitespace
- Mobile-responsive layouts
- Consistent card-based UI for projects and freelancer profiles
- Toast notifications for key actions

