const scrollStop = 300 // Time in ms to wait after scrolling has finished to decide which slide to scroll to
const autoProgress = 5000 // Time in ms each slide should display for before progressing
const smoothScrollDuration = 1000 // Time in ms to wait after autoProgress before resuming scroll listening

const headerHeight = parseFloat(process.env.headerHeight) + 2 * parseInt(process.env.headerPadding)

let abortController: AbortController = new AbortController()

let autoProgressTimeouts: {[key: string]: number} = {}

const setupSlideshow = (el: Element) => {
  const parent = el.parentNode
  if (el.childNodes.length < 2) return

  const slideshowId = String(Math.random())

  let scrollTimeout: number | null = null
  let isAutoScrolling = false
  let isPlaying = true

  if (!abortController) abortController = new AbortController()

  const jump = (amount: number) => {
    if (autoProgressTimeouts[slideshowId]) {
      clearTimeout(autoProgressTimeouts[slideshowId])
      delete autoProgressTimeouts[slideshowId]
    }
    const width = el.getBoundingClientRect().width
    const nearest = Math.round(el.scrollLeft / width)
    const count = Math.round(el.scrollWidth / width)
    const next = (count + nearest + amount) % count
    isAutoScrolling = true
    setTimeout(() => {isAutoScrolling = false}, smoothScrollDuration)
    el.scrollTo({
      top: 0,
      left: next * width,
      behavior: 'smooth',
    })
    if (isPlaying) autoProgressTimeouts[slideshowId] = setTimeout(() => jump(1), autoProgress)
  }
  const toNext = () => jump(1)
  const toPrev = () => jump(-1)

  autoProgressTimeouts[slideshowId] = setTimeout(toNext, autoProgress)

  el.addEventListener('scroll', () => {
    if (isAutoScrolling) return
    if (scrollTimeout) clearTimeout(scrollTimeout)
    if (autoProgressTimeouts[slideshowId]) clearTimeout(autoProgressTimeouts[slideshowId])
    delete autoProgressTimeouts[slideshowId]
    scrollTimeout = setTimeout(() => {
      const width = el.getBoundingClientRect().width
      const nearest = Math.round(el.scrollLeft / width)
      el.scrollTo({
        top: 0,
        left: nearest * width,
        behavior: 'smooth',
      })
      if (isPlaying) autoProgressTimeouts[slideshowId] = setTimeout(toNext, autoProgress)
    }, scrollStop)
  }, {
    signal: abortController.signal,
  })

  if (!parent) return

  const row = document.createElement('div')
  row.classList.add('buttons')

  const prev = document.createElement('button')
  prev.type = 'button'
  prev.classList.add('prev')
  prev.addEventListener('click', toPrev)

  const play = document.createElement('button')
  play.type = 'button'
  play.classList.add('pause')
  play.addEventListener('click', (e) => {
    const button = e.target as HTMLButtonElement
    if (isPlaying) {
      isPlaying = false
      clearTimeout(autoProgressTimeouts[slideshowId])
      delete autoProgressTimeouts[slideshowId]
      button.classList.remove('pause')
      button.classList.add('play')
    } else {
      isPlaying = true
      toNext()
      button.classList.remove('play')
      button.classList.add('pause')
    }
  })

  const next = document.createElement('button')
  next.type = 'button'
  next.classList.add('next')
  next.addEventListener('click', toNext)

  row.appendChild(prev)
  row.appendChild(play)
  row.appendChild(next)

  parent.appendChild(row)
}

const setupSlideshows = () => {
  Object.values(autoProgressTimeouts).forEach(clearTimeout)
  Array.from(document.querySelectorAll('.detail-boxes .slideshow .buttons')).forEach((buttons) => {buttons.remove()})
  autoProgressTimeouts = {}
  Array.from(document.querySelectorAll('.detail-boxes .slideshow .boxes')).forEach(setupSlideshow)
}

const setupAnchorClicks = () => {
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
    signal: abortController.signal,
  });
}

const setupAll = () => {
  abortController.abort()
  abortController = new AbortController()
  setupSlideshows()
  setupAnchorClicks()
}

if (document.readyState != 'loading') {
  setupAll();
} else {
  document.addEventListener('DOMContentLoaded', setupAll);
}
document.addEventListener('turbo:load', setupAll)


