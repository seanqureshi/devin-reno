"use client";

import { buttonClasses } from "./ui";

export function LogoutButton() {
  return (
    <button
      type="button"
      className={buttonClasses.ghost}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
