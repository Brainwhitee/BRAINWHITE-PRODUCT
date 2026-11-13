"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
export const btnCls =
  "rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer";

export function ActionForm({
  action,
  children,
  submit,
  className = "space-y-3",
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submit: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
          {state.message}
        </p>
      )}
      <button className={btnCls} disabled={pending}>
        {pending ? "Working…" : submit}
      </button>
    </form>
  );
}
