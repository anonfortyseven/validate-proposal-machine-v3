// Loading spinner shown while proposal data is being fetched
export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Animated background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(196, 30, 58, 0.06) 0%, transparent 50%)',
        }}
      />

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* Spinning loader */}
        <div className="relative w-16 h-16 mx-auto mb-8">
          {/* Outer ring */}
          <div
            className="absolute inset-0 border-2 border-zinc-800 rounded-full"
          />
          {/* Spinning ring */}
          <div
            className="absolute inset-0 border-2 border-transparent border-t-[#C41E3A] rounded-full animate-spin"
            style={{
              boxShadow: '0 0 20px rgba(196, 30, 58, 0.3)',
            }}
          />
          {/* Inner glow */}
          <div
            className="absolute inset-2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(196, 30, 58, 0.1) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Loading text */}
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
          Loading Proposal
        </p>
      </div>

      {/* Corner accents */}
      <div className="fixed top-6 left-6 w-12 h-12 opacity-30">
        <div className="absolute top-0 left-0 w-full h-px bg-zinc-700" />
        <div className="absolute top-0 left-0 w-px h-full bg-zinc-700" />
      </div>
      <div className="fixed top-6 right-6 w-12 h-12 opacity-30">
        <div className="absolute top-0 right-0 w-full h-px bg-zinc-700" />
        <div className="absolute top-0 right-0 w-px h-full bg-zinc-700" />
      </div>
      <div className="fixed bottom-6 left-6 w-12 h-12 opacity-30">
        <div className="absolute bottom-0 left-0 w-full h-px bg-zinc-700" />
        <div className="absolute bottom-0 left-0 w-px h-full bg-zinc-700" />
      </div>
      <div className="fixed bottom-6 right-6 w-12 h-12 opacity-30">
        <div className="absolute bottom-0 right-0 w-full h-px bg-zinc-700" />
        <div className="absolute bottom-0 right-0 w-px h-full bg-zinc-700" />
      </div>
    </div>
  );
}
