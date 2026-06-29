"use server";

import { cookies } from "next/headers";

export async function setRememberMeCookie(rememberMe: boolean) {
  const cookieStore = await cookies();
  if (rememberMe) {
    cookieStore.delete("threadcounty_session_only");
  } else {
    cookieStore.set("threadcounty_session_only", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
}

export async function clearRememberMeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("threadcounty_session_only");
}
