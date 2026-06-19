import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...inputProps },
  ref,
) {
  const inputId = id ?? inputProps.name;

  return (
    <label className={styles.field} htmlFor={inputId}>
      {label && <span className={styles.label}>{label}</span>}
      <input
        className={clsx(styles.input, error && styles.invalid, className)}
        id={inputId}
        ref={ref}
        {...inputProps}
      />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
});
