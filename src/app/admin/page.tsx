"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { adminPassword, superPassword, loading } = useStore();

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

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-center items-center py-12">
           <div className="w-full max-w-md space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
           </div>
        </div>
      </div>
    )
  }

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
