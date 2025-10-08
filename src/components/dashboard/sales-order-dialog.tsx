
'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SalesOrderForm } from "./sales-order-form"
import type { Client } from "@/lib/types"

interface SalesOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  client: Client
}

export function SalesOrderDialog({ open, onOpenChange, onSave, client }: SalesOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Novo Pedido de Venda para {client.name}</DialogTitle>
          <DialogDescription>
            Selecione os produtos (seguro, comissão, etc.) para registrar o pedido de venda.
          </DialogDescription>
        </DialogHeader>
        <SalesOrderForm onSave={onSave} />
      </DialogContent>
    </Dialog>
  )
}
