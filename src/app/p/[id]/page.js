import ProposalViewer from './ProposalViewer';

async function getShare(id) {
  try {
    // Fetch directly from Supabase public URL (more reliable for SSR)
    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wyshbbvrnrjwsoaycvaf.supabase.co';
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/public/validate-projects/shares/${id}.json?t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.error('Share fetch failed:', response.status);
      return null;
    }

    const share = await response.json();

    // Strip password hash for security, add hasPassword flag
    const { passwordHash, ...safeShare } = share;
    return {
      ...safeShare,
      hasPassword: !!passwordHash
    };
  } catch (e) {
    console.error('Error fetching share:', e);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const share = await getShare(params.id);

  if (!share) {
    return {
      title: 'Proposal Not Found | VALIDATE',
    };
  }

  const projectName = share.projectName && share.projectName !== 'Untitled Proposal' ? share.projectName : '';
  const clientName = share.clientName || '';
  const displayName = projectName || clientName || 'Proposal';
  const description = clientName ? `Creative proposal for ${clientName}` : 'Creative proposal by VALIDATE';

  return {
    title: `${displayName} | VALIDATE`,
    description,
    openGraph: {
      title: `${displayName} - Proposal by VALIDATE`,
      description,
      type: 'website',
    },
  };
}

export default async function ProposalPage({ params }) {
  const share = await getShare(params.id);

  if (!share) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Subtle background gradient */}
        <div
          className="fixed inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(196, 30, 58, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Corner accents */}
        <div className="fixed top-6 left-6 w-12 h-12 opacity-20">
          <div className="absolute top-0 left-0 w-full h-px bg-zinc-600" />
          <div className="absolute top-0 left-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed top-6 right-6 w-12 h-12 opacity-20">
          <div className="absolute top-0 right-0 w-full h-px bg-zinc-600" />
          <div className="absolute top-0 right-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed bottom-6 left-6 w-12 h-12 opacity-20">
          <div className="absolute bottom-0 left-0 w-full h-px bg-zinc-600" />
          <div className="absolute bottom-0 left-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed bottom-6 right-6 w-12 h-12 opacity-20">
          <div className="absolute bottom-0 right-0 w-full h-px bg-zinc-600" />
          <div className="absolute bottom-0 right-0 w-px h-full bg-zinc-600" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-md">
          {/* Error icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-zinc-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wider mb-3">
            PROPOSAL NOT FOUND
          </h1>
          <p className="text-zinc-400 font-body text-sm sm:text-base mb-8 leading-relaxed">
            This proposal may have been removed or the link is invalid. Please check the URL or contact the sender for a new link.
          </p>

          {/* VALIDATE branding */}
          <div className="pt-8 border-t border-zinc-800">
            <p className="font-mono text-xs text-zinc-600 uppercase tracking-[0.3em]">
              VALIDATE
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if expired
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    const expiredDate = new Date(share.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Subtle background gradient */}
        <div
          className="fixed inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 30%, rgba(196, 30, 58, 0.08) 0%, transparent 60%)',
          }}
        />

        {/* Corner accents */}
        <div className="fixed top-6 left-6 w-12 h-12 opacity-20">
          <div className="absolute top-0 left-0 w-full h-px bg-zinc-600" />
          <div className="absolute top-0 left-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed top-6 right-6 w-12 h-12 opacity-20">
          <div className="absolute top-0 right-0 w-full h-px bg-zinc-600" />
          <div className="absolute top-0 right-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed bottom-6 left-6 w-12 h-12 opacity-20">
          <div className="absolute bottom-0 left-0 w-full h-px bg-zinc-600" />
          <div className="absolute bottom-0 left-0 w-px h-full bg-zinc-600" />
        </div>
        <div className="fixed bottom-6 right-6 w-12 h-12 opacity-20">
          <div className="absolute bottom-0 right-0 w-full h-px bg-zinc-600" />
          <div className="absolute bottom-0 right-0 w-px h-full bg-zinc-600" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-md">
          {/* Clock icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-zinc-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wider mb-3">
            LINK EXPIRED
          </h1>
          <p className="text-zinc-400 font-body text-sm sm:text-base mb-4 leading-relaxed">
            This proposal link expired on {expiredDate}.
          </p>
          <p className="text-zinc-500 font-body text-sm leading-relaxed mb-8">
            Please contact the sender to request a new link to view this proposal.
          </p>

          {/* VALIDATE branding */}
          <div className="pt-8 border-t border-zinc-800">
            <p className="font-mono text-xs text-zinc-600 uppercase tracking-[0.3em]">
              VALIDATE
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pass share data to client component
  // API already strips password hash and returns hasPassword boolean
  return (
    <ProposalViewer
      share={share}
      hasPassword={share.hasPassword}
      shareId={params.id}
    />
  );
}
