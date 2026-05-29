export default function StatCard({
  label,
  value,
  icon,
  sub,
  highlight = false,
  trend,       // 'up' | 'down' | null
  trendValue,  // e.g. '+12%'
}) {
  return (
    <div style={{
      background:   'var(--black-2)',
      border:       highlight
                      ? '1px solid rgba(245,158,11,0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding:      '24px',
      display:      'flex',
      flexDirection:'column',
      gap:          '12px',
      position:     'relative',
      overflow:     'hidden',
      transition:   'border-color 0.2s',
    }}>

      {/* Gold glow on highlight */}
      {highlight && (
        <div style={{
          position:   'absolute',
          top:        0,
          left:       0,
          right:      0,
          height:     '2px',
          background: 'linear-gradient(to right, transparent, var(--gold), transparent)',
        }} />
      )}

      {/* Watermark icon */}
      <div style={{
        position:   'absolute',
        bottom:     '-8px',
        right:      '16px',
        fontSize:   '64px',
        opacity:    0.04,
        userSelect: 'none',
        lineHeight: '1',
      }}>
        {icon}
      </div>

      {/* Top row: label + icon */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
      }}>
        <p style={{
          color:         'var(--gray-mid)',
          fontSize:      '11px',
          fontWeight:    '600',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>
          {label}
        </p>
        <div style={{
          width:        '36px',
          height:       '36px',
          borderRadius: '8px',
          background:   highlight
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(255,255,255,0.05)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '18px',
          flexShrink:   0,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <p style={{
        fontFamily:    'var(--font-display)',
        fontSize:      '38px',
        letterSpacing: '2px',
        color:         highlight ? 'var(--gold)' : 'var(--white)',
        lineHeight:    '1',
      }}>
        {value}
      </p>

      {/* Bottom row: sub + trend */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        flexWrap:    'wrap',
      }}>
        {sub && (
          <p style={{
            color:    'var(--gray-mid)',
            fontSize: '12px',
            flex:     1,
          }}>
            {sub}
          </p>
        )}

        {trend && trendValue && (
          <span style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '3px',
            background:   trend === 'up'
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(239,68,68,0.12)',
            color:        trend === 'up' ? '#4ade80' : '#f87171',
            fontSize:     '11px',
            fontWeight:   '700',
            padding:      '3px 8px',
            borderRadius: '20px',
            flexShrink:   0,
          }}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>

    </div>
  )
}