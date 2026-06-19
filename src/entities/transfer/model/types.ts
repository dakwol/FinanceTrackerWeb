import {
  IsoDate,
  MonthId,
  OwnerId,
} from "@/shared/model/finance";

export interface Transfer {
  rowNumber?: number;
  id: string;
  date: IsoDate;
  month: MonthId;
  fromOwner: OwnerId;
  toOwner: OwnerId;
  amount: number;
  comment: string;
  createdByEmail: string;
  createdAt: IsoDate;
}
