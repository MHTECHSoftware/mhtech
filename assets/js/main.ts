const scrollStop = 500 // Time in ms to wait after scrolling has finished to decide which slide to scroll to
const autoProgress = 8000 // Time in ms each slide should display for before progressing
const smoothScrollDuration = 1000 // Time in ms to wait after autoProgress before resuming scroll listening

let slideshowsController: AbortController | null = null
let autoProgressTimeouts: {[key: string]: number} = {}

const setupSlideshow = (el: Element) => {
  const slideshowId = String(Math.random())
  let scrollTimeout: number | null = null
  let isAutoScrolling = false
  let isPaused = false

  if (!slideshowsController) slideshowsController = new AbortController()

  el.addEventListener('scroll', () => {
    if (isAutoScrolling) return
    isPaused = true
    if (scrollTimeout) clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => {
      const width = el.getBoundingClientRect().width
      const nearest = Math.round(el.scrollLeft / width)
      el.scrollTo({
        top: 0,
        left: nearest * width,
        behavior: 'smooth',
      })
    }, scrollStop)
  }, {
    signal: slideshowsController.signal,
  })
  const toNext = () => {
    if (isPaused) return
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
}

const setupSlideshows = () => {
  if (slideshowsController) slideshowsController.abort()
  slideshowsController = null
  Array.from(document.querySelectorAll('.detail-boxes .slideshow .boxes')).forEach(setupSlideshow)
}

const setupAll = () => {
  Object.values(autoProgressTimeouts).forEach(clearTimeout)
  autoProgressTimeouts = {}
  setupSlideshows()
}

if (document.readyState != 'loading') {
  setupAll();
} else {
  document.addEventListener('DOMContentLoaded', setupAll);
}
document.addEventListener('turbo:load', setupAll)
