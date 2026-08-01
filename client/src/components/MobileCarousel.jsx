import { useRef, useEffect, useState } from 'react'

export default function MobileCarousel({ items, renderItem, cloneCount = 1 }) {
  const scrollRef = useRef(null)
  const itemCount = items.length
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || itemCount === 0) return

    const children = Array.from(el.children)
    const firstReal = children[cloneCount]
    if (firstReal) el.scrollLeft = firstReal.offsetLeft

    function handleScroll() {
      const kids = Array.from(el.children)
      const trailingStart = kids[cloneCount + itemCount]
      const lastLeadingClone = kids[cloneCount - 1]

      if (trailingStart && el.scrollLeft >= trailingStart.offsetLeft - 4) {
        el.scrollLeft = kids[cloneCount].offsetLeft
      } else if (lastLeadingClone && el.scrollLeft <= lastLeadingClone.offsetLeft + 4) {
        el.scrollLeft = kids[cloneCount + itemCount - 1].offsetLeft
      }

      // figure out which real item is closest to current scroll position
      let closest = cloneCount
      let closestDist = Infinity
      kids.forEach((kid, i) => {
        const dist = Math.abs(kid.offsetLeft - el.scrollLeft)
        if (dist < closestDist) { closestDist = dist; closest = i }
      })
      const realIndex = ((closest - cloneCount) % itemCount + itemCount) % itemCount
      setActiveIndex(realIndex)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [itemCount, cloneCount])

  function goTo(index) {
    const el = scrollRef.current
    if (!el) return
    const kids = Array.from(el.children)
    const target = kids[cloneCount + index]
    if (target) el.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })
  }

  if (itemCount === 0) return null

  const leading  = items.slice(-cloneCount)
  const trailing = items.slice(0, cloneCount)
  const display  = [...leading, ...items, ...trailing]

  return (
  <div className="mobile-carousel-wrapper">
    <div ref={scrollRef} className="mobile-carousel">
      {display.map((item, i) => {
        const isClone = i < cloneCount || i >= cloneCount + itemCount
        return (
          <div className="mobile-carousel-item" data-clone={isClone ? 'true' : 'false'} key={`mc-${i}`}>
            {renderItem(item, i)}
          </div>
        )
      })}
    </div>

    {itemCount > 1 && (
      <div className="mobile-carousel-dots">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`mobile-carousel-dot${i === activeIndex ? ' mobile-carousel-dot--active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    )}
  </div>
)
}