/**
 * Calculates the net balance for a seller.
 * balance = sum(debts) - sum(payments)
 *
 * This is a pure function — no side effects, no DB access.
 */
export function calculateBalance(debts: number[], payments: number[]): number {
  const totalDebts = debts.reduce((sum, d) => sum + d, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p, 0);
  return totalDebts - totalPayments;
}
