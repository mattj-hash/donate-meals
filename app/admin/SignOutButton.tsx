"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      style={{
        padding: "6px 14px",
        fontSize: "13px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        backgroundColor: "#fff",
        cursor: "pointer",
        color: "#555",
      }}
    >
      Sign out
    </button>
  );
}
