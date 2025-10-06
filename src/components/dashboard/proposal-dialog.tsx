
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProposalForm } from "./proposal-form"
import type { Client } from "@/lib/types"

interface ProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  client: Client
}

export function ProposalDialog({ open, onOpenChange, onSave, client }: ProposalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Nova Proposta para {client.name}</DialogTitle>
          <DialogDescription>
            Selecione um produto e preencha o valor para criar uma nova oportunidade de crédito.
          </DialogDescription>
        </DialogHeader>
        <ProposalForm onSave={onSave} />
      </DialogContent>
    </Dialog>
  )
}
