'use client'

import LoginGate from '@/components/LoginGate'
import ValidateProposalMachine from '@/components/ProposalMachine'

export default function ProposalsPage() {
  return (
    <LoginGate>
      <ValidateProposalMachine />
    </LoginGate>
  )
}
