"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, UserCheck, ListChecks, Trophy, Settings } from "lucide-react";
import EvaluatorManager from "./EvaluatorManager";
import CandidateManager from "./CandidateManager";
import ItemManager from "./ItemManager";
import ResultAggregation from "./ResultAggregation";
import SettingsPanel from "./SettingsPanel";

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">관리자 페이지</h1>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </Button>
      </div>
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="results"><Trophy className="mr-2 h-4 w-4" />결과 집계</TabsTrigger>
          <TabsTrigger value="evaluators"><Users className="mr-2 h-4 w-4" />평가 위원</TabsTrigger>
          <TabsTrigger value="candidates"><UserCheck className="mr-2 h-4 w-4" />평가 대상자</TabsTrigger>
          <TabsTrigger value="items"><ListChecks className="mr-2 h-4 w-4" />평가 항목</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />시스템 설정</TabsTrigger>
        </TabsList>
        <TabsContent value="results" className="mt-4">
          <ResultAggregation />
        </TabsContent>
        <TabsContent value="evaluators" className="mt-4">
          <EvaluatorManager />
        </TabsContent>
        <TabsContent value="candidates" className="mt-4">
          <CandidateManager />
        </TabsContent>
        <TabsContent value="items" className="mt-4">
          <ItemManager />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
