# Privacy Policy Implementation Checklist

**Document:** Privacy Policy v1.0 (production-ready)
**Date:** 2026-03-28
**Owner:** Dawsen Porter, RobloxForge LLC

---

## PRE-LAUNCH CHECKLIST (4-6 weeks)

### Week 1: Legal Review & Vendor Setup

- [ ] **Legal Review** — Have privacy lawyer review COPPA/GDPR/CCPA sections ($2K-$5K)
  - [ ] Confirm parental consent flow is FTC-compliant
  - [ ] Verify data retention schedule aligns with IRS/FTC requirements
  - [ ] Check DPA language with all vendors
  - [ ] Confirm no state-specific privacy laws missed

- [ ] **Vendor DPA Collection** — Request DPAs from all vendors
  - [ ] Stripe (standard, available)
  - [ ] Clerk (standard, available)
  - [ ] Anthropic (check if needed for AI feature use)
  - [ ] Meshy (3D asset generation)
  - [ ] Fal (image generation)
  - [ ] Sentry (error reporting, standard available)
  - [ ] PostHog (analytics, standard available)
  - [ ] Resend (email service)
  - [ ] AWS (cloud hosting, DPA required)

- [ ] **Data Processing Agreement (DPA) Execution**
  - [ ] Compile all DPAs into compliance folder
  - [ ] Ensure SCCs (Standard Contractual Clauses) for EU data transfers
  - [ ] Document Schrems II Transfer Impact Assessment (TIA) for AWS

---

### Week 2: Technical Implementation

**User Privacy Center Setup**

- [ ] **`/privacy/request` Page** — CCPA/GDPR data request interface
  - [ ] Request type selector (access, delete, correct, port, object, limit)
  - [ ] Email verification flow
  - [ ] Request status tracking
  - [ ] Response delivery (email + download)

- [ ] **`/family/dashboard` Page** — Parental controls (under-13 users)
  - [ ] Display child's account info (DOB, email, activity)
  - [ ] "Review Data" button → trigger data export
  - [ ] "Delete Account" button → trigger 30-day deletion workflow
  - [ ] "Withdraw Consent" button → immediate account disable
  - [ ] "Manage Privacy Settings" → toggle data collection per feature
  - [ ] Activity feed (games created, marketplace activity, earnings)
  - [ ] Payment history (if applicable)

**Email Template Setup**

- [ ] **Parental Consent Email #1** — Consent request with token link
  - [ ] Template: see PRIVACY_POLICY.md Section 7.8
  - [ ] Send via Resend (legal@robloxforge.app)
  - [ ] Test token generation (cryptographically unique)
  - [ ] Test token expiry (48 hours)
  - [ ] Test one-time use (delete token after first click)

- [ ] **Parental Consent Email #2** — Confirmation + dashboard link
  - [ ] Template: see PRIVACY_POLICY.md Section 7.8
  - [ ] Include parent dashboard login URL
  - [ ] Include FTC rights statement

- [ ] **Data Deletion Email** — Confirmation of scheduled deletion
  - [ ] Include cancellation deadline (14 days)
  - [ ] List data being deleted
  - [ ] Note legal holds (payment logs, COPPA records)

- [ ] **Breach Notification Email** — If security incident occurs
  - [ ] Include what data was accessed
  - [ ] Credit monitoring offer (if applicable)
  - [ ] Regulatory agency notifications made
  - [ ] Steps taken to prevent recurrence

**Data Retention & Deletion Jobs**

- [ ] **Implement IP Address Auto-Purge** (30 days)
  - [ ] Cron job: Run nightly at 2 AM UTC
  - [ ] Delete all IP address records where `created_at < NOW() - INTERVAL '30 days'`
  - [ ] Log purge operation (count, timestamp)
  - [ ] Alert if job fails

- [ ] **Implement Error Log Purge** (1 year)
  - [ ] Cron job: Run nightly
  - [ ] Delete all error logs where `created_at < NOW() - INTERVAL '365 days'`
  - [ ] Retain Sentry link (not logs) for reference

- [ ] **Implement Parental Consent Archive Cleanup** (5+ years)
  - [ ] Cron job: Run monthly
  - [ ] Archive parental consent logs: mark `archived = true`, set `archive_until = NOW() + 5 years`
  - [ ] Soft-delete after 5 years (secure shred if space needed)

