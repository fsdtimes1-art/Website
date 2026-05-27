import { useState } from 'react'

export default function SeatSelector({ categories, onSelectionChange }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [quantity,           setQuantity]           = useState(1)

  const selected  = categories.find(c => c.id === selectedCategoryId)
  const available = selected ? selected.total_seats - selected.sold_seats : 0
  const maxQty    = Math.min(available, 10)

  function handleCategorySelect(cat) {
    setSelectedCategoryId(cat.id)
    setQuantity(1)
    onSelectionChange({ category: cat, quantity: 1 })
  }

  function handleQuantityChange(newQty) {
    if (newQty < 1 || newQty > maxQty) return
    setQuantity(newQty)
    onSelectionChange({ category: selected, quantity: newQty })
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* Category cards */}
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        {categories.map(cat => {
          const catAvailable  = cat.total_seats - cat.sold_seats
          const catSoldOut    = catAvailable <= 0
          const catAlmostGone = !catSoldOut && catAvailable <= 10
          const isSelected    = selectedCategoryId === cat.id
          const soldPct       = Math.round((cat.sold_seats / cat.total_seats) * 100)

          return (
            <button
              key={cat.id}
              onClick={() => !catSoldOut && handleCategorySelect(cat)}
              disabled={catSoldOut}
              style={{
                background:   isSelected
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))'
                  : 'var(--black-3)',
                border:       `1.5px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '12px',
                padding:      '18px 20px',
                cursor:       catSoldOut ? 'not-allowed' : 'pointer',
                opacity:      catSoldOut ? 0.45 : 1,
                transition:   'all 0.2s',
                textAlign:    'left',
                width:        '100%',
                position:     'relative',
                overflow:     'hidden',
              }}
              onMouseEnter={e => {
                if (!catSoldOut && !isSelected)
                  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'
              }}
              onMouseLeave={e => {
                if (!isSelected)
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              }}
            >
              {/* Selected glow */}
              {isSelected && (
                <div style={{
                  position:'absolute', top:0, right:0,
                  width:'60px', height:'60px',
                  background:'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
                  pointerEvents:'none',
                }} />
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                {/* Left */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  {/* Radio */}
                  <div style={{
                    width:'20px', height:'20px', borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'border-color 0.2s',
                  }}>
                    {isSelected && (
                      <div style={{
                        width:'9px', height:'9px', borderRadius:'50%',
                        background:'var(--gold)',
                      }} />
                    )}
                  </div>

                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <span style={{
                        fontFamily:'var(--font-display)', fontSize:'17px', letterSpacing:'1px',
                        color: isSelected ? 'var(--gold)' : 'var(--white)',
                        transition:'color 0.2s',
                      }}>
                        {cat.name}
                      </span>

                      {catSoldOut && (
                        <span style={{
                          background:'rgba(239,68,68,0.12)', color:'#f87171',
                          fontSize:'9px', fontWeight:'700', letterSpacing:'1.2px',
                          padding:'2px 8px', borderRadius:'20px',
                        }}>SOLD OUT</span>
                      )}
                      {catAlmostGone && (
                        <span style={{
                          background:'rgba(245,158,11,0.12)', color:'var(--gold)',
                          fontSize:'9px', fontWeight:'700', letterSpacing:'1.2px',
                          padding:'2px 8px', borderRadius:'20px',
                        }}>ALMOST GONE</span>
                      )}
                    </div>

                    {!catSoldOut && (
                      <p style={{ color:'var(--gray-mid)', fontSize:'12px', marginTop:'3px' }}>
                        {catAvailable} of {cat.total_seats} remaining
                      </p>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{
                    fontFamily:'var(--font-display)', fontSize:'20px', letterSpacing:'1px',
                    color: isSelected ? 'var(--gold)' : 'var(--white)',
                    lineHeight:'1', transition:'color 0.2s',
                  }}>
                    PKR {Number(cat.price).toLocaleString()}
                  </p>
                  <p style={{ color:'var(--gray-mid)', fontSize:'11px', marginTop:'3px' }}>per ticket</p>
                </div>
              </div>

              {/* Availability bar */}
              <div style={{
                height:'3px', background:'rgba(255,255,255,0.06)',
                borderRadius:'2px', overflow:'hidden', marginLeft:'32px',
              }}>
                <div style={{
                  height:'100%', borderRadius:'2px',
                  width:`${soldPct}%`,
                  background: soldPct > 85 ? '#ef4444' : soldPct > 60 ? 'var(--gold)' : '#22c55e',
                  transition:'width 0.5s ease',
                }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Quantity picker */}
      {selected && available > 0 && (
        <div style={{
          background:'var(--black-3)', border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'12px', padding:'20px 22px',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div>
              <p style={{
                fontFamily:'var(--font-display)', fontSize:'14px',
                letterSpacing:'2px', color:'var(--white)',
              }}>
                TICKETS
              </p>
              {maxQty < 10 && (
                <p style={{ color:'var(--gold)', fontSize:'11px', marginTop:'3px' }}>
                  Max {maxQty} per order
                </p>
              )}
            </div>

            {/* Stepper */}
            <div style={{ display:'flex', alignItems:'center', gap:'0' }}>
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                style={{
                  width:'42px', height:'42px',
                  background: quantity <= 1 ? 'rgba(255,255,255,0.03)' : 'var(--black-2)',
                  border:'1px solid rgba(255,255,255,0.1)', borderRight:'none',
                  borderRadius:'8px 0 0 8px',
                  color: quantity <= 1 ? 'rgba(255,255,255,0.15)' : 'var(--white)',
                  fontSize:'18px', cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s',
                }}
              >−</button>

              <div style={{
                width:'56px', height:'42px',
                background:'var(--black-2)',
                border:'1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-display)', fontSize:'20px',
                color:'var(--gold)', letterSpacing:'1px',
              }}>
                {quantity}
              </div>

              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQty}
                style={{
                  width:'42px', height:'42px',
                  background: quantity >= maxQty ? 'rgba(255,255,255,0.03)' : 'var(--black-2)',
                  border:'1px solid rgba(255,255,255,0.1)', borderLeft:'none',
                  borderRadius:'0 8px 8px 0',
                  color: quantity >= maxQty ? 'rgba(255,255,255,0.15)' : 'var(--white)',
                  fontSize:'18px', cursor: quantity >= maxQty ? 'not-allowed' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s',
                }}
              >+</button>
            </div>
          </div>

          {/* Mini subtotal */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
              {quantity} × PKR {Number(selected.price).toLocaleString()}
            </span>
            <span style={{
              fontFamily:'var(--font-display)', fontSize:'20px',
              color:'var(--gold)', letterSpacing:'1px',
            }}>
              PKR {(Number(selected.price) * quantity).toLocaleString()}
            </span>
          </div>
        </div>
      )}

    </div>
  )
}