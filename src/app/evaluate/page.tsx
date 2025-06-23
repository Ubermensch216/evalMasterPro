"use client";

import { useState } from "react";
import type { Evaluator } from "@/lib/store";
import { useStore } from "@/lib/store";
import EvaluatorLogin from "@/components/evaluate/EvaluatorLogin";
import ScoringDashboard from "@/components/evaluate/ScoringDashboard";

export default function EvaluatePage() {
  const [loggedInEvaluator, setLoggedInEvaluator] = useState<Evaluator | null>(null);
  const { evaluators } = useStore();

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
