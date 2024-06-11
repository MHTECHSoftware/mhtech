const scrollStop = 500 // Time in ms to wait after scrolling has finished to decide which slide to scroll to
const autoProgress = 8000 // Time in ms each slide should display for before progressing
const smoothScrollDuration = 1000 // Time in ms to wait after autoProgress before resuming scroll listening

const headerHeight = parseFloat(process.env.headerHeight) + 2 * parseInt(process.env.headerPadding)

let slideshowsController: AbortController | null = null
let autoProgressTimeouts: {[key: string]: number} = {}

let anchorClickController: AbortController | null = null

const setupSlideshow = (el: Element) => {
  if (el.childNodes.length < 2) return
  const slideshowId = String(Math.random())
  let scrollTimeout: number | null = null
  let isAutoScrolling = false

  if (!slideshowsController) slideshowsController = new AbortController()

  const toNext = () => {
    const width = el.getBoundingClientRect().width
    const nearest = Math.round(el.scrollLeft / width)
    const count = Math.round(el.scrollWidth / width)
    const next = (nearest + 1) % count
    isAutoScrolling = true
    setTimeout(() => {isAutoScrolling = false}, smoothScrollDuration)
    el.scrollTo({
      top: 0,
      left: next * width,
      behavior: 'smooth',
    })
    autoProgressTimeouts[slideshowId] = setTimeout(toNext, autoProgress)
  }
  autoProgressTimeouts[slideshowId] = setTimeout(toNext, autoProgress)

  el.addEventListener('scroll', () => {
    if (isAutoScrolling) return
    if (scrollTimeout) clearTimeout(scrollTimeout)
    if (autoProgressTimeouts[slideshowId]) clearTimeout(autoProgressTimeouts[slideshowId])
    scrollTimeout = setTimeout(() => {
      const width = el.getBoundingClientRect().width
      const nearest = Math.round(el.scrollLeft / width)
      el.scrollTo({
        top: 0,
        left: nearest * width,
        behavior: 'smooth',
      })
      autoProgressTimeouts[slideshowId] = setTimeout(toNext, autoProgress * 1.5)
    }, scrollStop)
  }, {
    signal: slideshowsController.signal,
  })
}

const setupSlideshows = () => {
  if (slideshowsController) slideshowsController.abort()
  slideshowsController = null
  Object.values(autoProgressTimeouts).forEach(clearTimeout)
  autoProgressTimeouts = {}
  Array.from(document.querySelectorAll('.detail-boxes .slideshow .boxes')).forEach(setupSlideshow)
}

const setupAnchorClicks = () => {
  if (anchorClickController) anchorClickController.abort()
  anchorClickController = new AbortController()
  document.body.addEventListener('click', function (e) {
    if (!(e.target instanceof Element)) return
    const anchor = e.target.closest('a')
    if (!anchor) return
    const beginning = `${document.location.origin}/#`
    if (!anchor.href.startsWith(beginning)) return
    const id = anchor.href.replace(beginning, '')
    const el = document.getElementById(id)
    if (!el) return
    e.stopPropagation()
    e.preventDefault()
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const headerOffset = rem * headerHeight
    const y = el.getBoundingClientRect().y
    document.documentElement.scrollTo({
      top: document.documentElement.scrollTop + y - headerOffset,
      left: 0,
      behavior: 'smooth',
    })
  }, {
    capture: false,
    signal: anchorClickController.signal,
  });
}

const setupAll = () => {
  setupSlideshows()
  setupAnchorClicks()
}

if (document.readyState != 'loading') {
  setupAll();
} else {
  document.addEventListener('DOMContentLoaded', setupAll);
}
document.addEventListener('turbo:load', setupAll)