- [ ] **Implement Account Deletion Scheduler** (30 days)
  - [ ] When parent/user requests deletion: create `deletion_ticket`
  - [ ] Disable account immediately (status = "deletion_scheduled")
  - [ ] Run background job after 24 hours (14-day reversal window)
  - [ ] Execute permanent deletion after user cannot cancel

---

### Week 3: Testing & Documentation

**Privacy Center Testing**

- [ ] **GDPR Access Request** — Test `/privacy/request` → access type
  - [ ] Submit request
  - [ ] Receive email verification
  - [ ] Click verification link
  - [ ] Receive CSV/JSON export within 15 days
  - [ ] Verify all account data included
  - [ ] Verify third-party list included

- [ ] **CCPA Delete Request** — Test `/privacy/request` → delete type
  - [ ] Submit request
  - [ ] Receive email verification
  - [ ] Click verification link
  - [ ] Account disabled (status = "pending_deletion")
  - [ ] Receive confirmation email (14-day reversal window)
  - [ ] Wait 30 days, verify permanent deletion
  - [ ] Verify payment logs retained (7 years)
  - [ ] Verify COPPA logs retained (5 years)

- [ ] **Data Correction** — Test profile update
  - [ ] Update email, name, timezone
  - [ ] Verify data reflected in account settings
  - [ ] Verify Clerk user metadata synced
  - [ ] Verify audit log created

- [ ] **Parental Consent Flow** (under-13)
  - [ ] Create account with DOB = 2015-03-01 (age 8)
  - [ ] Redirect to parental consent page
  - [ ] Enter parent email
  - [ ] Verify parent receives email with token
  - [ ] Click token link
  - [ ] Verify token is single-use (retry fails)
  - [ ] Verify token expires after 48 hours
  - [ ] Verify account activated
  - [ ] Verify parent can access parental dashboard
  - [ ] Verify child can now use platform

- [ ] **Data Deletion (Minor)**
  - [ ] Parent requests deletion via dashboard
  - [ ] Verify account disabled immediately
  - [ ] Verify child cannot log in
  - [ ] Verify parent receives confirmation (14-day reversal window)
  - [ ] Wait 30 days, verify permanent deletion
  - [ ] Verify COPPA audit log retained (5 years)

**Documentation**

- [ ] **Runbook: GDPR Data Subject Request**
  - [ ] Step-by-step process for handling requests
  - [ ] Response templates (access, delete, port, etc.)
  - [ ] Escalation procedures (legal review)

- [ ] **Runbook: COPPA Parental Request**
  - [ ] How to handle parent review/delete/withdraw
  - [ ] Email templates to send
  - [ ] How to use parental dashboard

- [ ] **Runbook: Security Breach**
  - [ ] Incident response timeline (24h acknowledge, 72h notify)
  - [ ] Who to contact (legal, insurance, regulators)
  - [ ] How to notify users (breach notification email)
  - [ ] How to notify FTC/state AGs (voluntary disclosure = smaller fines)

- [ ] **Data Retention Schedule** — Post visibly to team
  - [ ] Print this table; post in Slack/team wiki
  - [ ] Data type → Retention duration → Legal reason
  - [ ] Purge method (auto-delete vs. secure shred)

---

### Week 4: Launch Preparation

**Final Compliance Steps**

- [ ] **DMCA Agent Registration** (Free, Copyright Office)
  - [ ] File Form HAL (Notification of Agent to Receive Notification of Claimed Infringement)
  - [ ] Register at copyright.gov/dmca-agent
  - [ ] Include legal@robloxforge.app as agent email
  - [ ] Publish DMCA policy in ToS (reference already in Privacy Policy)

- [ ] **Insurance Update** — Add COPPA violation coverage
  - [ ] Contact E&O carrier (Hiscox, Beazley)
  - [ ] Request COPPA violation coverage rider
  - [ ] Request cyber insurance (data breach liability)
  - [ ] Cost: ~$16K/year total (E&O $4K + Cyber $8K + GL $1K + Media $3K)

