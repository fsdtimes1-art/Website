import { useRef, useEffect } from 'react'

export default function MobileCarousel({ items, renderItem, cloneCount = 1 }) {
  const scrollRef = useRef(null)
  const itemCount = items.length

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
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [itemCount, cloneCount])

  if (itemCount === 0) return null

  const leading  = items.slice(-cloneCount)
  const trailing = items.slice(0, cloneCount)
  const display  = [...leading, ...items, ...trailing]

  return (
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
  )
}