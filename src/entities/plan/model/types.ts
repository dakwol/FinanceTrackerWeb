import {
  IsoDate,
  MonthId,
  OwnerId,
} from "@/shared/model/finance";

export interface Plan {
  rowNumber?: number;
  id: string;
  month: MonthId;
  categoryId: string;
  plannedAmount: number;
  owner: OwnerId;
  paymentDay: number | null;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
