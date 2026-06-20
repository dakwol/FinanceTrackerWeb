import type { IsoDate } from "@/shared/model/finance";

export interface SavingsGoal {
  rowNumber?: number;
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
