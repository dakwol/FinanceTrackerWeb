import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

import styles from "./Button.module.scss";

export enum ButtonVariantEnum {
  Primary = "primary",
  Secondary = "secondary",
  Ghost = "ghost",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariantEnum;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = ButtonVariantEnum.Primary,
  fullWidth = false,
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        fullWidth && styles.fullWidth,
        className,
      )}
      type={type}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

