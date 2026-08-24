"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const topmostModal = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')].at(-1);

type ModalLifecycleOptions = {
  readonly active: boolean;
  readonly onEscape?: () => void;
  readonly restoreFocus?: boolean;
};

type InertState = {
  readonly element: HTMLElement;
  readonly inert: boolean;
};

const isolateModal = (dialog: HTMLElement) => {
  const inertStates: InertState[] = [];
  let branch = dialog;
  while (branch.parentElement) {
    const parent = branch.parentElement;
    [...parent.children].forEach((element) => {
      if (element instanceof HTMLElement && element !== branch && !element.hasAttribute("data-modal-backdrop")) {
        inertStates.push({ element, inert: element.inert });
        element.inert = true;
      }
    });
    branch = parent;
    if (parent === document.body) break;
  }

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    inertStates.forEach(({ element, inert }) => {
      element.inert = inert;
    });
    document.body.style.overflow = previousOverflow;
  };
};

const keepFocusInside = (event: KeyboardEvent, dialog: HTMLElement) => {
  const focusable = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = focusable.at(0);
  const last = focusable.at(-1);
  if (!first || !last) return;

  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const listenForKeyboard = (dialog: HTMLElement, onEscapeRef: RefObject<(() => void) | undefined>) => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (topmostModal() !== dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      onEscapeRef.current?.();
    } else if (event.key === "Tab") {
      keepFocusInside(event, dialog);
    }
  };

  document.addEventListener("keydown", onKeyDown, true);
  return () => document.removeEventListener("keydown", onKeyDown, true);
};

export function useModalLifecycle(
  dialogRef: RefObject<HTMLElement | null>,
  { active, onEscape, restoreFocus = true }: ModalLifecycleOptions,
) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const restoreIsolation = isolateModal(dialog);
    if (topmostModal() === dialog) dialog.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const stopListening = listenForKeyboard(dialog, onEscapeRef);
    return () => {
      stopListening();
      restoreIsolation();
      if (restoreFocus && previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [active, dialogRef, restoreFocus]);
}
