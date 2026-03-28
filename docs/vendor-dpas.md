# Vendor Data Processing Agreements (DPAs)

**Last updated:** 2026-03-28
**Owner:** Dawsen Porter / RobloxForge LLC
**Purpose:** Track DPA status with all third-party data processors per GDPR Art. 28

---

## Overview

Under GDPR Article 28, data controllers must have a Data Processing Agreement (DPA) with every
data processor that handles personal data on their behalf. This document tracks DPA status for all
RobloxForge vendors.

**GDPR requirement:** DPA must specify:
- Subject matter and duration of processing
- Nature and purpose of processing
- Type of personal data and categories of data subjects
- Obligations and rights of the controller

---

## Vendor DPA Status

| Vendor | Role | Personal Data Processed | DPA Available | Status | Notes |
|---|---|---|---|---|---|
| **Stripe** | Payment processor | Billing name, email, card metadata, IP | Yes (standard) | PENDING | Accept at dashboard.stripe.com/settings/legal |
| **Clerk** | Auth provider | Email, name, OAuth tokens, sessions | Yes (standard) | PENDING | Available at clerk.com/legal |
| **Anthropic** | AI model provider | Prompt content, outputs | Yes (enterprise) | PENDING | Contact sales@anthropic.com — required for GDPR |
| **Meshy** | 3D generation | Prompt content, outputs | Unknown | INVESTIGATE | Email privacy@meshy.ai to request DPA |
| **Fal.ai** | Image generation | Prompt content, images | Unknown | INVESTIGATE | Check fal.ai/privacy or email support |
| **Sentry** | Error tracking | Stack traces, user IDs, IPs | Yes (standard) | PENDING | Available at sentry.io/legal/dpa/ |
| **PostHog** | Product analytics | User IDs, events, IPs, device data | Yes (standard) | PENDING | Available at posthog.com/dpa — self-serve |
| **Resend** | Transactional email | Email addresses, content | Unknown | INVESTIGATE | Check resend.com/legal |
| **Vercel** | Hosting / CDN | IPs, request logs | Yes (standard) | PENDING | Available at vercel.com/legal/dpa |

---

## Priority Order

Complete in this order:

1. **Stripe** — Handles payment data (most sensitive). Accept standard DPA immediately.
2. **Clerk** — Handles all auth. Accept standard DPA immediately.
3. **Vercel** — Hosts everything. Accept standard DPA immediately.
4. **Sentry** — Handles error data including stack traces with potential PII.
5. **PostHog** — Analytics with user behavior data.
6. **Anthropic** — May require enterprise agreement for GDPR-compliant DPA.
7. **Meshy** — Investigate if they offer a DPA before continuing use in EU.
8. **Fal.ai** — Investigate if they offer a DPA before continuing use in EU.
9. **Resend** — Investigate DPA availability.

---

## Detailed Vendor Notes

### Stripe
- **Self-service DPA:** Available in Stripe Dashboard > Settings > Legal
- **Standard Clauses:** Stripe uses EU Standard Contractual Clauses (SCCs) for EEA/UK transfers
- **COPPA:** Stripe is PCI DSS Level 1 compliant; does not specifically handle under-13 data
- **Action:** Log in → Settings → Legal → Accept DPA

### Clerk
- **Self-service DPA:** Available at https://clerk.com/legal
- **Data processed:** Email, name, OAuth tokens, session data, IP addresses
- **SCC:** Uses SCCs for EU data transfers
- **Action:** Review and accept via Clerk dashboard or legal page

### Anthropic
- **Enterprise DPA:** Not available self-service for starter plans
- **GDPR concern:** Prompt content submitted to Anthropic's API may include personal data
- **Action:** Contact sales@anthropic.com to request a DPA or review their API data processing terms
- **Interim mitigation:** Review Anthropic's Privacy Policy; do not send unnecessary PII in prompts
- **Claude API data handling:** Per Anthropic's policy, API data is not used to train models by default (as of 2024 — verify current policy)

### Meshy (3D generation)
- **DPA status:** Unknown
- **Risk:** If EU users' prompts contain personal data and are sent to Meshy, a DPA is required
- **Action:** Email privacy@meshy.ai requesting a DPA or review their privacy policy
- **Interim mitigation:** Strip PII from prompts before sending to Meshy

### Fal.ai (image generation)
- **DPA status:** Unknown
- **Risk:** Similar to Meshy — prompt data may be processed on their servers
- **Action:** Check https://fal.ai/privacy or email support@fal.ai
- **Interim mitigation:** Strip PII from image prompts; review their data retention policy

### Sentry
- **Self-service DPA:** Available at https://sentry.io/legal/dpa/
- **Data processed:** Error logs, stack traces, user IDs, IP addresses
- **SCC:** Sentry is Privacy Shield successor compliant + uses SCCs
- **Action:** Log in → Settings → Legal → Download and sign DPA

### PostHog
- **Self-service DPA:** Available at https://posthog.com/dpa
- **GDPR note:** PostHog offers EU Cloud hosting (Frankfurt) to keep EU data in EU
- **Action:** Accept DPA at posthog.com/dpa; consider switching to EU Cloud for EU users
- **COPPA:** Disable tracking for under-13 accounts (already handled via age-gating in Phase 1)

### Resend
- **DPA status:** Check https://resend.com/legal
- **Data processed:** Email addresses, email content, delivery metadata
- **Action:** Check legal page or email support@resend.com

### Vercel
- **Self-service DPA:** Available at https://vercel.com/legal/dpa
- **Data processed:** Request logs, IPs, response data
- **SCC:** Uses SCCs for EU transfers
- **Action:** Accept at vercel.com/legal/dpa (requires Pro plan or above)

---

## Completion Checklist

- [ ] Stripe DPA accepted
- [ ] Clerk DPA accepted
- [ ] Vercel DPA accepted
- [ ] Sentry DPA accepted and signed
- [ ] PostHog DPA accepted
- [ ] Anthropic DPA requested / enterprise agreement in place
- [ ] Meshy DPA investigated and obtained or vendor replaced
- [ ] Fal.ai DPA investigated and obtained or vendor replaced
- [ ] Resend DPA obtained or vendor replaced
- [ ] All signed DPAs stored in `docs/legal-registrations/dpas/`

---

## COPPA Processor Requirements

Vendors that process data from users under 13 must agree to COPPA-compliant handling:
- No use of children's data for advertising or tracking
- No disclosure to unauthorized third parties
- Deletion upon request

**Under-13 data flows to:**
- Clerk (auth — unavoidable)
- Stripe (billing — parental payment, required)
- Sentry (errors — minimal PII, disable user context for minors)
- PostHog (analytics — **DISABLED** for under-13 accounts)
- Anthropic (AI prompts — **EXCLUDED from model training** for under-13)

**Ensure these vendors have COPPA-compatible terms or disable data collection for minors.**

---

## References

- GDPR Art. 28: https://gdpr-info.eu/art-28-gdpr/
- EU Standard Contractual Clauses: https://ec.europa.eu/info/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en
- FTC COPPA Rule: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
- IAPP DPA Template: https://iapp.org/resources/article/eu-model-controller-processor-clause-template/

---

*Maintained by Dawsen Porter. Update this document whenever vendor relationships change.*
