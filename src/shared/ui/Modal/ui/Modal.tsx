"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button, ButtonVariantEnum } from "@/shared/ui/Button";

import styles from "./Modal.module.scss";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, onClose }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={styles.modal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2>{title}</h2>
          <Button
            aria-label="Закрыть"
            variant={ButtonVariantEnum.Ghost}
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}

