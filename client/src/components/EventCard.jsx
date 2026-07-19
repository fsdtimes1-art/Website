import { Link } from 'react-router-dom'

export default function EventCard({ event }) {
  const {
    id,
    name,
    description,
    image_url,
    date,
    venue,
    seat_categories = []
  } = event

  const eventDate  = new Date(date)
  const isPast     = eventDate < new Date()
  const lowestPrice = seat_categories.length
    ? Math.min(...seat_categories.map(c => Number(c.price)))
    : null

  const totalSeats = seat_categories.reduce((s, c) => s + c.total_seats, 0)
  const soldSeats  = seat_categories.reduce((s, c) => s + c.sold_seats,  0)
  const remaining  = totalSeats - soldSeats
  const soldOut    = remaining <= 0
  const almostGone = !soldOut && remaining <= 20

  const formattedDate = eventDate.toLocaleDateString('en-PK', {
    weekday: 'short',
    month:   'long',
    day:     'numeric',
    year:    'numeric',
  })

  const formattedTime = eventDate.toLocaleTimeString('en-PK', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="card-dark" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Image */}
      <div style={{
        position:   'relative',
        height:     '220px',
        overflow:   'hidden',
        flexShrink: 0,
      }}>
        {image_url ? (
          <img
            src={image_url}
            alt={name}
            style={{
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              transition: 'transform 0.4s ease',
              filter:     isPast || soldOut ? 'grayscale(60%) brightness(0.6)' : 'brightness(0.85)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width:      '100%',
            height:     '100%',
            background: 'linear-gradient(135deg, var(--black-3), var(--black-2))',
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize:   '48px',
          }}>
            🎟️
          </div>
        )}

        {/* Status badge */}
        {soldOut && (
          <div style={{
            position:   'absolute',
            top:        '12px',
            right:      '12px',
            background: 'rgba(239,68,68,0.9)',
            color:      '#fff',
            fontSize:   '11px',
            fontWeight: '700',
            letterSpacing: '1px',
            padding:    '4px 10px',
            borderRadius: '20px',
          }}>
            SOLD OUT
          </div>
        )}

        {almostGone && (
          <div style={{
            position:   'absolute',
            top:        '12px',
            right:      '12px',
            background: 'rgba(245,158,11,0.9)',
            color:      '#000',
            fontSize:   '11px',
            fontWeight: '700',
            letterSpacing: '1px',
            padding:    '4px 10px',
            borderRadius: '20px',
          }}>
            ALMOST GONE
          </div>
        )}

        {/* Date chip */}
        <div style={{
          position:   'absolute',
          bottom:     '12px',
          left:       '12px',
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(8px)',
          border:     '1px solid rgba(245,158,11,0.25)',
          borderRadius: '6px',
          padding:    '6px 12px',
        }}>
          <p style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '13px',
            letterSpacing: '1px',
            color:         'var(--gold)',
          }}>
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding:       '20px',
        display:       'flex',
        flexDirection: 'column',
        flex:          1,
        gap:           '12px',
      }}>

        {/* Name */}
        <h3 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      '22px',
          letterSpacing: '1px',
          color:         'var(--white)',
          lineHeight:    '1.2',
        }}>
          {name}
        </h3>

        {/* Venue + time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ color: 'var(--gray-mid)', fontSize: '13px', display: 'flex', gap: '6px' }}>
            <span>📍</span><span>{venue}</span>
          </p>
          <p style={{ color: 'var(--gray-mid)', fontSize: '13px', display: 'flex', gap: '6px' }}>
            <span>🕐</span><span>{formattedTime}</span>
          </p>
        </div>

        {/* Description */}
        {description && (
          <p style={{
            color:     'var(--gray-light)',
            fontSize:  '13px',
            lineHeight:'1.5',
            display:   '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:  'hidden',
          }}>
            {description}
          </p>
        )}

        {/* Categories preview */}
        {seat_categories.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {seat_categories.map(cat => (
              <span key={cat.id} style={{
                background:  'rgba(245,158,11,0.08)',
                border:      '1px solid rgba(245,158,11,0.2)',
                color:       'var(--gold)',
                fontSize:    '11px',
                fontWeight:  '600',
                padding:     '3px 10px',
                borderRadius:'20px',
              }}>
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer row: price + CTA */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          paddingTop:     '12px',
          borderTop:      '1px solid rgba(255,255,255,0.06)',
          marginTop:      'auto',
        }}>
          <div>
            {lowestPrice !== null && (
              <>
                <p style={{ color: 'var(--gray-mid)', fontSize: '11px' }}>From</p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize:   '20px',
                  color:      'var(--gold)',
                  letterSpacing: '1px',
                }}>
                  PKR {lowestPrice.toLocaleString()}
                </p>
              </>
            )}
          </div>

          {soldOut ? (
            <span style={{
              color:       'var(--gray-mid)',
              fontSize:    '13px',
              fontWeight:  '500',
            }}>
              Sold Out
            </span>
          ) : (
<Link
            to={`/events/${id}/whatsapp`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              background: '#25D366',
              color: '#000',
              fontWeight: 'bold',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            💬 Get Tickets
          </Link>
          )}
        </div>

      </div>
    </div>
  )
}