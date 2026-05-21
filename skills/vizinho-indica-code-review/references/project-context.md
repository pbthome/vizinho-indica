# Vizinho Indica Project Context

## Product Shape

Vizinho Indica is a condo recommendation MVP. Residents share trusted providers and admins moderate access and content. The app depends on trust, clear approval states, and simple flows.

Core user journeys:

- Resident requests access
- Admin approves or rejects access
- Approved resident browses recommendations
- Resident submits a new provider or a new review for an existing provider
- Resident reports problematic content
- Admin reviews reports, comments, reviews, and photos

## Technical Shape

- Mobile app in React Native with Expo and TypeScript
- Navigation uses React Navigation stacks and tabs
- Data layer is split between mock behavior in `src/services/mockApi.ts` and real Supabase repositories in `src/repositories/*.ts`
- Supabase is enabled only when configuration exists through `src/services/supabase/config.ts`

## Review Risk Areas

### Access control

- `src/navigation/guards.ts`
- `src/services/AppContext.tsx`
- `src/repositories/authRepository.ts`

Main risk: a pending, rejected, or unauthenticated user reaching protected screens or stale session state keeping the wrong user logged in.

### Recommendation creation and search

- `src/services/mockApi.ts`
- `src/repositories/providersRepository.ts`
- `src/constants/categories.ts`
- `src/utils/phone.ts`

Main risk: duplicate providers, invalid specialty/category combinations, broken filtering, or real-use confirmation no longer enforced.

### Moderation and admin workflows

- `src/repositories/adminRepository.ts`
- `src/screens/ReportedRecommendationsScreen.tsx`
- `src/screens/AccessRequestsScreen.tsx`
- `src/screens/AccessRequestDetailScreen.tsx`

Main risk: admin action updates only part of the system, leaving open reports, visible content, or wrong statuses behind.

### Mock vs. real backend split

- `src/services/mockApi.ts`
- `src/services/supabase/client.ts`
- `src/repositories/mappers.ts`
- `src/types/database.ts`

Main risk: the same screen behaves differently depending on whether Supabase is configured, causing confusing QA results or production regressions.

## Useful Review Checks

- Compare both branches when code uses `isSupabaseConfigured()`.
- Verify that user-visible copy still matches product rules.
- Check whether TypeScript types, mappers, and SQL migrations still agree.
- Check whether sorting and counts still reflect moderated or deleted records correctly.
- Check whether review photos and provider photos are handled consistently.
