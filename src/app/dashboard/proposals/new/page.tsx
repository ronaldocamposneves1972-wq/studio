
'use client'

import { ProposalForm } from "@/components/dashboard/proposal-form";

export default function NewProposalPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Nova Proposta</h1>
            <p className="text-muted-foreground">Crie uma nova proposta de venda para um cliente.</p>
            <div className="mt-8">
                 <ProposalForm onSave={() => {}} />
            </div>
        </div>
    )
}
