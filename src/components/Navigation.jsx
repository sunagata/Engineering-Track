const pages = [
  {
    id: 'today',
    label: 'Hari Ini',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'Riwayat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
        <polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Analitik',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
]

export default function Navigation({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-3xl mx-auto">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onChange(page.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              active === page.id ? 'text-primary' : 'text-ink-muted'
            }`}
          >
            {page.icon}
            {page.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
