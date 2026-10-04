import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase.ts';
import { AffiliateAccount, IncomeRecord, UserProfile } from '../types/index.ts';
import {
  getIndonesianDayName,
  getWeekRange,
  toISODateString,
} from '../utils/dateUtils.ts';

const DEFAULT_ACCOUNTS = [
  'DK Grosir',
  'Velorawear',
  'Viriondfinds',
  'Nana Cantika',
];

// Helper to generate clean IDs
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Initialize user profile in Firestore
 */
export async function getOrCreateUserProfile(userId: string, email: string): Promise<UserProfile> {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const newProfile: UserProfile = {
      userId,
      email,
      displayName: email.split('@')[0],
      theme: 'dark',
      createdAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function updateUserTheme(userId: string, theme: 'light' | 'dark' | 'system') {
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { theme });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Initialize default accounts for a new user
 */
export async function checkAndInitDefaultAccounts(userId: string): Promise<void> {
  const path = 'affiliateAccounts';
  try {
    const q = query(collection(db, 'affiliateAccounts'), where('userId', '==', userId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return; // Already initialized
    }

    // Create 4 initial accounts
    let order = 1;
    for (const name of DEFAULT_ACCOUNTS) {
      const accountId = generateId('acc');
      const newAcc: AffiliateAccount = {
        accountId,
        userId,
        accountName: name,
        active: true,
        order: order++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'affiliateAccounts', accountId), newAcc);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Real-time listener for user's affiliate accounts
 */
export function subscribeAffiliateAccounts(
  userId: string,
  callback: (accounts: AffiliateAccount[]) => void
) {
  const path = 'affiliateAccounts';
  const q = query(collection(db, 'affiliateAccounts'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snap) => {
      const accounts: AffiliateAccount[] = [];
      snap.forEach((d) => {
        accounts.push(d.data() as AffiliateAccount);
      });
      accounts.sort((a, b) => a.order - b.order);
      callback(accounts);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Add a new affiliate account
 */
export async function addAffiliateAccount(userId: string, accountName: string, order?: number): Promise<AffiliateAccount> {
  const path = 'affiliateAccounts';
  try {
    const accountId = generateId('acc');
    const newAcc: AffiliateAccount = {
      accountId,
      userId,
      accountName: accountName.trim(),
      active: true,
      order: order ?? Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'affiliateAccounts', accountId), newAcc);
    return newAcc;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Edit an affiliate account
 */
export async function updateAffiliateAccount(
  accountId: string,
  updates: Partial<AffiliateAccount>
): Promise<void> {
  const path = `affiliateAccounts/${accountId}`;
  try {
    const ref = doc(db, 'affiliateAccounts', accountId);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Delete an affiliate account
 */
export async function deleteAffiliateAccount(accountId: string): Promise<void> {
  const path = `affiliateAccounts/${accountId}`;
  try {
    await deleteDoc(doc(db, 'affiliateAccounts', accountId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Real-time listener for user's income records
 */
export function subscribeIncomes(
  userId: string,
  callback: (records: IncomeRecord[]) => void
) {
  const path = 'incomes';
  const q = query(collection(db, 'incomes'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snap) => {
      const records: IncomeRecord[] = [];
      snap.forEach((d) => {
        records.push(d.data() as IncomeRecord);
      });
      // Sort descending by date
      records.sort((a, b) => b.date.localeCompare(a.date));
      callback(records);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

/**
 * Save daily incomes for multiple accounts on a specific date.
 * Enforces rule: empty accounts are stored with Rp0.
 */
export async function saveDailyIncomes(
  userId: string,
  dateISO: string,
  entries: { accountId: string; accountName: string; amount: number }[]
): Promise<void> {
  const path = 'incomes';
  try {
    const day = getIndonesianDayName(dateISO);
    const month = dateISO.slice(0, 7); // "YYYY-MM"
    const year = parseInt(dateISO.slice(0, 4), 10);
    const week = getWeekRange(dateISO);

    // Get existing records for this user and this date to avoid duplicate records
    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', userId),
      where('date', '==', dateISO)
    );
    const existingSnap = await getDocs(q);
    const existingByAccountId: Record<string, IncomeRecord> = {};
    existingSnap.forEach((docSnap) => {
      const rec = docSnap.data() as IncomeRecord;
      existingByAccountId[rec.affiliateAccountId] = rec;
    });

    const nowISO = new Date().toISOString();

    for (const entry of entries) {
      const existing = existingByAccountId[entry.accountId];
      const validAmount = Math.max(0, Math.round(entry.amount || 0));

      if (existing) {
        // Update existing record
        await updateDoc(doc(db, 'incomes', existing.transactionId), {
          amount: validAmount,
          accountName: entry.accountName,
          updatedAt: nowISO,
        });
      } else {
        // Create new record
        const transactionId = generateId('inc');
        const newRecord: IncomeRecord = {
          transactionId,
          userId,
          affiliateAccountId: entry.accountId,
          accountName: entry.accountName,
          date: dateISO,
          day,
          month,
          year,
          weekStart: week.start,
          weekEnd: week.end,
          amount: validAmount,
          createdAt: nowISO,
          updatedAt: nowISO,
        };
        await setDoc(doc(db, 'incomes', transactionId), newRecord);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Update a single income transaction (used in Edit form)
 */
export async function updateIncomeRecord(
  transactionId: string,
  updates: { date?: string; amount?: number; affiliateAccountId?: string; accountName?: string }
): Promise<void> {
  const path = `incomes/${transactionId}`;
  try {
    const extraUpdates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (updates.amount !== undefined) {
      extraUpdates.amount = Math.max(0, Math.round(updates.amount));
    }
    if (updates.affiliateAccountId !== undefined) {
      extraUpdates.affiliateAccountId = updates.affiliateAccountId;
    }
    if (updates.accountName !== undefined) {
      extraUpdates.accountName = updates.accountName;
    }
    if (updates.date) {
      extraUpdates.date = updates.date;
      extraUpdates.day = getIndonesianDayName(updates.date);
      extraUpdates.month = updates.date.slice(0, 7);
      extraUpdates.year = parseInt(updates.date.slice(0, 4), 10);
      const week = getWeekRange(updates.date);
      extraUpdates.weekStart = week.start;
      extraUpdates.weekEnd = week.end;
    }

    await updateDoc(doc(db, 'incomes', transactionId), extraUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Delete a single income record
 */
export async function deleteIncomeRecord(transactionId: string): Promise<void> {
  const path = `incomes/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'incomes', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Delete ALL user data (accounts & incomes) with confirmation
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  try {
    // Delete all incomes
    const incQuery = query(collection(db, 'incomes'), where('userId', '==', userId));
    const incSnap = await getDocs(incQuery);
    for (const d of incSnap.docs) {
      await deleteDoc(doc(db, 'incomes', d.id));
    }

    // Delete all affiliate accounts
    const accQuery = query(collection(db, 'affiliateAccounts'), where('userId', '==', userId));
    const accSnap = await getDocs(accQuery);
    for (const d of accSnap.docs) {
      await deleteDoc(doc(db, 'affiliateAccounts', d.id));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'bulk_delete');
    throw error;
  }
}

/**
 * Restore data from backup JSON
 */
export async function restoreUserData(
  userId: string,
  backupData: { accounts?: AffiliateAccount[]; incomes?: IncomeRecord[] }
): Promise<{ accountsRestored: number; incomesRestored: number }> {
  try {
    let accountsRestored = 0;
    let incomesRestored = 0;

    if (Array.isArray(backupData.accounts)) {
      for (const acc of backupData.accounts) {
        const id = acc.accountId || generateId('acc');
        await setDoc(doc(db, 'affiliateAccounts', id), {
          ...acc,
          accountId: id,
          userId, // Bind to current user!
          updatedAt: new Date().toISOString(),
        });
        accountsRestored++;
      }
    }

    if (Array.isArray(backupData.incomes)) {
      for (const inc of backupData.incomes) {
        const id = inc.transactionId || generateId('inc');
        const dateISO = inc.date || toISODateString();
        const week = getWeekRange(dateISO);
        await setDoc(doc(db, 'incomes', id), {
          ...inc,
          transactionId: id,
          userId, // Bind to current user!
          date: dateISO,
          day: inc.day || getIndonesianDayName(dateISO),
          month: inc.month || dateISO.slice(0, 7),
          year: inc.year || parseInt(dateISO.slice(0, 4), 10),
          weekStart: inc.weekStart || week.start,
          weekEnd: inc.weekEnd || week.end,
          amount: Math.max(0, Math.round(inc.amount || 0)),
          updatedAt: new Date().toISOString(),
        });
        incomesRestored++;
      }
    }

    return { accountsRestored, incomesRestored };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'restore');
    throw error;
  }
}
