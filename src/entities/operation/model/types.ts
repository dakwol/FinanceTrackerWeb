import {
  IsoDate,
  MonthId,
  OperationTypeEnum,
  OwnerId,
} from "@/shared/model/finance";

export interface Operation {
  rowNumber?: number;
  id: string;
  date: IsoDate;
  month: MonthId;
  type: OperationTypeEnum;
  categoryId: string;
  owner: OwnerId;
  amount: number;
  comment: string;
  createdByEmail: string;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
