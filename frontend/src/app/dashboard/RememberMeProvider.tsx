"use client";

import { useRememberMe } from "@/lib/remember-me";

export function RememberMeProvider({ children }: { children: React.ReactNode }) {
  useRememberMe();
  return <>{children}</>;
}
