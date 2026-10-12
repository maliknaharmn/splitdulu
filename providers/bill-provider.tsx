"use client";

import * as React from "react";

import { calculateBill, createBlankBill, type BillDraft } from "@/lib/bill";
import { readPersistedState, writePersistedState } from "@/lib/storage";

type BillContextValue = {
  bill: BillDraft;
  recent: BillDraft[];
  hydrated: boolean;
  storageError: string | null;
  updateBill: (updater: (bill: BillDraft) => BillDraft) => void;
  startNewBill: () => void;
  loadRecent: (id: string) => void;
  saveCurrentToRecent: () => void;
  clearRecent: () => void;
};

const BillContext = React.createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const [bill, setBill] = React.useState<BillDraft>(() => createBlankBill());
  const [recent, setRecent] = React.useState<BillDraft[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [storageError, setStorageError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const saved = readPersistedState();
      if (saved.draft) setBill(saved.draft);
      setRecent(saved.recent);
      setStorageError(saved.error);
      setHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const error = writePersistedState(bill, recent);
    queueMicrotask(() => setStorageError(error));
  }, [bill, recent, hydrated]);

  const updateBill = React.useCallback((updater: (current: BillDraft) => BillDraft) => {
    setBill((current) => ({ ...updater(current), updatedAt: new Date().toISOString() }));
  }, []);

  const startNewBill = React.useCallback(() => {
    setBill(createBlankBill(crypto.randomUUID()));
  }, []);

  const loadRecent = React.useCallback((id: string) => {
    const selected = recent.find((entry) => entry.id === id);
    if (selected) setBill(selected);
  }, [recent]);

  const saveCurrentToRecent = React.useCallback(() => {
    if (!calculateBill(bill).canProceed) return;
    const snapshot = { ...bill, updatedAt: new Date().toISOString() };
    setBill(snapshot);
    setRecent((current) => [snapshot, ...current.filter((entry) => entry.id !== snapshot.id)].slice(0, 5));
  }, [bill]);

  const clearRecent = React.useCallback(() => setRecent([]), []);

  return (
    <BillContext.Provider value={{ bill, recent, hydrated, storageError, updateBill, startNewBill, loadRecent, saveCurrentToRecent, clearRecent }}>
      {children}
    </BillContext.Provider>
  );
}

export function useBill(): BillContextValue {
  const context = React.useContext(BillContext);
  if (!context) throw new Error("useBill harus digunakan di dalam BillProvider.");
  return context;
}
