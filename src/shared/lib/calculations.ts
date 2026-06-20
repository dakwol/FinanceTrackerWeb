import type { Category } from "@/entities/category/model/types";
import type { Operation } from "@/entities/operation/model/types";
import type { Plan } from "@/entities/plan/model/types";
import {
  CategoryTypeEnum,
  MonthId,
  OperationTypeEnum,
  OwnerId,
  unlimitedPlanAmount,
} from "@/shared/model/finance";

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  freeBalance: number;
  plannedExpense: number;
  actualExpense: number;
  plannedSaving: number;
  actualSaving: number;
}

export interface CategoryProgress {
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  progressPercent: number;
  isUnlimited: boolean;
}

export interface CalculateMonthSummaryParams {
  operations: Operation[];
  plans: Plan[];
  categories: Category[];
  month: MonthId;
}

export interface CalculateCategoryProgressParams {
  categoryId: string;
  operations: Operation[];
  plans: Plan[];
  month: MonthId;
}

export function getOperationsByMonth(
  operations: Operation[],
  month: MonthId,
): Operation[] {
  return operations.filter((operation) => operation.month === month);
}

export function getPlansByMonth(plans: Plan[], month: MonthId): Plan[] {
  return plans.filter((plan) => plan.month === month);
}

export function calculateFreeBalance(
  income: number,
  expense: number,
  saving: number,
): number {
  return income - expense - saving;
}

export function calculateMonthSummary(
  params: CalculateMonthSummaryParams,
): MonthSummary {
  const { operations, plans, categories, month } = params;
  const monthOperations = getOperationsByMonth(operations, month);
  const monthPlans = getPlansByMonth(plans, month);
  const categoryTypeById = new Map(
    categories.map((category) => [category.id, category.type]),
  );
  const totalIncome = sumOperations(monthOperations, OperationTypeEnum.Income);
  const totalExpense = sumOperations(monthOperations, OperationTypeEnum.Expense);
  const totalSaving = sumOperations(monthOperations, OperationTypeEnum.Saving);
  const plannedExpense = sumPlans(
    monthPlans,
    categoryTypeById,
    CategoryTypeEnum.Expense,
  );
  const plannedSaving = sumPlans(
    monthPlans,
    categoryTypeById,
    CategoryTypeEnum.Saving,
  );

  return {
    totalIncome,
    totalExpense,
    totalSaving,
    freeBalance: calculateFreeBalance(totalIncome, totalExpense, totalSaving),
    plannedExpense,
    actualExpense: totalExpense,
    plannedSaving,
    actualSaving: totalSaving,
  };
}

export function calculateCategoryProgress(
  params: CalculateCategoryProgressParams,
): CategoryProgress {
  const { categoryId, operations, plans, month } = params;
  const plannedAmount = getPlansByMonth(plans, month)
    .filter((plan) => plan.categoryId === categoryId)
    .reduce((total, plan) => total + plan.plannedAmount, 0);
  const isUnlimited = getPlansByMonth(plans, month).some(
    (plan) =>
      plan.categoryId === categoryId &&
      plan.plannedAmount === unlimitedPlanAmount,
  );
  const actualAmount = getOperationsByMonth(operations, month)
    .filter((operation) => operation.categoryId === categoryId)
    .reduce((total, operation) => total + operation.amount, 0);
  const normalizedPlannedAmount = isUnlimited ? 0 : plannedAmount;
  const progressPercent =
    normalizedPlannedAmount > 0
      ? Math.round((actualAmount / normalizedPlannedAmount) * 100)
      : 0;

  return {
    plannedAmount: normalizedPlannedAmount,
    actualAmount,
    remainingAmount: isUnlimited
      ? 0
      : normalizedPlannedAmount - actualAmount,
    progressPercent,
    isUnlimited,
  };
}

export function calculateOwnerSummary(
  operations: Operation[],
  owner: OwnerId,
  month: MonthId,
): MonthSummary {
  const ownerOperations = getOperationsByMonth(operations, month).filter(
    (operation) => operation.owner === owner,
  );

  const totalIncome = sumOperations(ownerOperations, OperationTypeEnum.Income);
  const totalExpense = sumOperations(ownerOperations, OperationTypeEnum.Expense);
  const totalSaving = sumOperations(ownerOperations, OperationTypeEnum.Saving);

  return {
    totalIncome,
    totalExpense,
    totalSaving,
    freeBalance: calculateFreeBalance(totalIncome, totalExpense, totalSaving),
    plannedExpense: 0,
    actualExpense: totalExpense,
    plannedSaving: 0,
    actualSaving: totalSaving,
  };
}

function sumOperations(
  operations: Operation[],
  type: OperationTypeEnum,
): number {
  return operations
    .filter((operation) => operation.type === type)
    .reduce((total, operation) => total + operation.amount, 0);
}

function sumPlans(
  plans: Plan[],
  categoryTypeById: Map<string, CategoryTypeEnum>,
  type: CategoryTypeEnum,
): number {
  return plans
    .filter((plan) => categoryTypeById.get(plan.categoryId) === type)
    .filter((plan) => plan.plannedAmount !== unlimitedPlanAmount)
    .reduce((total, plan) => total + plan.plannedAmount, 0);
}
