"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { adminPassword, superPassword } = useStore();

  const handleLogin = (password: string) => {
    if (password === adminPassword || password === superPassword) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {!isAuthenticated ? (
        <AdminLogin onLogin={handleLogin} />
      ) : (
        <AdminDashboard onLogout={handleLogout} />
      )}
    </div>
  );
}
