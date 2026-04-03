# Hidden Pages Reference

All these pages are built and working — just not linked in navigation yet. Visit them directly by URL.

---

## Marketing Pages (not in nav)
| Page | URL | Status |
|---|---|---|
| About | `/about` | Full — company story, stats, timeline |
| Showcase | `/showcase` | Full — gallery of AI-built games |
| Download | `/download` | Coming Soon placeholder |
| Changelog | `/changelog` | 3 releases with detailed notes |
| Blog | `/blog` | 3 posts (launch, AI tutorial, voice tutorial) |
| Blog Post | `/blog/forjegames-launch` | Full article |
| Blog Post | `/blog/building-roblox-games-with-ai` | Full article |
| Blog Post | `/blog/voice-to-game-tutorial` | Full article |
| Docs Hub | `/docs` | Documentation landing |
| Docs: Getting Started | `/docs/getting-started` | Setup guide |
| Docs: API | `/docs/api` | API reference |
| Docs: Studio | `/docs/studio` | Studio plugin docs |

## App Pages (not in sidebar)
| Page | URL | Status |
|---|---|---|
| Welcome | `/welcome` | Onboarding intro screen |
| Projects | `/projects` | Saved game projects |
| Achievements | `/achievements` | Badges, XP, leaderboard |
| Earnings | `/earnings` | Marketplace revenue + payouts |
| Growth | `/growth` | Analytics, revenue, engagement |
| Community | `/community` | Creator spotlight, 3 leaderboards (477 lines) |
| Voice | `/voice` | Voice-to-game building |
| Referrals | `/referrals` | Referral program |
| Tokens | `/tokens` | Token balance, usage donut, buy packs |
| Connect | `/connect` | Redirects to /editor |
| Business | `/business` | Business features |
| Game DNA | `/game-dna` | Game analysis tool |
| Game DNA Detail | `/game-dna/[id]` | Individual game analysis |
| Game DNA Compare | `/game-dna/compare` | Side-by-side comparison |
| Image to Map | `/image-to-map` | Photo/sketch to Roblox map |
| Marketplace | `/marketplace` | Asset marketplace |
| Marketplace Item | `/marketplace/[id]` | Individual asset |
| Marketplace Submit | `/marketplace/submit` | Submit your asset |
| Marketplace Earnings | `/marketplace/earnings` | Seller revenue |
| Team | `/team` | Team management |
| Team Settings | `/team/settings` | Team config |
| Team History | `/team/history` | Activity log |
| Dashboard Cost Tracker | `/dashboard/cost-tracker` | API cost tracking |

## Settings Sub-pages
| Page | URL | Status |
|---|---|---|
| Studio Settings | `/settings/studio` | Studio connection config |
| API Keys | `/settings/api-keys` | Manage API keys |
| API Key Detail | `/settings/api-keys/[id]` | Individual key |
| Webhooks | `/settings/webhooks` | Webhook management |

## Admin Pages (admin-only)
| Page | URL | Status |
|---|---|---|
| Admin Dashboard | `/admin` | Overview stats |
| Admin Analytics | `/admin/analytics` | User/revenue analytics |
| Admin Users | `/admin/users` | User management |
| Admin Templates | `/admin/templates` | Template approval queue |
| Admin Charity | `/admin/charity` | Charity/donations |

## Auth / Onboarding
| Page | URL | Status |
|---|---|---|
| Onboarding | `/onboarding` | Initial setup |
| Age Gate | `/onboarding/age-gate` | Age verification |
| Plan Selection | `/onboarding/plan` | Choose tier |
| Parental Consent | `/onboarding/parental-consent` | Under-13 consent form |
| Consent Verify | `/onboarding/parental-consent/verify` | Verification step |
| Consent Success | `/onboarding/parental-consent/success` | Done |
| Consent Denied | `/onboarding/parental-consent/denied` | Rejected |

## Legal Pages
| Page | URL | Status |
|---|---|---|
| Acceptable Use | `/acceptable-use` | Full policy |
| DMCA | `/dmca` | Full policy |

## Error / Status Pages
| Page | URL | Status |
|---|---|---|
| Error | `/error` | Generic error |
| Blocked | `/blocked` | User blocked |
| Suspended | `/suspended` | Account suspended |
| Offline | `/offline` | No connection |
| Maintenance | `/maintenance` | Site maintenance |
| Rate Limited | `/rate-limited` | Too many requests |
| Verify Email | `/verify-email` | Email verification |
| Unsubscribe | `/unsubscribe` | Email unsubscribe |

---

## To re-enable a page in navigation:

**Marketing nav** — edit `src/components/MarketingNav.tsx`, add to `NAV_LINKS` array
**Footer** — edit `src/components/Footer.tsx`, add to the appropriate `*_LINKS` array
**App sidebar** — edit `src/components/AppSidebar.tsx`, add to `NAV_ITEMS` array
