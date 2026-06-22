import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/apiFetch.js'
import { getImageUrl } from '../lib/storage.js'

let nextId = 1

function ProductCombobox({ products, value, onChange, openId, setOpenId, myId }) {
  const [search, setSearch] = useState('')
  const isOpen = openId === myId
  const selected = products.find(p => p.id === value)
  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  if (selected) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 shrink-0 bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
          <img
            src={getImageUrl(selected.image_path) ?? '/PAG Logo.png'}
            alt={selected.name}
            className="w-full h-full object-contain p-1"
            onError={e => { e.currentTarget.src = '/PAG Logo.png' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111] truncate">{selected.name}</p>
          <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">{selected.category}</p>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${
            selected.shop_qty > 0 ? 'text-green-700' : 'text-[#B07800]'
          }`}>
            {selected.shop_qty > 0 ? `${selected.shop_qty} in stock` : 'out of stock'}
          </span>
        </div>
        <button
          onClick={() => { onChange(''); setSearch('') }}
          className="shrink-0 text-[10px] font-bold tracking-widest uppercase text-[#AAA] hover:text-[#D41414] underline underline-offset-4 transition-colors"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors pb-1">
        <svg className="w-3.5 h-3.5 text-[#CCC] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setOpenId(myId)}
          onBlur={() => setTimeout(() => setOpenId(null), 150)}
          placeholder="Search product..."
          className="flex-1 py-1.5 bg-transparent text-[#111] placeholder:text-[#CCC] focus:outline-none text-sm"
          autoFocus
        />
      </div>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E2E0] shadow-xl z-20 max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#AAA]">No products found</p>
          ) : filtered.map(p => (
            <button
              key={p.id}
              onMouseDown={() => { onChange(p.id); setSearch(''); setOpenId(null) }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[#F8F8F8] border-b border-[#F4F4F4] last:border-0 transition-colors"
            >
              <div className="w-9 h-9 shrink-0 bg-[#F4F4F4] overflow-hidden flex items-center justify-center">
                <img
                  src={getImageUrl(p.image_path) ?? '/PAG Logo.png'}
                  alt={p.name}
                  className="w-full h-full object-contain p-0.5"
                  onError={e => { e.currentTarget.src = '/PAG Logo.png' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111] truncate">{p.name}</p>
                <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">{p.category}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${
                p.shop_qty > 0 ? 'text-green-700 border-green-300' : 'text-[#B07800] border-[#E2C97A]'
              }`}>
                {p.shop_qty}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReceiveInventory({ auth, onLogout, onBack }) {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [items, setItems] = useState([])
  const [openPickerId, setOpenPickerId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/inventory/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, { id: nextId++, productId: '', serial: '' }])
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateItem(id, field, val) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  const canSubmit = items.length > 0 && items.every(i => i.productId && i.serial.trim())

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setResult(null)

    // Group serials by productId
    const groups = {}
    for (const item of items) {
      if (!groups[item.productId]) groups[item.productId] = []
      groups[item.productId].push(item.serial.trim())
    }

    try {
      let totalSaved = 0

      for (const [productId, serials] of Object.entries(groups)) {
        const res = await apiFetch('/api/inventory/receive', {
          method: 'POST',
          body: JSON.stringify({ product_id: productId, serials }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        totalSaved += data.total
      }

      setResult({ total: totalSaved })
      setItems([])
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#F8F8F8] border-b border-[#E2E2E0] px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/PAG Logo.png" alt="PAG" className="h-8 md:h-10 w-auto" />
          <div className="hidden sm:block w-px h-6 bg-[#E2E2E0]" />
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase hover:text-[#111] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Tools Hub
          </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Warehouse</p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight leading-none">
            Receive Inventory<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        {/* Success */}
        {result && (
          <div className="bg-white border border-[#E2E2E0] p-6 mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-3">Recorded</p>
            <p className="font-bold text-[#111] text-xl">{result.total} serial(s) pending approval</p>
            <p className="text-sm text-[#AAA] mt-2">Admin will verify and confirm stock update.</p>
            <button
              onClick={() => setResult(null)}
              className="mt-5 text-xs font-semibold tracking-widest uppercase text-[#888] hover:text-[#111] underline underline-offset-4"
            >
              Receive More
            </button>
          </div>
        )}

        {!result && (
          <div className="flex flex-col gap-3">
            {loadingProducts ? (
              <div className="py-16 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Item cards */}
                {items.map((item, idx) => (
                  <div key={item.id} className="bg-white border border-[#E2E2E0] p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-[#BBB] uppercase">#{idx + 1}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center text-[#CCC] hover:text-[#D41414] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <ProductCombobox
                      products={products}
                      value={item.productId}
                      onChange={val => updateItem(item.id, 'productId', val)}
                      openId={openPickerId}
                      setOpenId={setOpenPickerId}
                      myId={item.id}
                    />

                    {item.productId && (
                      <div className="flex items-center gap-2 border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors pb-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-[#CCC] shrink-0">S/N</span>
                        <input
                          type="text"
                          value={item.serial}
                          onChange={e => updateItem(item.id, 'serial', e.target.value)}
                          placeholder="Serial number"
                          className="flex-1 py-1.5 bg-transparent text-[#111] font-mono text-sm placeholder:text-[#CCC] focus:outline-none"
                          autoFocus
                        />
                        {item.serial.trim() && (
                          <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add button */}
                <button
                  onClick={addItem}
                  className="w-full border-2 border-dashed border-[#E2E2E0] py-5 flex items-center justify-center gap-2 text-[#BBB] hover:border-[#111] hover:text-[#111] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-semibold tracking-widest uppercase">Add Item</span>
                </button>

                {error && <p className="text-sm text-[#D41414] px-1">{error}</p>}

                {canSubmit && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full bg-[#111] text-white font-semibold tracking-widest uppercase text-xs py-4 hover:bg-[#D41414] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Saving...' : `Submit — ${items.length} unit(s)`}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
