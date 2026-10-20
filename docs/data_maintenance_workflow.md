# IndianTimers - Official Exam Date Provenance & Maintenance Workflow

## 1. Principles of Data Accuracy
Accuracy is IndianTimers' highest priority. Students plan months or years of preparation around these schedules. Misinforming a student about an exam date causes severe real-world harm.

### Strict Status Classifications:
1. `official`: The conducting body (e.g. NTA, UPSC, CBSE, IIT) has released an official press note, information bulletin, or gazette notification explicitly specifying this exact date or date range. The record MUST include the official source URL and notification title.
2. `tentative`: The conducting authority has published a preliminary annual calendar or circular marking the date as tentative (e.g., UPSC Annual Calendar stating "Subject to change"). The UI must explicitly mark it as "Tentative".
3. `expected`: Based on historical trends before the official circular is released, but explicitly NOT confirmed. Active countdowns must clearly reflect this or prompt the student to check official circulars.
4. `not_announced`: The official notification has not yet been released. **Never manufacture a speculative date just to show a countdown.** The countdown badge must display "Date Not Announced".
5. `postponed`: Officially postponed by the examination board.
6. `completed`: The examination date has passed.

---

## 2. Official Authority Primary Sources

| Examination Category | Official Conducting Body | Primary Verification Portal |
| :--- | :--- | :--- |
| **NEET UG, JEE Main, CUET, UGC NET** | National Testing Agency (NTA) | [nta.ac.in](https://nta.ac.in) & [jeemain.nta.nic.in](https://jeemain.nta.nic.in) |
| **UPSC Civil Services, NDA, CDS** | Union Public Service Commission | [upsc.gov.in](https://upsc.gov.in) |
| **GATE** | Organizing IIT (IIT Madras / IIT Roorkee / etc.) | [gate2027.iitm.ac.in](https://gate2027.iitm.ac.in) |
| **JEE Advanced** | Organizing IIT / JAB | [jeeadv.ac.in](https://jeeadv.ac.in) |
| **CBSE Class 10 & 12** | Central Board of Secondary Education | [cbse.gov.in](https://cbse.gov.in) & [cbseacademic.nic.in](https://cbseacademic.nic.in) |
| **CLAT** | Consortium of National Law Universities | [consortiumofnlus.ac.in](https://consortiumofnlus.ac.in) |
| **CAT** | Indian Institutes of Management (IIMs) | [iimcat.ac.in](https://iimcat.ac.in) |
| **SSC CGL, CHSL, MTS** | Staff Selection Commission | [ssc.gov.in](https://ssc.gov.in) |
| **IBPS PO, Clerk, RRB** | Institute of Banking Personnel Selection | [ibps.in](https://ibps.in) |

---

## 3. Maintenance Audit Process
1. **Weekly Verification Run**:
   - Automated scripts check for HTTP 200/changes on official circular listing URLs.
   - Run `npm test` which validates:
     - ISO-8601 date format consistency (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss+05:30`).
     - No orphan/duplicate slugs.
     - Dates labelled `official` must have a valid non-empty `officialSourceUrl`.
     - `lastVerified` must be a valid date within the verification cycle.
2. **Handling Schedule Changes / Postponements**:
   - Update `dateStatus` to `postponed` or `rescheduled`.
   - Update `verificationNotes` with the exact notification reference number and date.
   - The UI automatically renders an alert banner detailing the change.
