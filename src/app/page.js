'use client'

import LoginGate from '@/components/LoginGate'
import ValidateProposalMachine from '@/components/ProposalMachine'

export default function Home() {
  return (
    <LoginGate>
      <ValidateProposalMachine />
    </LoginGate>
  )
}
