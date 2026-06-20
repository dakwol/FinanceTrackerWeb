"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";

import type { Category } from "@/entities/category/model/types";
import type { Operation } from "@/entities/operation/model/types";
import type { Plan } from "@/entities/plan/model/types";
import type { Transfer } from "@/entities/transfer/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import {
  appendSheetRow,
  ensureFinanceSpreadsheetStructure,
  getSpreadsheetMetadata,
  GoogleApiError,
  hasActiveGoogleSession,
  readSheetRows,
  restoreGoogleSession,
  signInWithGoogle,
  signOutFromGoogle,
  shareSpreadsheetWithEmail,
  updateSheetRow,
} from "@/shared/api/google";
import type {
  GoogleCellValue,
  GoogleSpreadsheet,
  GoogleUser,
} from "@/shared/api/google";
import {
  CategoryTypeEnum,
  OperationTypeEnum,
  SheetNameEnum,
  UserRoleEnum,
} from "@/shared/model/finance";

const spreadsheetStorageKey = "finance-tracker-spreadsheet-id";
const spreadsheetStorageEventName = "finance-workspace-storage-change";

interface FinanceWorkspaceContextValue {
  currentUser: GoogleUser | null;
  spreadsheetId: string | null;
  spreadsheet: GoogleSpreadsheet | null;
  users: WorkspaceUser[];
  categories: Category[];
  plans: Plan[];
  operations: Operation[];
  transfers: Transfer[];
  isAuthReady: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  signIn: () => Promise<GoogleUser>;
  signOut: () => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  addOperation: (operation: Operation) => Promise<void>;
  updateOperation: (operation: Operation) => Promise<void>;
  addPlan: (plan: Plan) => Promise<void>;
  addPlans: (plans: Plan[]) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  addTransfer: (transfer: Transfer) => Promise<void>;
  invitePartner: (email: string) => Promise<void>;
  connectSpreadsheet: (spreadsheetId: string) => Promise<void>;
  clearSpreadsheet: () => void;
  refreshWorkspaceData: () => Promise<void>;
  clearError: () => void;
}

interface FinanceWorkspaceProviderProps {
  children: ReactNode;
}

const FinanceWorkspaceContext =
  createContext<FinanceWorkspaceContextValue | null>(null);

