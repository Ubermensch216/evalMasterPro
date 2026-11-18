"use client";

import { useState } from 'react';
import { useStore, type Candidate } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import EntityDialog from '@/components/admin/EntityDialog';
import AdminTableActions from '@/components/admin/AdminTableActions';

export default function CandidateManager() {
  const { candidates, addCandidate, updateCandidate, deleteCandidate } = useStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState<Partial<Candidate>>({});
  const { toast } = useToast();

  const handleSave = async () => {
    const trimmedName = currentCandidate.name?.trim();
    if (!trimmedName) {
      toast({ title: '오류', description: '대상자 이름을 입력해주세요.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentCandidate.id) {
        await updateCandidate(currentCandidate.id, { name: trimmedName });
        toast({ title: '성공', description: '평가 대상자 정보가 수정되었습니다.' });
      } else {
        await addCandidate(trimmedName);
        toast({ title: '성공', description: '새 평가 대상자가 추가되었습니다.' });
      }
      setCurrentCandidate({});
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save candidate:', error);
      toast({ title: '오류', description: '저장에 실패했습니다.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCandidate(id);
      toast({ title: '성공', description: '평가 대상자가 삭제되었습니다.' });
    } catch (error) {
      console.error('Failed to delete candidate:', error);
      toast({ title: '오류', description: '삭제에 실패했습니다.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>평가 대상자 관리</CardTitle>
            <CardDescription>평가에 참여할 대상자를 추가, 수정, 삭제합니다.</CardDescription>
          </div>
          <EntityDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onOpenNew={() => {
              setCurrentCandidate({});
              setDialogOpen(true);
            }}
            title={currentCandidate.id ? '대상자 수정' : '새 대상자 추가'}
            isSaving={isSaving}
            onSubmit={handleSave}
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="candidate-name" className="text-right">
                이름
              </Label>
              <Input
                id="candidate-name"
                value={currentCandidate.name || ''}
                onChange={(e) => setCurrentCandidate({ ...currentCandidate, name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </EntityDialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                  등록된 평가 대상자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell className="font-medium">{candidate.name}</TableCell>
                  <TableCell className="text-right">
                    <AdminTableActions
                      entityLabel={candidate.name}
                      onEdit={() => {
                        setCurrentCandidate(candidate);
                        setDialogOpen(true);
                      }}
                      onDelete={() => handleDelete(candidate.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
