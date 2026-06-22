import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/apiFetch.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPrice(n) {
  return Number(n).toLocaleString('th-TH')
}

function SerialChip({ serial, selected, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-xs px-3 py-1.5 border transition-colors ${
        selected
          ? 'bg-[#111] text-white border-[#111]'
          : disabled
            ? 'text-[#CCC] border-[#E2E2E0] cursor-not-allowed'
            : 'text-[#111] border-[#E2E2E0] hover:border-[#111] cursor-pointer'
      }`}
    >
      {serial.serial_number}
      {selected && <span className="ml-1.5 opacity-60">✓</span>}
    </button>
  )
}

function OrderCard({ order, expanded, serials, assignments, onToggle, onToggleSerial, canShip, shipping, error, onShip }) {
  const dealer = order.users

  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 hover:bg-[#FAFAFA] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-bold text-[#111]">{order.invoice_number}</span>
            <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 bg-[#FFF8E6] text-[#B07800] border border-[#E2C97A]">
              {order.status}
            </span>
          </div>
          <p className="text-xs text-[#888] truncate">
            {dealer?.company_name || dealer?.name} · {formatDate(order.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-[#AAA]">{order.order_items?.length} item(s)</p>
          <p className="text-sm font-semibold text-[#111]">฿{formatPrice(order.total_amount)}</p>
        </div>
        <svg
          className={`w-4 h-4 text-[#CCC] shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-[#F0F0F0] px-5 pb-5 pt-4 flex flex-col gap-5">
          {order.order_items?.map((item, idx) => {
            const assigned = assignments[item.id] || []
            const available = serials[item.product_id] || []
            const needed = item.quantity
            const filled = assigned.length
            const isComplete = filled === needed

            return (
              <div key={item.id}>
                {/* Item header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111]">{item.product_name}</p>
                    <p className="text-xs text-[#AAA] mt-0.5">
                      Qty: {item.quantity} · ฿{formatPrice(item.dealer_price)} each
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border shrink-0 ${
                    isComplete
                      ? 'text-green-700 border-green-300 bg-green-50'
                      : 'text-[#B07800] border-[#E2C97A]'
                  }`}>
                    {filled}/{needed} S/N
                  </span>
                </div>

                {/* Serial chips */}
                {available.length === 0 ? (
                  <p className="text-xs text-[#D41414]">ไม่มี serial ที่ approved สำหรับสินค้านี้</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {available.map(s => {
                      const isSelected = assigned.includes(s.id)
                      const isDisabled = !isSelected && filled >= needed
                      return (
                        <SerialChip
                          key={s.id}
                          serial={s}
                          selected={isSelected}
                          disabled={isDisabled}
                          onClick={() => onToggleSerial(item.id, s.id, needed)}
                        />
                      )
                    })}
                  </div>
                )}

                {idx < order.order_items.length - 1 && (
                  <div className="mt-5 border-b border-[#F0F0F0]" />
                )}
              </div>
            )
          })}

          {error && <p className="text-sm text-[#D41414]">{error}</p>}

          <button
            onClick={onShip}
            disabled={!canShip || shipping}
            className="w-full bg-[#111] text-white font-semibold tracking-widest uppercase text-xs py-4 hover:bg-[#D41414] disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-1"
          >
            {shipping ? 'กำลังส่ง...' : 'Mark as Shipped'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ShipOrders({ auth, onLogout, onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [serials, setSerials] = useState({})       // { product_id: [{id, serial_number}] }
  const [assignments, setAssignments] = useState({}) // { order_item_id: [serial_id] }
  const [shipping, setShipping] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/shipping/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  async function toggleExpand(order) {
    if (expandedId === order.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(order.id)
    setAssignments({})
    setError('')

    const productIds = [...new Set(order.order_items.map(i => i.product_id))]
    const results = await Promise.all(
      productIds.map(pid =>
        apiFetch(`/api/shipping/serials/${pid}`)
          .then(r => r.json())
          .then(data => ({ pid, data: Array.isArray(data) ? data : [] }))
          .catch(() => ({ pid, data: [] }))
      )
    )
    const map = {}
    for (const { pid, data } of results) map[pid] = data
    setSerials(map)
  }

  function toggleSerial(itemId, serialId, maxQty) {
    setAssignments(prev => {
      const current = prev[itemId] || []
      if (current.includes(serialId)) {
        return { ...prev, [itemId]: current.filter(s => s !== serialId) }
      }
      if (current.length >= maxQty) return prev
      // Prevent assigning same serial to multiple items
      const usedElsewhere = Object.entries(prev).some(([iid, sids]) => iid !== itemId && sids.includes(serialId))
      if (usedElsewhere) return prev
      return { ...prev, [itemId]: [...current, serialId] }
    })
  }

  const expandedOrder = orders.find(o => o.id === expandedId)

  const canShip = !!(expandedOrder?.order_items.every(item => {
    const assigned = assignments[item.id] || []
    return assigned.length === item.quantity
  }))

  async function handleShip() {
    if (!canShip || shipping || !expandedOrder) return
    setShipping(true)
    setError('')

    try {
      const res = await apiFetch('/api/shipping/ship', {
        method: 'POST',
        body: JSON.stringify({
          order_id: expandedId,
          assignments: expandedOrder.order_items.map(item => ({
            order_item_id: item.id,
            serial_ids: assignments[item.id] || [],
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(expandedOrder.invoice_number)
      setExpandedId(null)
      setAssignments({})
      setOrders(prev => prev.filter(o => o.id !== expandedId))
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด')
    }
    setShipping(false)
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Fulfillment</p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight leading-none">
            Ship Orders<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        {/* Success banner */}
        {success && (
          <div className="bg-white border border-[#E2E2E0] p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-green-700 mb-1">Shipped</p>
              <p className="text-sm font-semibold text-[#111]">{success} ส่งออกเรียบร้อย</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="w-8 h-8 flex items-center justify-center text-[#CCC] hover:text-[#111] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-[#E2E2E0]">
            <svg className="w-8 h-8 text-[#DDD] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <p className="text-sm text-[#AAA]">ไม่มี order ที่รอจัดส่ง</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-[#E2E2E0]">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                serials={serials}
                assignments={assignments}
                onToggle={() => toggleExpand(order)}
                onToggleSerial={toggleSerial}
                canShip={canShip && expandedId === order.id}
                shipping={shipping}
                error={expandedId === order.id ? error : ''}
                onShip={handleShip}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
