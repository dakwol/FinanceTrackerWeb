"use client";

import type { ReactNode } from "react";

import { FinanceWorkspaceProvider } from "@/features/finance-workspace";
import { PwaManager } from "@/shared/ui/PwaManager";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <FinanceWorkspaceProvider>
      {children}
      <PwaManager />
    </FinanceWorkspaceProvider>
  );
}
