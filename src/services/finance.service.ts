import { apiClient } from './api';
export interface FinanceSummary { paymentsReceived: string; refundsPaid: string; withdrawalsPaid: string; walletIncome: string; pendingWithdrawals: string; refundsAwaitingReview: number }
export interface Payment { id: string; accountId: string; email: string; fullName: string; packageName: string; amount: string; status: number; paymentMethod: string | null; paymentRef: string | null; createdAt: string; reservedRefund: string }
export interface Refund { id: string; transactionId: string; amount: string; status: number; approval: number; reason: string; requestedByUserId: string | null; requestedAt: string; reviewedByAccountId: string | null; reviewReason: string | null; refundRef: string | null; failureReason: string | null }
export interface Withdrawal { id: string; accountId: string; amount: string; bankName: string; bankAccountNumber: string; bankAccountHolder: string; state: number; createdAt: string; reviewedBy: string | null; reviewedAt: string | null; reviewReason: string | null; orderedBy: string | null; orderedAt: string | null; confirmedBy: string | null; confirmedAt: string | null; payingAccount: string | null; bankReference: string | null; rejectedBy: string | null; rejectedAt: string | null; rejectionReason: string | null }
export interface LedgerEntry { id: string; accountId: string; amount: string; sourceReference: string; reason: string; actorAccountId: string; createdAt: string }
export interface FinanceList<T> { items: T[]; page: number; pageSize: number; total: number }
export interface Recipient { accountId: string; email: string; fullName: string }
const base = '/admin/finance';
export const financeService = {
  summary: async (signal?: AbortSignal) => (await apiClient.get<FinanceSummary>(base + '/summary', { signal })).data,
  list: async <T>(kind: string, page: number, signal?: AbortSignal) => (await apiClient.get<FinanceList<T>>(base + '/' + kind, { params: { page }, signal })).data,
  recipients: async (search: string, signal?: AbortSignal) => (await apiClient.get<Recipient[]>(base + '/recipients', { params: { search }, signal })).data,
  mutate: async (path: string, data?: unknown) => (await apiClient.post(base + '/' + path, data)).data,
  report: async () => {
    const response = await apiClient.get(base + '/report.csv', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data); const link = document.createElement('a');
    link.href = url; link.download = 'bao-cao-tai-chinh.csv'; link.click(); URL.revokeObjectURL(url);
  },
};
