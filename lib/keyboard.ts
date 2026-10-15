import type { KeyboardEvent } from "react";

// Buttons retain their native Enter action; only editable fields advance focus.
export function advanceOnEnter(event: KeyboardEvent<HTMLElement>) {
  if (event.defaultPrevented || event.key !== "Enter" || event.nativeEvent.isComposing || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target instanceof HTMLSelectElement && !target.value) return;
  if (target.matches("[data-enter-skip]")) return;
  event.preventDefault();
  if (target.getAttribute("aria-invalid") === "true" || !target.checkValidity()) return;

  const steps = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("input:not([data-enter-skip]), select:not([data-enter-skip]), [data-enter-step]"))
    .filter((element) => !element.matches(":disabled, [hidden], [aria-disabled='true']") && element.getClientRects().length > 0);
  const index = steps.indexOf(target);
  if (index < 0) return;
  steps[index + 1]?.focus();
}
