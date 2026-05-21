---
name: vizinho-indica-code-review
description: Review code changes for the Vizinho Indica React Native + Expo MVP with focus on product regressions, resident/admin access rules, recommendation and moderation flows, Supabase versus mock-data consistency, and practical validation steps. Use when reviewing pull requests, local diffs, bug fixes, refactors, new screens, repository changes, navigation changes, or data-layer changes in this project.
---

# Vizinho Indica Code Review

Review changes with a product-first mindset. Prioritize concrete bugs, broken flows, missing guards, data consistency problems, and gaps between mock behavior and Supabase behavior.

Read [references/project-context.md](references/project-context.md) before a substantial review or whenever the touched files include navigation, repositories, auth/session, moderation, or recommendation flows.

## Review Workflow

1. Identify the changed files and map them to the user flow they affect.
2. Classify the change area: auth/access, resident flow, admin flow, data layer, navigation, or visual-only.
3. Review the diff for behavior regressions before style concerns.
4. Verify whether the change behaves the same in mock mode and Supabase mode when both paths exist.
5. Run targeted validation when it is cheap and relevant, especially `npm test`, `npm run typecheck`, or both.
6. Report findings first, ordered by severity, with file and line references.

## Project Review Priorities

### 1. Access And Role Safety

Protect the product gates.

- Check whether only `approved` residents and `admin` users can reach resident areas.
- Check whether admin-only screens or actions are exposed through navigation, buttons, or missing guards.
- Check session refresh and sign-out flows for stale user state.
- Treat changes around `AppContext`, auth repositories, and navigation guards as high risk.

### 2. Recommendation Integrity

Protect trust in the marketplace.

- Do not allow duplicate providers to slip in because phone normalization, category mapping, or repository checks changed.
- Preserve the rule that new recommendations and reviews require confirmed real usage.
- Check whether rating averages, review counts, latest comments, and hidden/deleted content still recalculate correctly.
- Watch for changes that can silently lose photos, comments, moderation metadata, or timestamps.

### 3. Moderation And Admin Operations

Protect the admin workflow.

- Confirm that report resolution updates both the report state and the provider/review visibility when required.
- Confirm that moderation removes only the intended comment, photo, review, or provider.
- Look for partial updates that leave the UI inconsistent after an admin action.
- Flag any missing audit fields such as deleted/resolved timestamps or acting admin id.

### 4. Mock Versus Supabase Consistency

This project still supports a split between simulated data and real backend behavior. Treat mismatches as first-class review findings.

- If a function branches on `isSupabaseConfigured()`, compare both paths.
- Check whether validation rules, sort order, filtering, and returned shapes match closely enough across both modes.
- Flag cases where one path updates analytics, moderation, access status, or derived values and the other path does not.
- Flag misleading UX where the screen implies real persistence but the action is still local-only.

### 5. Navigation And Screen Flow

Protect the resident and admin journeys.

- Check route params after screen renames or type changes.
- Confirm that tab, stack, and detail flows still open the intended screen.
- For form screens, check loading, success, and error states, not only the happy path.
- Flag changes that make users lose context after submitting, rejecting, moderating, or going back.

### 6. Product Clarity In UI Changes

Flag UI changes that make the MVP less trustworthy or harder to understand.

- Error messages must explain what the resident or admin should do next.
- Labels around approval status, moderation, WhatsApp contact, and confirmed use must remain clear.
- Do not accept UI text that hides whether data is simulated, pending approval, removed by moderation, or unavailable.

## File Hotspots

Treat these areas as extra sensitive:

- `src/services/mockApi.ts`: fallback business logic, local state, derived metrics, moderation behavior
- `src/services/AppContext.tsx`: session sync and app-wide auth state
- `src/navigation/*.tsx`: route access and flow continuity
- `src/repositories/*.ts`: real backend behavior and mapping
- `src/services/supabase/*.ts`: client configuration and environment gating
- `src/screens/*.tsx`: user-visible flow and messaging
- `supabase/migrations/*.sql`: permanent backend rules and data shape

## Expected Review Output

Use a code review format, not a rewrite plan.

- Start with findings only.
- For each finding, include severity, what breaks, why it matters for this product, and a file reference.
- Keep summaries brief and place them after the findings.
- If there are no findings, say that explicitly and mention residual risks or missing validation.

Use severity levels:

- `P0`: security issue, broken access control, data corruption, or a core flow that becomes unusable
- `P1`: major product regression in login, approval, recommendation, moderation, or navigation
- `P2`: important inconsistency, incorrect state, missing validation, or likely user confusion
- `P3`: lower-risk maintainability issue or polish gap

## Validation Guidance

Prefer lightweight proof over guesswork.

- Run `npm run typecheck` when TypeScript, navigation types, repositories, or shared types changed.
- Run `npm test` when repository logic, utilities, or existing tested behavior changed.
- If no automated check is run, say so.
- If a screen change is large, reason through the full resident or admin flow instead of reviewing components in isolation.

## Review Heuristics Specific To This Project

- Favor findings tied to condo trust, moderation safety, and approval gating over generic style comments.
- Flag changes that hardcode demo assumptions into real-data paths.
- Flag backend changes that are not mirrored in TypeScript types or mappers.
- Flag frontend changes that assume fields always exist when mock and Supabase records may differ.
- Be careful with date sorting, locale formatting, and optimistic assumptions about uploaded photos or signed URLs.
- Call out missing tests when business rules change, especially around provider creation, access approval, moderation, and search/filter behavior.
