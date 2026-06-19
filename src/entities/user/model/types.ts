import { IsoDate, UserRoleEnum } from "@/shared/model/finance";

export interface WorkspaceUser {
  rowNumber?: number;
  id: string;
  name: string;
  email: string;
  role: UserRoleEnum;
  createdAt: IsoDate;
}

