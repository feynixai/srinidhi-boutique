export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-cream">
      <div>
        <div className="text-6xl mb-4">📶</div>
        <h1 className="font-serif text-3xl text-charcoal mb-3">You're Offline</h1>
        <p className="text-charcoal/60 text-sm max-w-xs mx-auto mb-6">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary px-8 py-3 text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