export function FinanceWorkspaceProvider({
  children,
}: FinanceWorkspaceProviderProps) {
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<GoogleSpreadsheet | null>(
    null,
  );
  const spreadsheetId = useSyncExternalStore(
    subscribeToSpreadsheetStorage,
    getSpreadsheetStorageSnapshot,
    getServerSpreadsheetStorageSnapshot,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // The persisted Google session is an external browser store restored after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentUser(restoreGoogleSession());
    setIsAuthReady(true);
  }, []);

  const runWithLoading = useCallback(
    async <Result,>(operation: () => Promise<Result>): Promise<Result> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        return await operation();
      } catch (error) {
        const message = getErrorMessage(error);
        setErrorMessage(message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signIn = useCallback(
    () =>
      runWithLoading(async () => {
        const user = await signInWithGoogle();
        setCurrentUser(user);
        return user;
      }),
    [runWithLoading],
  );

  const signOut = useCallback(
    () =>
      runWithLoading(async () => {
        await signOutFromGoogle();
        setCurrentUser(null);
        setSpreadsheet(null);
        setCategories([]);
        setUsers([]);
        setPlans([]);
        setOperations([]);
        setTransfers([]);
      }),
    [runWithLoading],
  );

  const addCategory = useCallback(
    (category: Category) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        await appendSheetRow(
          spreadsheetId,
          SheetNameEnum.Categories,
          categoryToSheetRow(category),
        );

        const categoryRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Categories,
        );
        setCategories(mapCategoryRows(categoryRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const updateCategory = useCallback(
    (category: Category) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        if (!category.rowNumber) {
          throw new GoogleApiError(
            "Не удалось определить строку категории в Google Sheets.",
          );
        }

        await updateSheetRow({
          spreadsheetId,
          sheetName: SheetNameEnum.Categories,
          rowNumber: category.rowNumber,
          values: categoryToSheetRow(category),
        });

        setCategories((currentCategories) =>
          currentCategories.map((currentCategory) =>
            currentCategory.id === category.id ? category : currentCategory,
          ),
        );
      }),
    [runWithLoading, spreadsheetId],
  );

  const addOperation = useCallback(
    (operation: Operation) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        await appendSheetRow(spreadsheetId, SheetNameEnum.Operations, [
          operation.id,
          operation.date,
          operation.month,
          operation.type,
          operation.categoryId,
          operation.owner,
          operation.amount,
          operation.comment,
          operation.createdByEmail,
          operation.createdAt,
          operation.updatedAt,
        ]);

        const operationRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Operations,
        );
        setOperations(mapOperationRows(operationRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const updateOperation = useCallback(
    (operation: Operation) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        if (!operation.rowNumber) {
          throw new GoogleApiError(
            "Не удалось определить строку операции в Google Sheets.",
          );
        }

        await updateSheetRow({
          spreadsheetId,
          sheetName: SheetNameEnum.Operations,
          rowNumber: operation.rowNumber,
          values: operationToSheetRow(operation),
        });

        setOperations((currentOperations) =>
          currentOperations.map((currentOperation) =>
            currentOperation.id === operation.id
              ? operation
              : currentOperation,
          ),
        );
      }),
    [runWithLoading, spreadsheetId],
  );

  const addPlan = useCallback(
    (plan: Plan) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        await appendSheetRow(
          spreadsheetId,
          SheetNameEnum.Plans,
          planToSheetRow(plan),
        );
        const planRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Plans,
        );
        setPlans(mapPlanRows(planRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const addPlans = useCallback(
    (newPlans: Plan[]) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        for (const plan of newPlans) {
          await appendSheetRow(
            spreadsheetId,
            SheetNameEnum.Plans,
            planToSheetRow(plan),
          );
        }

        const planRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Plans,
        );
        setPlans(mapPlanRows(planRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const updatePlan = useCallback(
    (plan: Plan) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        if (!plan.rowNumber) {
          throw new GoogleApiError(
            "Не удалось определить строку плана в Google Sheets.",
          );
        }

        await updateSheetRow({
          spreadsheetId,
          sheetName: SheetNameEnum.Plans,
          rowNumber: plan.rowNumber,
          values: planToSheetRow(plan),
        });
        setPlans((currentPlans) =>
          currentPlans.map((currentPlan) =>
            currentPlan.id === plan.id ? plan : currentPlan,
          ),
        );
      }),
    [runWithLoading, spreadsheetId],
  );

  const invitePartner = useCallback(
    (email: string) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        await shareSpreadsheetWithEmail(spreadsheetId, email);
        const userRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Users,
        );
        const normalizedEmail = email.trim().toLowerCase();
        const partnerAlreadyExists = userRows
          .slice(1)
          .some((row) => String(row[2] ?? "").toLowerCase() === normalizedEmail);

        if (!partnerAlreadyExists) {
          await appendSheetRow(spreadsheetId, SheetNameEnum.Users, [
            crypto.randomUUID(),
            "",
            normalizedEmail,
            "partner",
            new Date().toISOString().slice(0, 10),
          ]);
        }

        const refreshedUserRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Users,
        );
        setUsers(mapUserRows(refreshedUserRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const addTransfer = useCallback(
    (transfer: Transfer) =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          throw new GoogleApiError("Сначала подключите Google Spreadsheet.");
        }

        await appendSheetRow(
          spreadsheetId,
          SheetNameEnum.Transfers,
          transferToSheetRow(transfer),
        );
        const transferRows = await readSheetRows(
          spreadsheetId,
          SheetNameEnum.Transfers,
        );
        setTransfers(mapTransferRows(transferRows));
      }),
    [runWithLoading, spreadsheetId],
  );

  const refreshWorkspaceData = useCallback(
    () =>
      runWithLoading(async () => {
        if (!spreadsheetId) {
          setCategories([]);
          setUsers([]);
          setPlans([]);
          setOperations([]);
          setTransfers([]);
          return;
        }

        if (!hasActiveGoogleSession()) {
          throw new GoogleApiError(
            "Для загрузки данных войдите в Google повторно.",
          );
        }

        await ensureFinanceSpreadsheetStructure(spreadsheetId);

        const [
          spreadsheetMetadata,
          categoryRows,
          userRows,
          planRows,
          operationRows,
          transferRows,
        ] =
          await Promise.all([
          getSpreadsheetMetadata(spreadsheetId),
          readSheetRows(spreadsheetId, SheetNameEnum.Categories),
          readSheetRows(spreadsheetId, SheetNameEnum.Users),
          readSheetRows(spreadsheetId, SheetNameEnum.Plans),
          readSheetRows(spreadsheetId, SheetNameEnum.Operations),
          readSheetRows(spreadsheetId, SheetNameEnum.Transfers),
        ]);

        setSpreadsheet(spreadsheetMetadata);
        setCategories(mapCategoryRows(categoryRows));
        setUsers(enrichWorkspaceUsers(mapUserRows(userRows), currentUser));
        setPlans(mapPlanRows(planRows));
        setOperations(mapOperationRows(operationRows));
        setTransfers(mapTransferRows(transferRows));
      }),
    [currentUser, runWithLoading, spreadsheetId],
  );

  const connectSpreadsheet = useCallback(
    (nextSpreadsheetId: string) =>
      runWithLoading(async () => {
        localStorage.setItem(spreadsheetStorageKey, nextSpreadsheetId);
        window.dispatchEvent(new Event(spreadsheetStorageEventName));
      }),
    [runWithLoading],
  );

  const clearSpreadsheet = useCallback(() => {
    localStorage.removeItem(spreadsheetStorageKey);
    window.dispatchEvent(new Event(spreadsheetStorageEventName));
    setCategories([]);
    setUsers([]);
    setSpreadsheet(null);
    setPlans([]);
    setOperations([]);
    setTransfers([]);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const contextValue = useMemo<FinanceWorkspaceContextValue>(
    () => ({
      currentUser,
      spreadsheetId,
      spreadsheet,
      users,
      categories,
      plans,
      operations,
      transfers,
      isAuthReady,
      isLoading,
      errorMessage,
      signIn,
      signOut,
      addCategory,
      updateCategory,
      addOperation,
      updateOperation,
      addPlan,
      addPlans,
      updatePlan,
      addTransfer,
      invitePartner,
      connectSpreadsheet,
      clearSpreadsheet,
      refreshWorkspaceData,
      clearError,
    }),
    [
      currentUser,
      spreadsheetId,
      spreadsheet,
      users,
      categories,
      plans,
      operations,
      transfers,
      isAuthReady,
      isLoading,
      errorMessage,
      signIn,
      signOut,
      addCategory,
      updateCategory,
      addOperation,
      updateOperation,
      addPlan,
      addPlans,
      updatePlan,
      addTransfer,
      invitePartner,
      connectSpreadsheet,
      clearSpreadsheet,
      refreshWorkspaceData,
      clearError,
    ],
  );

  return (
    <FinanceWorkspaceContext.Provider value={contextValue}>
      {children}
    </FinanceWorkspaceContext.Provider>
  );
}

export function useFinanceWorkspace(): FinanceWorkspaceContextValue {
  const context = useContext(FinanceWorkspaceContext);

  if (!context) {
    throw new Error(
      "useFinanceWorkspace должен использоваться внутри FinanceWorkspaceProvider.",
    );
  }

  return context;
}

function mapCategoryRows(rows: GoogleCellValue[][]): Category[] {
  return rows.slice(1).flatMap((row, index) => {
    if (!row[0] || !row[1]) {
      return [];
    }

    return [
      {
        rowNumber: index + 2,
        id: String(row[0]),
        name: String(row[1]),
        type: row[2] as CategoryTypeEnum,
        owner: String(row[3]),
        color: String(row[4] ?? "#64748b"),
        icon: String(row[5] ?? "circle"),
        isActive: toBoolean(row[6]),
        createdAt: String(row[7]) as Category["createdAt"],
        updatedAt: String(row[8]) as Category["updatedAt"],
      },
    ];
  });
}

function categoryToSheetRow(category: Category): GoogleCellValue[] {
  return [
    category.id,
    category.name,
    category.type,
    category.owner,
    category.color,
    category.icon,
    category.isActive,
    category.createdAt,
    category.updatedAt,
  ];
}

function mapPlanRows(rows: GoogleCellValue[][]): Plan[] {
  return rows.slice(1).flatMap((row, index) => {
    if (!row[0] || !row[1] || !row[2]) {
      return [];
    }

    return [
      {
        rowNumber: index + 2,
        id: String(row[0]),
        month: String(row[1]) as Plan["month"],
        categoryId: String(row[2]),
        plannedAmount: Number(row[3] ?? 0),
        owner: String(row[4]),
        paymentDay: row[5] === null || row[5] === "" ? null : Number(row[5]),
        createdAt: String(row[6]) as Plan["createdAt"],
        updatedAt: String(row[7]) as Plan["updatedAt"],
      },
    ];
  });
}

function planToSheetRow(plan: Plan): GoogleCellValue[] {
  return [
    plan.id,
    plan.month,
    plan.categoryId,
    plan.plannedAmount,
    plan.owner,
    plan.paymentDay,
    plan.createdAt,
    plan.updatedAt,
  ];
}

function mapOperationRows(rows: GoogleCellValue[][]): Operation[] {
  return rows.slice(1).flatMap((row, index) => {
    if (!row[0] || !row[1] || !row[2]) {
      return [];
    }

    return [
      {
        rowNumber: index + 2,
        id: String(row[0]),
        date: String(row[1]) as Operation["date"],
        month: String(row[2]) as Operation["month"],
        type: row[3] as OperationTypeEnum,
        categoryId: String(row[4]),
        owner: String(row[5]),
        amount: Number(row[6] ?? 0),
        comment: String(row[7] ?? ""),
        createdByEmail: String(row[8] ?? ""),
        createdAt: String(row[9]) as Operation["createdAt"],
        updatedAt: String(row[10]) as Operation["updatedAt"],
      },
    ];
  });
}

function operationToSheetRow(operation: Operation): GoogleCellValue[] {
  return [
    operation.id,
    operation.date,
    operation.month,
    operation.type,
    operation.categoryId,
    operation.owner,
    operation.amount,
    operation.comment,
    operation.createdByEmail,
    operation.createdAt,
    operation.updatedAt,
  ];
}

function mapTransferRows(rows: GoogleCellValue[][]): Transfer[] {
  return rows.slice(1).flatMap((row, index) => {
    if (!row[0] || !row[1]) {
      return [];
    }

    return [
      {
        rowNumber: index + 2,
        id: String(row[0]),
        date: String(row[1]) as Transfer["date"],
        month: String(row[1]).slice(0, 7) as Transfer["month"],
        fromOwner: String(row[2]),
        toOwner: String(row[3]),
        amount: Number(row[4] ?? 0),
        comment: String(row[5] ?? ""),
        createdByEmail: String(row[6] ?? ""),
        createdAt: String(row[7]) as Transfer["createdAt"],
      },
    ];
  });
}

function transferToSheetRow(transfer: Transfer): GoogleCellValue[] {
  return [
    transfer.id,
    transfer.date,
    transfer.fromOwner,
    transfer.toOwner,
    transfer.amount,
    transfer.comment,
    transfer.createdByEmail,
    transfer.createdAt,
  ];
}

function mapUserRows(rows: GoogleCellValue[][]): WorkspaceUser[] {
  return rows.slice(1).flatMap((row, index) => {
    if (!row[0] || !row[2]) {
      return [];
    }

    return [
      {
        rowNumber: index + 2,
        id: String(row[0]),
        name: String(row[1] ?? ""),
        email: String(row[2]),
        role: row[3] as UserRoleEnum,
        createdAt: String(row[4]) as WorkspaceUser["createdAt"],
      },
    ];
  });
}

function enrichWorkspaceUsers(
  users: WorkspaceUser[],
  currentUser: GoogleUser | null,
): WorkspaceUser[] {
  if (!currentUser) {
    return users;
  }

  return users.map((user) =>
    user.email.toLowerCase() === currentUser.email.toLowerCase()
      ? { ...user, name: currentUser.name }
      : user,
  );
}

function toBoolean(value: GoogleCellValue): boolean {
  return value === true || String(value).toLowerCase() === "true";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла неизвестная ошибка.";
}

function subscribeToSpreadsheetStorage(onStoreChange: () => void): () => void {
  const handleStorageChange = () => onStoreChange();

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(spreadsheetStorageEventName, handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(spreadsheetStorageEventName, handleStorageChange);
  };
}

function getSpreadsheetStorageSnapshot(): string | null {
  return localStorage.getItem(spreadsheetStorageKey);
}

function getServerSpreadsheetStorageSnapshot(): null {
  return null;
}
