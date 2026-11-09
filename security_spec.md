# HSE APAR Management System - Security Specification

## 1. Data Invariants
1. APAR records cannot be modified or deleted by users with 'inspector' role; only 'admin' role can alter master data.
2. Inspection records are permanent and append-only: once created, checklist answers and timestamps cannot be deleted or overwritten.
3. Every inspection must associate with a valid `aparId` and authenticate the `inspectorId` to match the signed-in user.
4. User role elevation (e.g. self-promoting from 'inspector' to 'admin') is forbidden.
5. Inactive APAR records require a mandatory justification reason.
6. Audit logs are immutable and can only be appended.

## 2. The Dirty Dozen Payloads (Designed to Fail Security Tests)
1. **Unauthenticated Read APAR**: Attempt to read `/apars/APAR-001` without auth -> REJECT (403)
2. **Inspector Mutating APAR Master**: Inspector account attempting `setDoc` on `/apars/APAR-001` -> REJECT (403)
3. **Inspector Deleting Inspection Record**: Inspector attempting `deleteDoc` on `/inspections/INSP-100` -> REJECT (403)
4. **Forged Inspector Identity**: User A (`uid_A`) submitting inspection with `inspectorId: "uid_B"` -> REJECT (403)
5. **Self-Promotion to Admin**: Inspector updating `/users/uid_inspector` setting `role: "admin"` -> REJECT (403)
6. **Corrupt APAR ID Injection**: Injecting a 2KB string or special characters into `{aparId}` path variable -> REJECT (403)
7. **Tampering with Immutable Inspection Timestamps**: Updating inspection record's `createdAt` -> REJECT (403)
8. **Shadow Field Injection**: Adding unknown malicious field `__backdoor: true` to `/apars/APAR-001` -> REJECT (403)
9. **Blanket Query Scraping**: Unauthorized client running unrestricted collection query -> REJECT (403)
10. **Bypassing Inspection Status Invariant**: Submitting invalid `finalStatus: "SUPER_SAFE"` not in enum -> REJECT (403)
11. **Modifying Audit Log Records**: Attempting update or delete on `/audit_logs/LOG-001` -> REJECT (403)
12. **Anonymous Write Access**: Unauthenticated guest trying to submit an inspection -> REJECT (403)
