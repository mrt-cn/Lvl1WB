export interface SplitResult {
  perPerson: string;
  error: string | null;
}

export function splitBill(total: number, people: number): SplitResult {
  if (!(total > 0)) {
    return { perPerson: "0", error: "Toplam tutar 0'dan büyük olmalı." };
  }
  if (!Number.isInteger(people) || people < 1) {
    return { perPerson: "0", error: "Kişi sayısı en az 1 tam sayı olmalı." };
  }
  const perPerson = (total / people).toFixed(7);
  return { perPerson, error: null };
}
