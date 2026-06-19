import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

import styles from "./Card.module.scss";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ children, className, ...cardProps }: CardProps) {
  return (
    <section className={clsx(styles.card, className)} {...cardProps}>
      {children}
    </section>
  );
}

