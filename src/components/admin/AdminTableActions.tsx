"use client";

import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import ConfirmActionDialog from '@/components/common/ConfirmActionDialog';

interface AdminTableActionsProps {
  entityLabel: string;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}

/**
 * Standard edit and confirmed-delete icon buttons for admin management tables.
 */
export default function AdminTableActions({
  entityLabel,
  onEdit,
  onDelete,
}: AdminTableActionsProps) {
  return (
    <>
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`${entityLabel} 수정`}>
        <Edit className="h-4 w-4" />
      </Button>
      <ConfirmActionDialog
        trigger={
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={`${entityLabel} 삭제`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        }
        title="정말 삭제하시겠습니까?"
        description={`이 작업은 되돌릴 수 없습니다. '${entityLabel}' 및 관련 데이터가 영구적으로 삭제됩니다.`}
        confirmLabel="삭제"
        destructive
        onConfirm={onDelete}
      />
    </>
  );
}
