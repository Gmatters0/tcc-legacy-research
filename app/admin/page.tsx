"use client";

import { useEffect, useState } from "react";
import { AdminLoginForm } from "./components/AdminLoginForm";
import { AdminDashboard } from "./AdminDashboard";

export default function AdminPage() {
  // undefined = ainda checando /api/admin/me; false = deslogado; true = logado
  const [autenticado, setAutenticado] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((response) => setAutenticado(response.ok))
      .catch(() => setAutenticado(false));
  }, []);

  if (autenticado === undefined) {
    return <div className="flex flex-1 bg-zinc-50" />;
  }

  if (!autenticado) {
    return <AdminLoginForm onLogin={() => setAutenticado(true)} />;
  }

  return <AdminDashboard onLogout={() => setAutenticado(false)} />;
}
