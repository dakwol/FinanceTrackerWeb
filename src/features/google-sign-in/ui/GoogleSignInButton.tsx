"use client";

import { useRouter } from "next/navigation";

import { useFinanceWorkspace } from "@/features/finance-workspace";
import { Button } from "@/shared/ui/Button";

interface GoogleSignInButtonProps {
  fullWidth?: boolean;
}

export function GoogleSignInButton({
  fullWidth = false,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { spreadsheetId, isLoading, errorMessage, signIn, clearError } =
    useFinanceWorkspace();

  const handleSignIn = async () => {
    clearError();

    try {
      await signIn();
      router.push(spreadsheetId ? "/dashboard" : "/onboarding");
    } catch {
      return;
    }
  };

  return (
    <div>
      <Button
        disabled={isLoading}
        fullWidth={fullWidth}
        onClick={handleSignIn}
      >
        {isLoading ? "Подключаем Google..." : "Продолжить с Google"}
      </Button>
      {errorMessage && (
        <p aria-live="polite" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

