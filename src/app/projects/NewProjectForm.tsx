"use client";

import { useState } from "react";
import { buttonClasses, inputClasses, labelClasses } from "@/components/ui";

export function NewProjectForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address: address || undefined }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error ?? "Could not create project");
        window.location.href = `/projects/${data.id}`;
      }}
    >
      <div>
        <label className={labelClasses} htmlFor="project-name">Project name</label>
        <input id="project-name" className={inputClasses} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className={labelClasses} htmlFor="project-address">Address</label>
        <input id="project-address" className={inputClasses} value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <button type="submit" className={buttonClasses.primary}>Create project</button>
      {error && <p className="text-sm text-rose-600 md:col-span-3">{error}</p>}
    </form>
  );
}
