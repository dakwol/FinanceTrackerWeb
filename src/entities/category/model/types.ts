import {
  CategoryTypeEnum,
  IsoDate,
  OwnerId,
} from "@/shared/model/finance";

export interface Category {
  rowNumber?: number;
  id: string;
  name: string;
  type: CategoryTypeEnum;
  owner: OwnerId;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}
