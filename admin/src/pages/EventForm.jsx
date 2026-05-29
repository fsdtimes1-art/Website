import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate }      from 'react-router-dom'
import { getAdminEvents, createEvent, updateEvent, deleteCategory } from '../lib/api'

const EMPTY_CAT = { name: '', price: '', total_seats: '' }

function emptyForm() {
  return {
    name:        '',
    description: '',
    image_file:  null,
    image_url:   '',
    date:        '',
    time:        '',
    venue:       '',
    is_active:   true,
    categories:  [{ ...EMPTY_CAT }],
  }
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

function buildCalendar(year, month) {
  const first     = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells     = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= daysInMon; d++) cells.push(d)
  return cells
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

export default function EventForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [form,    setForm]    = useState(emptyForm())
  const [loading, setLoading] = useState(isEdit)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  const [showCal,    setShowCal]    = useState(false)
  const [showTime,   setShowTime]   = useState(false)
  const [calAnchor,  setCalAnchor]  = useState(null)
  const [timeAnchor, setTimeAnchor] = useState(null)
  const [calYear,    setCalYear]    = useState(new Date().getFullYear())
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth())

  const [timeH, setTimeH] = useState('12')
  const [timeM, setTimeM] = useState('00')
  const [timeP, setTimeP] = useState('PM')

  const [dragOver, setDragOver] = useState(false)

  const calRef     = useRef(null)
  const timeRef    = useRef(null)
  const calBtnRef  = useRef(null)
  const timeBtnRef = useRef(null)
  const fileInputRef = useRef(null)

  const today = new Date(); today.setHours(0,0,0,0)
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

  // ── Close popups on outside click ───────────────────────
  useEffect(() => {
    function handler(e) {
      if (
        calRef.current     && !calRef.current.contains(e.target) &&
        calBtnRef.current  && !calBtnRef.current.contains(e.target)
      ) setShowCal(false)
      if (
        timeRef.current    && !timeRef.current.contains(e.target) &&
        timeBtnRef.current && !timeBtnRef.current.contains(e.target)
      ) setShowTime(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Close popups on scroll ───────────────────────────────
  useEffect(() => {
    const close = () => { setShowCal(false); setShowTime(false) }
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [])

  // ── Load existing event ──────────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    getAdminEvents()
      .then(events => {
        const event = events.find(e => e.id === id)
        if (!event) throw new Error('Event not found')
        const dt   = new Date(event.date)
        const date = dt.toISOString().slice(0, 10)
        const time = dt.toTimeString().slice(0, 5)
        setCalYear(dt.getFullYear())
        setCalMonth(dt.getMonth())
        // Sync time picker selects
        let h = dt.getHours()
        const ampm = h >= 12 ? 'PM' : 'AM'
        if (h > 12) h -= 12
        if (h === 0) h = 12
        setTimeH(String(h).padStart(2,'0'))
        setTimeM(String(dt.getMinutes()).padStart(2,'0'))
        setTimeP(ampm)
        setForm({
          name:        event.name        || '',
          description: event.description || '',
          image_file:  null,
          image_url:   event.image_url   || '',
          date, time,
          venue:       event.venue       || '',
          is_active:   event.is_active   ?? true,
          categories:  event.seat_categories?.length
            ? event.seat_categories.map(c => ({
                id:          c.id,
                name:        c.name,
                price:       String(c.price),
                total_seats: String(c.total_seats),
                sold_seats:  c.sold_seats,
              }))
            : [{ ...EMPTY_CAT }],
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // ── Field handlers ───────────────────────────────────────
  function handleField(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleCatField(index, e) {
    const { name, value } = e.target
    setForm(f => ({
      ...f,
      categories: f.categories.map((c, i) => i === index ? { ...c, [name]: value } : c),
    }))
  }

  function addCategory() {
    setForm(f => ({ ...f, categories: [...f.categories, { ...EMPTY_CAT }] }))
  }

  async function removeCategory(index) {
    const cat = form.categories[index]
    if (cat.id) {
      if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return
      try { await deleteCategory(id, cat.id) }
      catch (err) { alert(`Failed to delete category: ${err.message}`); return }
    }
    setForm(f => ({ ...f, categories: f.categories.filter((_, i) => i !== index) }))
  }

  // ── Calendar ─────────────────────────────────────────────
  function openCal(e) {
    const r = e.currentTarget.getBoundingClientRect()
    setCalAnchor({ top: r.bottom + 6, left: r.left })
    setShowTime(false)
    setShowCal(v => !v)
  }

  function selectDay(day) {
    if (!day) return
    const chosen = new Date(calYear, calMonth, day)
    if (chosen < today) return
    setForm(f => ({ ...f, date: toDateStr(calYear, calMonth, day) }))
    setShowCal(false)
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const isPrevDisabled = () => {
    const now = new Date()
    return calYear < now.getFullYear() ||
      (calYear === now.getFullYear() && calMonth <= now.getMonth())
  }

  // ── Time picker ──────────────────────────────────────────
  function openTime(e) {
    const r = e.currentTarget.getBoundingClientRect()
    setTimeAnchor({ top: r.bottom + 6, left: r.left })
    setShowCal(false)
    setShowTime(v => !v)
  }

  function applyTime() {
    let h = parseInt(timeH)
    if (timeP === 'PM' && h !== 12) h += 12
    if (timeP === 'AM' && h === 12) h = 0
    const val = `${String(h).padStart(2,'0')}:${timeM}`
    setForm(f => ({ ...f, time: val }))
    setShowTime(false)
  }

  function displayTime(val) {
    if (!val) return ''
    const [hStr, mStr] = val.split(':')
    let h = parseInt(hStr)
    const ampm = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${mStr} ${ampm}`
  }

  // ── Image upload ─────────────────────────────────────────
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setForm(f => ({ ...f, image_file: file, image_url: e.target.result }))
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    handleImageFile(e.dataTransfer.files[0])
  }

  // ── Validation ───────────────────────────────────────────
  function validate() {
    if (!form.name.trim())  return 'Event name is required.'
    if (!form.date)         return 'Event date is required.'
    if (!form.time)         return 'Event time is required.'
    if (!form.venue.trim()) return 'Venue is required.'
    for (let i = 0; i < form.categories.length; i++) {
      const c = form.categories[i]
      if (!c.name.trim())   return `Category ${i+1}: name is required.`
      if (!c.price || isNaN(Number(c.price)) || Number(c.price) < 0)
                            return `Category ${i+1}: valid price is required.`
      if (!c.total_seats || isNaN(Number(c.total_seats)) || Number(c.total_seats) < 1)
                            return `Category ${i+1}: seat count must be at least 1.`
    }
    return null
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    const validationError = validate()
    if (validationError) return setError(validationError)
    setError(null); setSaving(true)
    const datetime = new Date(`${form.date}T${form.time}:00`).toISOString()
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim() || null,
      image_url:   form.image_url || null,
      date:        datetime,
      venue:       form.venue.trim(),
      is_active:   form.is_active,
      categories:  form.categories.map(c => ({
        ...(c.id ? { id: c.id } : {}),
        name:        c.name.trim(),
        price:       Number(c.price),
        total_seats: Number(c.total_seats),
      })),
    }
    try {
      isEdit ? await updateEvent(id, payload) : await createEvent(payload)
      setSuccess(true)
      setTimeout(() => navigate('/events'), 1200)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cells = buildCalendar(calYear, calMonth)

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'100px 0' }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div style={{ padding:'36px 40px', maxWidth:'880px' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom:'36px' }}>
        <button onClick={() => navigate('/events')} style={{
          background:'none', border:'none', color:'var(--gray-mid)',
          fontSize:'13px', cursor:'pointer', padding:'0', marginBottom:'16px',
          display:'flex', alignItems:'center', gap:'6px',
        }}>
          ← Back to Events
        </button>
        <p style={{
          color:'var(--gray-mid)', fontSize:'11px', fontWeight:'600',
          letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px',
        }}>
          {isEdit ? 'Edit Event' : 'New Event'}
        </p>
        <h1 style={{
          fontFamily:'var(--font-display)', fontSize:'40px',
          letterSpacing:'3px', color:'var(--white)', lineHeight:'1',
        }}>
          {isEdit ? 'EDIT EVENT' : 'CREATE EVENT'}
        </h1>
      </div>

      {success && (
        <div style={{
          background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)',
          borderRadius:'10px', padding:'14px 18px', color:'#4ade80',
          fontSize:'14px', marginBottom:'24px', display:'flex', gap:'10px', alignItems:'center',
        }}>
          ✅ Event {isEdit ? 'updated' : 'created'} successfully. Redirecting...
        </div>
      )}

      {error && (
        <div style={{
          background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:'10px', padding:'14px 18px', color:'#f87171',
          fontSize:'13px', marginBottom:'24px', display:'flex', gap:'10px', alignItems:'center',
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>

        {/* ── BASIC INFO ── */}
        <Section title="BASIC INFO">
          <Field label="Event Name *">
            <input className="input" name="name"
              placeholder="e.g. Karachi Jazz Night 2025"
              value={form.name} onChange={handleField} />
          </Field>

          <Field label="Description">
            <textarea className="input" name="description"
              placeholder="Tell attendees what to expect..."
              value={form.description} onChange={handleField}
              rows={4} style={{ resize:'vertical', minHeight:'90px' }} />
          </Field>

          <Field label="Event Image">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !form.image_url && fileInputRef.current?.click()}
              style={{
                border:`2px dashed ${dragOver ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius:'10px',
                background: dragOver ? 'rgba(245,158,11,0.05)' : 'var(--black-3)',
                transition:'all 0.2s',
                cursor: form.image_url ? 'default' : 'pointer',
                overflow:'hidden', minHeight:'140px',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >
              {form.image_url ? (
                <div style={{ position:'relative', width:'100%' }}>
                  <img src={form.image_url} alt="preview"
                    style={{ width:'100%', height:'200px', objectFit:'cover', display:'block' }}
                    onError={e => e.currentTarget.style.display = 'none'}
                  />
                  <div style={{ position:'absolute', top:'10px', right:'10px', display:'flex', gap:'8px' }}>
                    <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }} style={{
                      background:'rgba(0,0,0,0.75)', border:'1px solid rgba(255,255,255,0.2)',
                      color:'var(--white)', fontSize:'12px', padding:'6px 14px',
                      borderRadius:'6px', cursor:'pointer', backdropFilter:'blur(6px)',
                    }}>Change</button>
                    <button onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image_file:null, image_url:'' })) }} style={{
                      background:'rgba(239,68,68,0.8)', border:'none',
                      color:'#fff', fontSize:'12px', padding:'6px 14px',
                      borderRadius:'6px', cursor:'pointer',
                    }}>Remove</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'32px 20px' }}>
                  <div style={{ fontSize:'32px', marginBottom:'10px', opacity:0.4 }}>🖼️</div>
                  <p style={{ color:'var(--gray-light)', fontSize:'14px', marginBottom:'4px' }}>
                    Drag & drop an image here, or{' '}
                    <span style={{ color:'var(--gold)', textDecoration:'underline', cursor:'pointer' }}
                      onClick={() => fileInputRef.current?.click()}>browse</span>
                  </p>
                  <p style={{ color:'var(--gray-mid)', fontSize:'12px' }}>
                    PNG, JPG, WEBP — recommended 1200×600px
                  </p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*"
              style={{ display:'none' }}
              onChange={e => handleImageFile(e.target.files[0])} />
          </Field>
        </Section>

        {/* ── DATE & VENUE ── */}
        <Section title="DATE & VENUE">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

            <Field label="Date *">
              <button ref={calBtnRef} type="button" onClick={openCal} style={{
                width:'100%', textAlign:'left', background:'var(--black-3)',
                border:`1px solid ${showCal ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:'8px', padding:'11px 14px',
                color: form.date ? 'var(--white)' : 'var(--gray-mid)',
                fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'space-between', transition:'border-color 0.15s',
              }}>
                <span>{form.date
                  ? new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
                  : 'Select date'
                }</span>
                <span style={{ opacity:0.5, fontSize:'16px' }}>📅</span>
              </button>
            </Field>

            <Field label="Time *">
              <button ref={timeBtnRef} type="button" onClick={openTime} style={{
                width:'100%', textAlign:'left', background:'var(--black-3)',
                border:`1px solid ${showTime ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius:'8px', padding:'11px 14px',
                color: form.time ? 'var(--white)' : 'var(--gray-mid)',
                fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center',
                justifyContent:'space-between', transition:'border-color 0.15s',
              }}>
                <span>{form.time ? displayTime(form.time) : 'Select time'}</span>
                <span style={{ opacity:0.5, fontSize:'16px' }}>🕐</span>
              </button>
            </Field>

          </div>

          <Field label="Venue *">
            <input className="input" name="venue"
              placeholder="e.g. Marriott Hotel, Karachi"
              value={form.venue} onChange={handleField} />
          </Field>
        </Section>

        {/* ── SEAT CATEGORIES ── */}
        <Section title="SEAT CATEGORIES">
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {form.categories.map((cat, i) => (
              <CategoryRow key={i} cat={cat} index={i}
                total={form.categories.length}
                onChange={handleCatField}
                onRemove={removeCategory} />
            ))}
          </div>
          <button onClick={addCategory} style={{
            marginTop:'10px', display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(245,158,11,0.05)', border:'1px dashed rgba(245,158,11,0.25)',
            borderRadius:'8px', color:'var(--gold)', fontSize:'13px', fontWeight:'600',
            padding:'12px 20px', cursor:'pointer', width:'100%', justifyContent:'center',
            transition:'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
          >
            + Add Category
          </button>
        </Section>

        {/* ── VISIBILITY ── */}
        <Section title="VISIBILITY">
          <label style={{ display:'flex', alignItems:'center', gap:'14px', cursor:'pointer', userSelect:'none' }}>
            <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} style={{
              width:'48px', height:'26px', borderRadius:'13px',
              background: form.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
              border: form.is_active ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.12)',
              position:'relative', transition:'all 0.2s', flexShrink:0, cursor:'pointer',
            }}>
              <div style={{
                position:'absolute', top:'3px', left: form.is_active ? '24px' : '3px',
                width:'18px', height:'18px', borderRadius:'50%',
                background: form.is_active ? '#4ade80' : 'var(--gray-dark)',
                transition:'left 0.2s, background 0.2s',
              }} />
            </div>
            <div>
              <p style={{ color:'var(--white)', fontSize:'14px', fontWeight:'500' }}>
                {form.is_active ? 'Publicly visible' : 'Hidden from public'}
              </p>
              <p style={{ color:'var(--gray-mid)', fontSize:'12px', marginTop:'2px' }}>
                {form.is_active
                  ? 'This event will appear on the client site'
                  : 'Only admins can see this event'}
              </p>
            </div>
          </label>
        </Section>

        {/* ── Submit ── */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px', paddingTop:'8px' }}>
          <button onClick={() => navigate('/events')} className="btn-ghost" style={{ fontSize:'14px' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-gold"
            style={{
              fontSize:'14px', padding:'12px 32px',
              opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? (
              <>
                <div style={{
                  width:'14px', height:'14px',
                  border:'2px solid rgba(0,0,0,0.3)', borderTop:'2px solid #000',
                  borderRadius:'50%', animation:'spin 0.7s linear infinite',
                }} />
                Saving...
              </>
            ) : (
              isEdit ? 'Save Changes →' : 'Create Event →'
            )}
          </button>
        </div>

      </div>

      {/* ── CALENDAR POPUP (fixed, outside all overflow containers) ── */}
      {showCal && calAnchor && (
        <div ref={calRef} style={{
          position:'fixed', top: calAnchor.top, left: calAnchor.left,
          zIndex:9999, background:'var(--black-2)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'12px', padding:'16px', width:'280px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Month nav */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <button onClick={prevMonth} disabled={isPrevDisabled()} style={{
              background:'none', border:'none',
              color: isPrevDisabled() ? 'rgba(255,255,255,0.15)' : 'var(--white)',
              fontSize:'20px', cursor: isPrevDisabled() ? 'not-allowed' : 'pointer', padding:'0 6px',
            }}>‹</button>
            <span style={{ color:'var(--white)', fontSize:'14px', fontWeight:'600' }}>
              {MONTHS[calMonth]} {calYear}
            </span>
            <button onClick={nextMonth} style={{
              background:'none', border:'none', color:'var(--white)',
              fontSize:'20px', cursor:'pointer', padding:'0 6px',
            }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', marginBottom:'6px' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign:'center', color:'var(--gray-mid)',
                fontSize:'10px', fontWeight:'700', letterSpacing:'0.5px', padding:'4px 0',
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const dateStr = toDateStr(calYear, calMonth, day)
              const isPast  = new Date(calYear, calMonth, day) < today
              const isSel   = dateStr === form.date
              const isToday = dateStr === todayStr
              return (
                <button key={i} onClick={() => selectDay(day)} disabled={isPast} style={{
                  background:   isSel ? 'var(--gold)' : isToday ? 'rgba(245,158,11,0.15)' : 'transparent',
                  border:       isToday && !isSel ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                  borderRadius: '6px',
                  color:        isPast ? 'rgba(255,255,255,0.15)' : isSel ? '#000' : 'var(--white)',
                  fontSize:     '13px', padding:'6px 0',
                  cursor:       isPast ? 'not-allowed' : 'pointer',
                  fontWeight:   isSel ? '700' : '400',
                  transition:   'background 0.1s',
                }}>{day}</button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:'12px', paddingTop:'10px' }}>
            <button onClick={() => {
              const t = new Date(); t.setHours(0,0,0,0)
              setCalYear(t.getFullYear()); setCalMonth(t.getMonth())
              selectDay(t.getDate())
            }} style={{
              background:'none', border:'none', color:'var(--gold)',
              fontSize:'12px', cursor:'pointer', width:'100%', textAlign:'center',
            }}>
              Today
            </button>
          </div>
        </div>
      )}

      {/* ── TIME POPUP (fixed, outside all overflow containers) ── */}
      {showTime && timeAnchor && (
        <div ref={timeRef} style={{
          position:'fixed', top: timeAnchor.top, left: timeAnchor.left,
          zIndex:9999, background:'var(--black-2)',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:'12px', padding:'20px', width:'220px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
        }}>
          <p style={{
            color:'var(--gray-mid)', fontSize:'10px', fontWeight:'700',
            letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'14px',
          }}>SELECT TIME</p>

          <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'16px' }}>
            {/* Hours */}
            <div style={{ flex:1 }}>
              <p style={{ color:'var(--gray-mid)', fontSize:'10px', textAlign:'center', marginBottom:'6px' }}>HR</p>
              <select value={timeH} onChange={e => setTimeH(e.target.value)} style={{
                width:'100%', background:'var(--black-3)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px',
                color:'var(--white)', fontSize:'20px', fontWeight:'600',
                padding:'8px 4px', textAlign:'center', cursor:'pointer', appearance:'none',
              }}>
                {Array.from({length:12},(_,i) => String(i+1).padStart(2,'0')).map(h =>
                  <option key={h} value={h}>{h}</option>
                )}
              </select>
            </div>

            <span style={{ color:'var(--gold)', fontSize:'24px', fontWeight:'700', paddingTop:'18px' }}>:</span>

            {/* Minutes */}
            <div style={{ flex:1 }}>
              <p style={{ color:'var(--gray-mid)', fontSize:'10px', textAlign:'center', marginBottom:'6px' }}>MIN</p>
              <select value={timeM} onChange={e => setTimeM(e.target.value)} style={{
                width:'100%', background:'var(--black-3)',
                border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px',
                color:'var(--white)', fontSize:'20px', fontWeight:'600',
                padding:'8px 4px', textAlign:'center', cursor:'pointer', appearance:'none',
              }}>
                {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m =>
                  <option key={m} value={m}>{m}</option>
                )}
              </select>
            </div>

            {/* AM/PM */}
            <div style={{ display:'flex', flexDirection:'column', gap:'4px', paddingTop:'18px' }}>
              {['AM','PM'].map(p => (
                <button key={p} onClick={() => setTimeP(p)} style={{
                  background:   timeP === p ? 'var(--gold)' : 'var(--black-3)',
                  border:       '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px', color: timeP === p ? '#000' : 'var(--gray-mid)',
                  fontSize:'11px', fontWeight:'700', padding:'6px 8px', cursor:'pointer',
                  transition:'all 0.15s',
                }}>{p}</button>
              ))}
            </div>
          </div>

          <button onClick={applyTime} style={{
            width:'100%', background:'var(--gold)', border:'none',
            borderRadius:'8px', color:'#000', fontSize:'13px',
            fontWeight:'700', padding:'10px', cursor:'pointer', transition:'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Confirm
          </button>
        </div>
      )}

    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{
      background:'var(--black-2)', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:'12px', overflow:'visible',
    }}>
      <div style={{
        padding:'13px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)',
        background:'var(--black-3)', borderRadius:'12px 12px 0 0',
      }}>
        <p style={{
          fontFamily:'var(--font-display)', fontSize:'11px',
          letterSpacing:'2.5px', color:'var(--gold)',
        }}>{title}</p>
      </div>
      <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'18px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Field wrapper ────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display:'block', color:'var(--gray-light)', fontSize:'11px',
        fontWeight:'600', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Category row ─────────────────────────────────────────────
function CategoryRow({ cat, index, total, onChange, onRemove }) {
  const hasSales = cat.sold_seats > 0
  return (
    <div style={{
      background:'var(--black-3)', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:'10px', padding:'16px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <p style={{
          color:'var(--gray-mid)', fontSize:'11px', fontWeight:'600',
          letterSpacing:'1px', textTransform:'uppercase',
        }}>
          Category {index + 1}
          {hasSales && (
            <span style={{
              marginLeft:'8px', background:'rgba(245,158,11,0.1)', color:'var(--gold)',
              padding:'1px 8px', borderRadius:'10px', fontSize:'10px',
            }}>
              {cat.sold_seats} sold
            </span>
          )}
        </p>
        {total > 1 && (
          <button onClick={() => onRemove(index)} style={{
            background:'transparent', border:'1px solid rgba(239,68,68,0.2)',
            color:'#f87171', fontSize:'11px', padding:'4px 10px',
            borderRadius:'4px', cursor:'pointer', transition:'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Remove
          </button>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'12px' }}>
        <div>
          <label style={catLabelStyle}>Category Name *</label>
          <input className="input" name="name"
            placeholder="e.g. VIP, General, Premium"
            value={cat.name} onChange={e => onChange(index, e)} />
        </div>
        <div>
          <label style={catLabelStyle}>Price (PKR) *</label>
          <input className="input" name="price" type="number"
            placeholder="5000" value={cat.price}
            onChange={e => onChange(index, e)} min="0" />
        </div>
        <div>
          <label style={catLabelStyle}>Total Seats *</label>
          <input className="input" name="total_seats" type="number"
            placeholder="100" value={cat.total_seats}
            onChange={e => onChange(index, e)} min="1"
            disabled={hasSales}
            title={hasSales ? 'Cannot reduce seats after sales have been made' : ''}
            style={{ opacity: hasSales ? 0.6 : 1 }} />
        </div>
      </div>
    </div>
  )
}

const catLabelStyle = {
  display:'block', color:'var(--gray-mid)', fontSize:'10px',
  fontWeight:'600', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'6px',
}
