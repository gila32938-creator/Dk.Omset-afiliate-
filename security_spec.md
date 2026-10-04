# Security Specification: DK Affiliate Manager Pro

## 1. Data Invariants
1. **User Isolation**: A user can strictly only read, create, update, and delete their own user profile, affiliate accounts, and income records where `userId == request.auth.uid`.
2. **Identity Immutability**: The `userId` of any record cannot be altered after creation.
3. **Data Integrity**:
   - `amount` must be a non-negative number (`amount >= 0`).
   - `accountName` must be a non-empty string under 100 characters.
   - `date` must be a valid date string.
   - Path IDs must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_\-]+$`).
4. **Anti-Tampering**: Unauthenticated access is completely rejected across all paths. Default deny applied to any unmatched paths.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. **Unauthorized Read**: An unauthenticated user requests `users/{userId}` or `incomes/{id}` -> REJECTED (403).
2. **Cross-Tenant Read**: User A authenticated attempts to read User B's `incomes/{id}` -> REJECTED (403).
3. **Identity Spoofing on Create**: User A creates an income with `userId: 'user_B'` -> REJECTED (403).
4. **Cross-Tenant Update**: User A attempts to update User B's affiliate account -> REJECTED (403).
5. **Cross-Tenant Delete**: User A attempts to delete User B's income record -> REJECTED (403).
6. **Ghost Field Injection**: User attempts to inject malicious admin flags `{ isAdmin: true }` into `UserProfile` -> REJECTED (403).
7. **Negative Income Exploitation**: User attempts to set `amount: -50000` -> REJECTED (403).
8. **Resource Exhaustion Attack**: User attempts to submit a 1MB payload string for `accountName` -> REJECTED (403).
9. **Path ID Poisoning**: Attacker requests an illegal path document ID `users/../../etc/passwd` -> REJECTED (403).
10. **Query Boundary Scraping**: User attempts `getDocs(collection(db, 'incomes'))` without `where('userId', '==', auth.currentUser.uid)` -> REJECTED (403).
11. **Foreign Key Orphan Attack**: User attempts to create an income record with an invalid or empty `affiliateAccountId` -> REJECTED (403).
12. **Tampering with Immutable Ownership**: User tries to update an existing record and switch `userId` to another user -> REJECTED (403).