- [ ] **Regulatory Filings** (State-specific, as needed)
  - [ ] **California:** File with CA Attorney General (no specific form; just keep records)
  - [ ] **Colorado, Connecticut, Virginia, etc.:** No pre-filing required; just comply
  - [ ] **EU:** GDPR notification to Data Protection Authority (if applicable)
  - [ ] **UK:** ICO notification (if you have UK users; ~£19.50 annual fee)

- [ ] **Photo DNA Setup** (CSAM detection)
  - [ ] Subscribe to PhotoDNA service ($200-500/month via Microsoft)
  - [ ] Integrate detection into user-uploaded asset pipeline
  - [ ] Document NCMEC reporting procedure
  - [ ] Create incident response for CSAM findings

- [ ] **Staff Training** — 1-hour COPPA/GDPR/CCPA Overview
  - [ ] Teach team about FTC enforcement cases
  - [ ] Explain why parental consent is critical
  - [ ] Show how to handle privacy requests
  - [ ] Explain data retention schedule
  - [ ] Test knowledge (quiz)

- [ ] **Create Compliance Folder** (securely stored)
  - [ ] All DPA agreements (scanned/PDF)
  - [ ] Parental consent logs (audit trail)
  - [ ] Deletion request records
  - [ ] Security breach incident reports
  - [ ] Staff training records
  - [ ] Annual audit reports
  - [ ] Keep for 5+ years minimum

---

## POST-LAUNCH MONITORING (Ongoing)

### Monthly Tasks

- [ ] **Review Privacy Requests Queue**
  - [ ] GDPR access requests: Verify all fulfilled within 15 days
  - [ ] CCPA delete requests: Verify all fulfilled within 45 days
  - [ ] Parental requests: Verify all fulfilled within 15 business days
  - [ ] Log all requests in compliance folder

- [ ] **Check Data Retention Job Status**
  - [ ] IP address purge: Verify ran successfully (should log count)
  - [ ] Error log purge: Verify ran successfully
  - [ ] Check for any alerts/failures

- [ ] **Monitor Parental Consent Tokens**
  - [ ] Spot-check 10 random parental consent logs
  - [ ] Verify token is hashed (not plain text)
  - [ ] Verify token creation/expiry/usage logged
  - [ ] Verify one-time use enforced

### Quarterly Tasks

- [ ] **Audit Sample of Under-13 Accounts** (10 random accounts)
  - [ ] Verify parental consent email was sent
  - [ ] Verify consent token was valid and used
  - [ ] Verify no forbidden data collected (location, SSN, etc.)
  - [ ] Verify data retention policy followed

- [ ] **Review Vendor DPAs**
  - [ ] Verify all vendors still have valid DPAs
  - [ ] Check for security audit updates (SOC 2)
  - [ ] Review any changes to vendor privacy policies
  - [ ] Update our Privacy Policy if vendor processes change

- [ ] **Regulatory Monitoring**
  - [ ] Check FTC.gov for new COPPA guidance
  - [ ] Check EDPB (edpb.ec.europa.eu) for GDPR updates
  - [ ] Subscribe to state AG privacy newsletters
  - [ ] Update Privacy Policy if new laws enacted

### Annually (Required)

- [ ] **Third-Party Privacy Audit** ($3K-$5K)
  - [ ] Hire external lawyer or privacy consultant
  - [ ] Audit 30 random under-13 accounts
  - [ ] Test parental consent process
  - [ ] Test data deletion flow
  - [ ] Verify COPPA/GDPR/CCPA compliance
  - [ ] Produce audit report
  - [ ] File with insurance (proof of compliance)

- [ ] **Update Privacy Policy** (if applicable)
  - [ ] Review for accuracy
  - [ ] Update vendor list (if new services added)
  - [ ] Update data retention schedule (if changed)
  - [ ] Update legal contact info
  - [ ] Increase version number
  - [ ] Notify users of material changes (email)

- [ ] **Staff Training Refresher**
  - [ ] Re-train team on COPPA/privacy obligations
  - [ ] Review FTC enforcement cases
  - [ ] Test knowledge (quiz)

---

## CRITICAL DEADLINES

