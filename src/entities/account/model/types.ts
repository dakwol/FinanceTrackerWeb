import type { IsoDate } from "@/shared/model/finance";

export interface SavingsAccount {
  rowNumber?: number;
  id: string;
  name: string;
  balance: number;
  color: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
