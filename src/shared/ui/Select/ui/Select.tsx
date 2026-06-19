import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

import styles from "./Select.module.scss";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, options, id, ...selectProps }, ref) {
    const selectId = id ?? selectProps.name;

    return (
      <label className={styles.field} htmlFor={selectId}>
        {label && <span className={styles.label}>{label}</span>}
        <select
          className={styles.select}
          id={selectId}
          ref={ref}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className={styles.error}>{error}</span>}
      </label>
    );
  },
);