| Task | Deadline | Why |
|------|----------|-----|
| **Legal Review Complete** | Week 1 | Catch errors before deployment |
| **All Vendor DPAs** | Week 1 | Can't launch without them |
| **Privacy Center Live** | Week 2 | GDPR/CCPA require response mechanisms |
| **Parental Consent Flow** | Week 2 | COPPA requires verification before under-13 signup |
| **Data Deletion Job** | Week 3 | Must delete within 30 days of request |
| **Testing Complete** | Week 3 | Catch bugs in privacy workflows |
| **Annual Audit Scheduled** | Month 1 | Proof of compliance for insurance |
| **Staff Trained** | Before Launch | Everyone must understand policy |

---

## COMPLIANCE METRICS

**Track these KPIs to prove compliance:**

- **GDPR Access Requests:** % fulfilled within 15 days (target: 100%)
- **CCPA Delete Requests:** % fulfilled within 45 days (target: 100%)
- **COPPA Parental Requests:** % fulfilled within 15 business days (target: 100%)
- **Data Deletion Job:** % successful runs (target: 100% over 365 days)
- **IP Address Purge:** % of records deleted after 30 days (target: 100%)
- **Third-Party Audit:** Pass/fail (target: Pass every year)
- **Under-13 COPPA Audit:** Sample of 10 accounts, % verified (target: 100% verified)
- **Staff Knowledge:** Quiz score (target: 90%+)

---

## ESCALATION CONTACTS

If something goes wrong:

**Privacy Breach or COPPA Violation:**
- Email: legal@robloxforge.app (immediate)
- CC: insurance broker (cyber + E&O)
- Contact: Incident response lawyer

**FTC Investigation or Complaint:**
- Do NOT respond without lawyer
- Contact: Federal Trade Commission (ftc.gov)
- File: Voluntary Disclosure (smaller fine)

**State AG Inquiry:**
- Do NOT respond without lawyer
- Contact: State Attorney General (state website)
- File: Response within 30 days (or as required)

**User Data Access/Deletion Request:**
- Handle normally (see Privacy Center process)
- Log in compliance folder
- If unsure, ask legal

---

## BUDGET ESTIMATE

| Item | Cost | Timeline | Notes |
|------|------|----------|-------|
| Legal review | $2K-$5K | Week 1 | One-time |
| Vendor DPA review | $0 | Week 1 | Mostly free (already written) |
| Privacy center dev | $2K-$5K | Week 2 | Build `/privacy/request` + `/family/dashboard` |
| Testing (internal QA) | $0 | Week 3 | Team time |
| Data deletion jobs (dev) | $1K-$2K | Week 2-3 | Build cron scripts |
| PhotoDNA (annual) | $2.4K-$6K | Ongoing | Microsoft service |
| Insurance (annual) | $16K | Ongoing | E&O + Cyber + GL + Media |
| Annual audit (external) | $3K-$5K | Year 1+ | Third-party lawyer |
| Staff training (1-hour) | $0 | Week 4 | Internal |
| Compliance tools | $1K | Ongoing | Password manager, audit logging |
| | | | |
| **FIRST YEAR TOTAL** | **$27K-$36K** | 4-6 weeks | Dev + legal + year 1 insurance |
| **ONGOING/YEAR** | **$22K-$27K** | Annually | Insurance + audit + tools |

---

## FILE LOCATIONS

- **Privacy Policy:** `/c/Users/Dawse/OneDrive/Desktop/roblox-map-building/PRIVACY_POLICY.md`
- **Terms of Service:** `/c/Users/Dawse/OneDrive/Desktop/roblox-map-building/TOS.md` (separate doc)
- **COPPA Implementation Guide:** `/c/Users/Dawse/.claude/agent-memory/researcher/robloxforge-coppa-implementation.md`
- **Legal Audit:** `/c/Users/Dawse/.claude/agent-memory/researcher/robloxforge_legal_audit_2026.md`
- **Clerk + COPPA Code:** `/c/Users/Dawse/.claude/agent-memory/researcher/clerk-nextjs15-coppa-complete.md`

---

## NEXT STEPS

1. **This week:** Legal review + vendor DPA collection
2. **Next week:** Build privacy center (`/privacy/request` + `/family/dashboard`)
3. **Week 3:** Implement data deletion jobs + parental consent flow
4. **Week 4:** Full testing + staff training + launch

**Questions?** Email legal@robloxforge.app
