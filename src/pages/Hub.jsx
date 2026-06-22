const TOOLS = [
  {
    id: 'receive-inventory',
    label: 'Receive Inventory',
    description: 'Record serial numbers of incoming stock for manager approval',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'ship-orders',
    label: 'Ship Orders',
    description: 'Assign serial numbers to pending orders and mark as shipped',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
]

export default function Hub({ auth, onLogout, onNavigate }) {
  const bg = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
      {[12, 25, 38, 51, 64, 77, 90].map(x => (
        <div key={x} className="absolute top-0 bottom-0 w-px bg-[#E2E2E0]" style={{ left: `${x}%` }} />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {bg}

      {/* Header */}
      <header className="relative z-20 sticky top-0 bg-[#F8F8F8] border-b border-[#E2E2E0] px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/PAG Logo.png" alt="PAG" className="h-8 md:h-10 w-auto" />
          <div className="hidden sm:block w-px h-6 bg-[#E2E2E0]" />
          <span className="hidden sm:block text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase">Staff Tools</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#888] hidden sm:block">{auth.name}</span>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border border-[#111] text-[#111]">
            {auth.role}
          </span>
          <button
            onClick={onLogout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#888] hover:text-[#D41414] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 px-4 md:px-10 py-10 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Staff Portal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#111] tracking-tight leading-none">
            Tools Hub<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#E2E2E0]">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group bg-white p-8 text-left flex flex-col gap-5 hover:bg-[#111] transition-colors duration-200"
            >
              <div className="text-[#888] group-hover:text-[#555]">
                {tool.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#111] text-lg leading-snug group-hover:text-white transition-colors">
                  {tool.label}
                </p>
                <p className="text-sm text-[#888] mt-1.5 leading-relaxed group-hover:text-[#AAA] transition-colors">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#CCC] group-hover:text-[#666] transition-colors">
                Open
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>

      <footer className="relative z-10 px-4 md:px-10 pb-8 pt-4">
        <div className="border-t border-[#E2E2E0] pt-4 flex justify-between">
          <span className="text-xs text-[#AAA]">© 2025 Pro Audio Gadgets</span>
          <span className="text-xs text-[#AAA] tracking-widest uppercase hidden sm:block">Staff Access Only</span>
        </div>
      </footer>
    </div>
  )
}
