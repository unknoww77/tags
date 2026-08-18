"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  label?: string;
};

export function ImpersonateButton({ userId, label = "Acessar" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await fetch("/api/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Não foi possível acessar a conta");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <button type="button" className="selector-btn" onClick={onClick} disabled={loading}>
      {loading ? "..." : label}
    </button>
  );
}
