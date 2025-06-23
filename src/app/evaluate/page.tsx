"use client";

import { useState } from "react";
import type { Evaluator } from "@/lib/store";
import { useStore } from "@/lib/store";
import EvaluatorLogin from "@/components/evaluate/EvaluatorLogin";
import ScoringDashboard from "@/components/evaluate/ScoringDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function EvaluatePage() {
  const [loggedInEvaluator, setLoggedInEvaluator] = useState<Evaluator | null>(null);
  const { evaluators, loading } = useStore();

  const handleLogin = (evaluatorId: string, password: string): boolean => {
    const evaluator = evaluators.find((e) => e.id === evaluatorId);
    if (evaluator && evaluator.password === password) {
      setLoggedInEvaluator(evaluator);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setLoggedInEvaluator(null);
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
      {!loggedInEvaluator ? (
        <EvaluatorLogin onLogin={handleLogin} />
      ) : (
        <ScoringDashboard evaluator={loggedInEvaluator} onLogout={handleLogout} />
      )}
    </div>
  );
}
