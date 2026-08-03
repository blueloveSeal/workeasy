<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface AnimConfig {
  frames: string[]
  interval: number
  loops?: number
  randomizeDuration?: boolean
  min?: number
  max?: number
}

interface SpriteConfig {
  ALLOWANCES: string[]
  walkspeed: number
  fallspeed: number
  jumpspeed: number
  gettingupspeed: number
  walk: AnimConfig
  stand: AnimConfig
  sit: AnimConfig
  spin: AnimConfig
  dance: AnimConfig
  trip: AnimConfig
  forcewalk: { loops: number }
  forcethink: AnimConfig
  pet: AnimConfig
  drag: AnimConfig
  falling: AnimConfig
  fallen: AnimConfig
  ORIGINAL_ACTIONS: string[]
  EDGE_ACTIONS: string[]
  JUMP_CHANCE: number
  climbSide: AnimConfig
  hangstillSide: AnimConfig
  climbTop: AnimConfig
  hangstillTop: AnimConfig
  jump: AnimConfig
  [key: string]: any
}

function f(base: string, name: string) { return base + name }

function createSpriteConfig(base: string, overrides?: {
  fallspeed?: number; jumpspeed?: number; gettingupspeed?: number
  standInterval?: number; danceLoops?: number; tripFrames?: string[]
  petInterval?: number; dragFrames?: string[]
  fallingFrames?: string[]; fallenFrames?: string[]
  originalActions?: string[]; edgeActions?: string[]
  jumpChance?: number; climbTopLoops?: number
}): SpriteConfig {
  const o = overrides || {}
  return {
    ALLOWANCES: ['pet', 'drag', 'bottom', 'top', 'left', 'right'],
    walkspeed: 50,
    fallspeed: o.fallspeed ?? 200,
    jumpspeed: o.jumpspeed ?? 150,
    gettingupspeed: o.gettingupspeed ?? 2000,

    walk: {
      frames: [f(base, 'shime1.png'), f(base, 'shime2.png'), f(base, 'shime3.png'), f(base, 'shime2.png')],
      interval: 175, loops: 6,
    },
    stand: {
      frames: [f(base, 'shime1.png')],
      interval: o.standInterval ?? 200, loops: 1,
    },
    sit: {
      frames: [f(base, 'shime11.png')],
      interval: 1000, loops: 1,
      randomizeDuration: true, min: 3000, max: 11000,
    },
    spin: {
      frames: [f(base, 'shime1.png')],
      interval: 150, loops: 3,
    },
    dance: {
      frames: [f(base, 'shime5.png'), f(base, 'shime6.png'), f(base, 'shime1.png')],
      interval: 200, loops: o.danceLoops ?? 5,
    },
    trip: {
      frames: o.tripFrames ?? [f(base, 'shime20.png'), f(base, 'shime21.png'), f(base, 'shime21.png'), f(base, 'shime20.png'), f(base, 'shime21.png'), f(base, 'shime21.png')],
      interval: 250, loops: 1,
    },
    forcewalk: { loops: 6 },
    forcethink: {
      frames: [f(base, 'shime27.png'), f(base, 'shime28.png')],
      interval: 500, loops: 2,
    },
    pet: {
      frames: [f(base, 'shime15.png'), f(base, 'shime16.png'), f(base, 'shime17.png')],
      interval: o.petInterval ?? 75,
    },
    drag: {
      frames: o.dragFrames ?? [f(base, 'shime5.png'), f(base, 'shime7.png'), f(base, 'shime5.png'), f(base, 'shime6.png'), f(base, 'shime8.png'), f(base, 'shime6.png')],
      interval: 210,
    },
    falling: {
      frames: o.fallingFrames ?? [f(base, 'shime4.png')],
      interval: 200, loops: 2,
    },
    fallen: {
      frames: o.fallenFrames ?? [f(base, 'shime19.png'), f(base, 'shime18.png')],
      interval: 250, loops: 1,
    },
    ORIGINAL_ACTIONS: o.originalActions ?? [
      'walk','walk','walk','walk','walk','walk',
      'walk','walk','walk','walk','walk','walk',
      'spin','spin','spin',
      'sit','sit',
      'dance','dance',
      'trip',
    ],
    EDGE_ACTIONS: o.edgeActions ?? [
      'hang','hang',
      'climb','climb','climb','climb',
      'fall','fall',
    ],
    JUMP_CHANCE: o.jumpChance ?? 0.05,
    climbSide: {
      frames: [f(base, 'shime13.png'), f(base, 'shime14.png')],
      interval: 200, loops: 2,
    },
    hangstillSide: {
      frames: [f(base, 'shime12.png')],
      interval: 200, loops: 2,
      randomizeDuration: true, min: 3000, max: 11000,
    },
    climbTop: {
      frames: [f(base, 'shime24.png'), f(base, 'shime25.png')],
      interval: 200, loops: o.climbTopLoops ?? 6,
    },
    hangstillTop: {
      frames: [f(base, 'shime23.png')],
      interval: 200, loops: 2,
      randomizeDuration: true, min: 3000, max: 11000,
    },
    jump: {
      frames: [f(base, 'shime22.png')],
      interval: 200,
    },
  }
}

const SHIMEJI_CONFIG = createSpriteConfig('/webmeji/shimeji/')
const MIKU_CONFIG = createSpriteConfig('/webmeji/miku/', {
  fallspeed: 150,
  jumpspeed: 200,
  gettingupspeed: 3500,
  standInterval: 1000,
  danceLoops: 2,
  tripFrames: undefined, // use default
  petInterval: 400,
  dragFrames: undefined, // use default
  fallingFrames: undefined, // use default
  fallenFrames: undefined, // use default
  originalActions: [
    'walk','walk','walk','walk','walk','walk',
    'spin','spin','spin',
    'sit','sit',
    'dance','dance','dance','dance','dance',
    'trip',
  ],
  edgeActions: [
    'hang','hang',
    'climb','climb','climb','climb','climb',
    'fall',
  ],
  jumpChance: 0.1,
  climbTopLoops: 8,
})

const ALL_CONFIGS = [SHIMEJI_CONFIG, MIKU_CONFIG]

// ─── Creature class ────────────────────────────────────────────
class Creature {
  container: HTMLDivElement
  img: HTMLImageElement
  spriteConfig: SpriteConfig
  actionSequence: string[]
  currentActionIndex: number
  currentAction: string | null
  frameTimer: ReturnType<typeof setInterval> | null
  dragFrameTimer: ReturnType<typeof setInterval> | null
  actionCompletionTimer: ReturnType<typeof setTimeout> | null
  currentFrame: number
  direction: number
  facing: string
  isDragging: boolean
  isFalling: boolean
  isPetting: boolean
  isJumping: boolean
  tripAfterFallActive: boolean
  wasActionBeforePet: string | null
  isPointerDown: boolean
  containerWidth: number
  containerHeight: number
  positionX: number
  positionY: number
  maxPos: number
  forceWalkAfter: boolean
  forceThinkAfter: boolean
  currentEdge: string
  animationFrameId: number | null
  lastTime: number
  _rafWorking: boolean
  _rafTestDone: boolean
  _fallbackTimer: ReturnType<typeof setTimeout> | null
  resizeHandler: () => void

  constructor(spriteConfig: SpriteConfig, mountEl: HTMLDivElement) {
    this.currentEdge = 'bottom'
    this.spriteConfig = spriteConfig
    this.actionSequence = this.shuffle([...this.spriteConfig.ORIGINAL_ACTIONS])
    this.currentActionIndex = 0
    this.currentAction = null
    this.frameTimer = null
    this.dragFrameTimer = null
    this.actionCompletionTimer = null
    this.currentFrame = 0
    this.direction = 1
    this.facing = 'left'
    this.isDragging = false
    this.isFalling = false
    this.isPetting = false
    this.isJumping = false
    this.tripAfterFallActive = false
    this.wasActionBeforePet = null
    this.isPointerDown = false
    this.forceWalkAfter = false
    this.forceThinkAfter = false
    this.animationFrameId = null
    this.lastTime = 0
    this._rafWorking = false
    this._rafTestDone = false
    this._fallbackTimer = null

    this.container = mountEl
    this.img = this.container.querySelector('img')!
    this.img.src = spriteConfig.walk.frames[0]

    const containerStyle = window.getComputedStyle(this.container)
    this.containerWidth = parseFloat(containerStyle.width)
    this.containerHeight = parseFloat(containerStyle.height)

    this.positionX = Math.random() * (window.innerWidth - this.containerWidth)
    this.positionY = window.innerHeight - this.containerHeight
    this.container.style.left = `${this.positionX}px`
    this.container.style.top = `${this.positionY}px`
    this.maxPos = window.innerWidth - this.containerWidth

    this.updateImageDirection()
    this.currentAction = this.actionSequence[this.currentActionIndex]
    this.startAction(this.currentAction)
    this.animate = this.animate.bind(this)
    this.scheduleFrame()

    this.resizeHandler = () => {
      const style = window.getComputedStyle(this.container)
      this.containerWidth = parseFloat(style.width)
      this.containerHeight = parseFloat(style.height)
      this.maxPos = window.innerWidth - this.containerWidth
      this.positionX = Math.min(this.positionX, this.maxPos)
      this.container.style.left = `${this.positionX}px`
    }
    window.addEventListener('resize', this.resizeHandler)

    const onDown = () => { this.isPointerDown = true }
    const onUp = () => { this.isPointerDown = false }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('touchend', onUp)

    this.enablePetInteraction()
    this.enableDragInteraction()
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  updateImageDirection() {
    this.img.style.transform = this.facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)'
  }

  setFacingFromDelta(dx: number) {
    if (dx && !this.isDragging) {
      this.facing = dx < 0 ? 'left' : 'right'
      this.updateImageDirection()
    }
  }

  resetAnimation() {
    if (this.frameTimer) clearInterval(this.frameTimer)
    if (this.actionCompletionTimer) clearTimeout(this.actionCompletionTimer)
    this.currentFrame = 0
    this.frameTimer = null
    this.actionCompletionTimer = null
  }

  clearAllTimers() {
    this.resetAnimation()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer)
      this._fallbackTimer = null
    }
    window.removeEventListener('resize', this.resizeHandler)
  }

  scheduleFrame() {
    if (this._rafWorking) {
      this.animationFrameId = requestAnimationFrame(this.animate)
    } else {
      // Use setTimeout as fallback for background tabs where rAF is throttled
      this._fallbackTimer = setTimeout(() => {
        this.animate(performance.now())
      }, 16) as any
      // Test if rAF works by scheduling a test; if it fires, switch to rAF
      if (!this._rafTestDone) {
        this._rafTestDone = true
        requestAnimationFrame(() => {
          this._rafWorking = true
          // Cancel the setTimeout fallback since rAF works
          if (this._fallbackTimer) {
            clearTimeout(this._fallbackTimer)
            this._fallbackTimer = null
          }
          // Switch to rAF for subsequent frames
          this.animationFrameId = requestAnimationFrame(this.animate)
        })
      }
    }
  }

  isSideEdge(edge: string) { return edge === 'left' || edge === 'right' }

  updateEdgeClass() {
    this.container.classList.remove('edge-left', 'edge-right', 'edge-top')
    if (!this.isDragging) {
      if (this.currentEdge === 'left') this.container.classList.add('edge-left')
      if (this.currentEdge === 'right') this.container.classList.add('edge-right')
      if (this.currentEdge === 'top') this.container.classList.add('edge-top')
    }
    this.applyEdgeOffset()
  }

  applyEdgeOffset() {
    if (this.isDragging) {
      this.container.style.cssText = `left:${this.positionX}px;top:${this.positionY}px`
      return
    }
    const offsetX = this.currentEdge === 'left' ? -this.containerWidth / 2
      : this.currentEdge === 'right' ? this.containerHeight / 2 : 0
    const offsetY = this.currentEdge === 'top' ? -this.containerHeight / 2 : 0
    this.container.style.left = `${(this.positionX || 0) + offsetX}px`
    this.container.style.top = `${(this.positionY || 0) + offsetY}px`
  }

  jumpToEdge(targetEdge: string) {
    if (this.isFalling || this.isPetting || this.isDragging || this.isJumping) return
    if (!this.spriteConfig.ALLOWANCES.includes(targetEdge)) return
    this.isJumping = true
    this.resetAnimation()

    const jumpConfig = this.spriteConfig.jump
    if (!jumpConfig) { this.isJumping = false; return }

    const startX = this.positionX
    const startY = this.positionY
    let endX = startX
    let endY = startY

    switch (targetEdge) {
      case 'top':
        endY = 0
        endX = Math.random() * (window.innerWidth - this.containerWidth)
        break
      case 'left':
        endX = 0
        endY = Math.random() * (window.innerHeight - this.containerHeight)
        break
      case 'right':
        endX = window.innerWidth - this.containerWidth
        endY = Math.random() * (window.innerHeight - this.containerHeight)
        break
    }

    const dx = endX - startX
    const dy = endY - startY
    const distance = Math.hypot(dx, dy)
    if (distance === 0) { this.isJumping = false; return }

    const duration = distance / this.spriteConfig.jumpspeed
    const startTime = performance.now()

    let frameIndex = 0
    const totalFrames = jumpConfig.frames.length
    this.img.src = jumpConfig.frames[frameIndex]

    const ft = setInterval(() => {
      frameIndex = (frameIndex + 1) % totalFrames
      this.img.src = jumpConfig.frames[frameIndex]
    }, jumpConfig.interval)

    const step = (time: number) => {
      if (this.isDragging) { clearInterval(ft); this.isJumping = false; return }
      const elapsed = (time - startTime) / 1000
      const t = Math.min(elapsed / duration, 1)
      this.positionX = startX + dx * t
      this.positionY = startY + dy * t
      if (dx !== 0) this.setFacingFromDelta(dx)
      this.container.style.left = `${this.positionX}px`
      this.container.style.top = `${this.positionY}px`
      if (t < 1) {
        requestAnimationFrame(step)
      } else {
        clearInterval(ft)
        this.isJumping = false
        this.currentEdge = targetEdge
        this.updateEdgeClass()
        this.startEdgeIdle()
      }
    }
    requestAnimationFrame(step)
  }

  startEdgeIdle() {
    this.updateEdgeClass()
    if (this.currentEdge === 'top') this.startAction('hangstillTop')
    else if (this.isSideEdge(this.currentEdge)) this.startAction('hangstillSide')
  }

  edgeAction() {
    if (this.isJumping || this.isFalling) return
    const choice = this.spriteConfig.EDGE_ACTIONS[Math.floor(Math.random() * this.spriteConfig.EDGE_ACTIONS.length)]
    if (choice === 'hang') this.startEdgeIdle()
    else if (choice === 'climb') this.startAction(this.currentEdge === 'top' ? 'climbTop' : 'climbSide')
    else if (choice === 'fall') this.fallToBottom()
  }

  enablePetInteraction() {
    if (!this.spriteConfig.ALLOWANCES.includes('pet') || !this.spriteConfig.ALLOWANCES.includes('bottom')) return
    this.container.addEventListener('mouseenter', () => {
      if (this.isFalling || this.isPointerDown || this.isPetting || this.isJumping || this.currentEdge !== 'bottom') return
      this.isPetting = true
      this.wasActionBeforePet = this.currentAction
      this.startPetAnimation()
    })
    this.container.addEventListener('mouseleave', () => {
      if (this.isFalling || this.isPointerDown || this.isJumping || this.currentEdge === 'top') return
      this.isPetting = false
      this.stopPetAnimation()
    })
  }

  enableDragInteraction() {
    if (!this.spriteConfig.ALLOWANCES.includes('drag') || !this.spriteConfig.ALLOWANCES.includes('bottom')) return

    this.container.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault()
      this.startDragFn(e.clientX, e.clientY)
    })
    this.container.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      this.startDragFn(touch.clientX, touch.clientY)
    })
  }

  startDragFn(clientX: number, clientY: number) {
    this.resetAnimation()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.isDragging = true
    this.tripAfterFallActive = false
    this.isJumping = false
    this.isFalling = false
    this.isPetting = false
    this.currentAction = 'drag'
    this.img.style.transform = this.facing === 'left' ? 'scaleX(1)' : 'scaleX(-1)'

    if (this.dragFrameTimer) clearInterval(this.dragFrameTimer)
    const dragConfig = this.spriteConfig.drag
    if (dragConfig?.frames?.length) {
      let frame = 0
      this.img.src = dragConfig.frames[0]
      this.dragFrameTimer = setInterval(() => {
        frame = (frame + 1) % dragConfig.frames.length
        this.img.src = dragConfig.frames[frame]
      }, dragConfig.interval)
    }

    const rect = this.container.getBoundingClientRect()
    const offsetX = clientX - rect.left
    const offsetY = clientY - rect.top

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const cx = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX ?? 0
      const cy = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY ?? 0
      this.positionX = Math.max(0, Math.min(cx - offsetX, window.innerWidth - this.containerWidth))
      this.positionY = Math.max(0, Math.min(cy - offsetY, window.innerHeight - this.containerHeight))
      this.container.style.left = this.positionX + 'px'
      this.container.style.top = this.positionY + 'px'
    }

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchend', onPointerUp)
      this.isDragging = false
      this.isFalling = false
      if (this.dragFrameTimer) { clearInterval(this.dragFrameTimer); this.dragFrameTimer = null }
      this.resetAnimation()
      this.fallToBottom()
      this.scheduleFrame()
    }

    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchend', onPointerUp)
  }

  fallToBottom(fallSpeed = this.spriteConfig.fallspeed) {
    if (this.isFalling) return
    this.tripAfterFallActive = false
    this.isFalling = true
    this.currentEdge = 'bottom'
    this.updateEdgeClass()
    this.resetAnimation()

    const cfg = this.spriteConfig.falling
    if (!cfg) return

    let frameIndex = 0
    this.img.src = cfg.frames[0]
    this.frameTimer = setInterval(() => {
      frameIndex = (frameIndex + 1) % cfg.frames.length
      this.img.src = cfg.frames[frameIndex]
    }, cfg.interval)

    const startY = this.positionY
    const endY = window.innerHeight - this.containerHeight
    const distance = endY - startY
    if (distance <= 0) {
      if (this.frameTimer) clearInterval(this.frameTimer); this.frameTimer = null
      this.positionY = endY
      this.container.style.top = `${endY}px`
      return this.playTripAfterFall()
    }

    const startTime = performance.now()
    const step = (time: number) => {
      if (this.isDragging) {
        if (this.frameTimer) clearInterval(this.frameTimer); this.frameTimer = null
        return this.scheduleFrame()
      }
      const elapsed = (time - startTime) / 1000
      const deltaY = fallSpeed * elapsed
      this.positionY = Math.min(startY + deltaY, endY)
      this.container.style.top = `${this.positionY}px`
      if (this.positionY < endY) {
        requestAnimationFrame(step)
      } else {
        if (this.frameTimer) clearInterval(this.frameTimer); this.frameTimer = null
        this.positionY = endY
        this.container.style.top = `${endY}px`
        this.playTripAfterFall()
      }
    }
    requestAnimationFrame(step)
  }

  playTripAfterFall() {
    const tripConfig = this.spriteConfig.fallen
    if (!tripConfig) { this.resumeAfterFallen(); return }
    this.tripAfterFallActive = true
    let frame = 0
    const totalFrames = tripConfig.frames.length
    this.img.src = tripConfig.frames[0]

    const frameTimer = setInterval(() => {
      frame++
      if (frame >= totalFrames) {
        clearInterval(frameTimer)
        this.img.src = tripConfig.frames[totalFrames - 1]
        setTimeout(() => { if (this.tripAfterFallActive) this.resumeAfterFallen() }, this.spriteConfig.gettingupspeed)
      } else {
        this.img.src = tripConfig.frames[frame]
      }
    }, tripConfig.interval)
  }

  resumeAfterFallen() {
    if (this.isDragging) return
    this.isFalling = false
    this.isPetting = false
    this.resetAnimation()
    this.lastTime = performance.now()
    this.currentAction = 'sit'
    this.setNextAction()
    this.scheduleFrame()
  }

  setNextAction() {
    if (this.isDragging || this.isFalling) return
    this.resetAnimation()

    if (['top', 'left', 'right'].includes(this.currentEdge)) {
      this.edgeAction()
      return
    }

    if (!this.isJumping && this.positionY >= window.innerHeight - this.containerHeight) {
      if (Math.random() < this.spriteConfig.JUMP_CHANCE) {
        const edges = ['top', 'left', 'right'].filter(e => this.spriteConfig.ALLOWANCES.includes(e))
        if (edges.length) {
          this.jumpToEdge(edges[Math.floor(Math.random() * edges.length)])
          return
        }
      }
    }

    if (this.forceWalkAfter) { this.forceWalkAfter = false; this.startForcedWalk(); return }
    if (this.forceThinkAfter) { this.forceThinkAfter = false; this.startForceThink(); return }

    this.currentActionIndex++
    if (this.currentActionIndex >= this.actionSequence.length) {
      this.currentActionIndex = 0
      this.actionSequence = this.shuffle([...this.spriteConfig.ORIGINAL_ACTIONS])
    }
    this.currentAction = this.actionSequence[this.currentActionIndex]
    this.startAction(this.currentAction)
  }

  startForcedWalk() {
    const { frames, interval } = this.spriteConfig.walk
    const walkCycles = this.spriteConfig.forcewalk
    this.currentAction = 'forced-walk'
    this.playAnimation(frames, interval, walkCycles.loops, () => this.setNextAction())
  }

  startForceThink() {
    const { frames, interval, loops } = this.spriteConfig.forcethink
    this.currentAction = 'force-think'
    this.playAnimation(frames, interval, loops!, () => this.setNextAction())
  }

  startPetAnimation() {
    this.resetAnimation()
    const petConfig = this.spriteConfig.pet
    if (!petConfig) return
    this.currentAction = 'pet'
    let frame = 0
    this.img.src = petConfig.frames[0]
    this.frameTimer = setInterval(() => {
      frame = (frame + 1) % petConfig.frames.length
      this.img.src = petConfig.frames[frame]
    }, petConfig.interval)
  }

  stopPetAnimation() {
    this.resetAnimation()
    this.currentAction = this.wasActionBeforePet || 'sit'
    this.wasActionBeforePet = null
    this.setNextAction()
  }

  startAction(action: string) {
    if (this.isDragging || this.isFalling) return
    this.currentAction = action
    this.resetAnimation()

    if (action === 'climbTop') { this.direction = Math.random() < 0.5 ? -1 : 1; this.updateImageDirection() }
    if (action === 'climbSide') { this.direction = Math.random() < 0.5 ? -1 : 1 }
    if (this.isJumping) { this.scheduleFrame(); return }

    const config = this.spriteConfig[action]
    if (!config) return
    const { frames, interval, loops = 1 } = config

    if (action === 'sit' || action === 'hangstillSide' || action === 'hangstillTop') {
      const duration = config.randomizeDuration
        ? Math.random() * ((config.max || 0) - (config.min || 0)) + (config.min || 0)
        : interval * loops
      this.img.src = frames[0]
      this.actionCompletionTimer = setTimeout(() => {
        this.forceWalkAfter = true
        this.setNextAction()
      }, duration)
      return
    }

    this.playAnimation(frames, interval, loops, () => {
      if (action === 'spin') {
        this.direction *= -1
        this.facing = this.facing === 'left' ? 'right' : 'left'
        this.updateImageDirection()
      }
      if (['trip', 'spin'].includes(action)) this.forceWalkAfter = true
      if (action === 'dance') this.forceThinkAfter = true
      this.setNextAction()
    })
  }

  playAnimation(frames: string[], interval: number, loops: number, onComplete: () => void) {
    let playCount = 0, f = 0
    this.currentFrame = 0
    this.img.src = frames[0]
    if (this.frameTimer) clearInterval(this.frameTimer)

    this.frameTimer = setInterval(() => {
      this.currentFrame = f = (f + 1) % frames.length
      this.img.src = frames[f]
      if (f === frames.length - 1 && ++playCount >= loops) {
        if (this.frameTimer) clearInterval(this.frameTimer)
        this.frameTimer = null
        this.currentAction = null
        this.actionCompletionTimer = setTimeout(onComplete, 0)
      }
    }, interval)
  }

  animate(time: number) {
    if (!this.lastTime) this.lastTime = time
    const delta = (time - this.lastTime) / 1000
    this.lastTime = time

    if (this.isDragging || this.isFalling) {
      this.scheduleFrame()
      return
    }

    const movingActions = ['walk', 'forced-walk', 'climbTop']
    if (this.currentAction && movingActions.includes(this.currentAction)) {
      const dx = this.direction * this.spriteConfig.walkspeed * delta
      this.positionX += dx
      this.setFacingFromDelta(dx)

      if (this.positionX <= 0) {
        this.positionX = 0; this.direction = 1; this.facing = 'right'; this.updateImageDirection()
      } else if (this.positionX >= this.maxPos) {
        this.positionX = this.maxPos; this.direction = -1; this.facing = 'left'; this.updateImageDirection()
      }
      this.applyEdgeOffset()
    }

    if (this.currentAction === 'climbSide') {
      this.positionY += this.direction * this.spriteConfig.walkspeed * delta
      if (this.currentEdge === 'left') this.facing = 'left'
      else if (this.currentEdge === 'right') this.facing = 'right'
      this.updateImageDirection()

      const maxY = window.innerHeight - this.containerHeight
      if (this.positionY <= 0) { this.positionY = 0; this.direction = 1 }
      else if (this.positionY >= maxY) { this.positionY = maxY; this.direction = -1 }
      this.applyEdgeOffset()
    }

    this.scheduleFrame()
  }
}

// ─── Vue component setup ───────────────────────────────────────
const PET_COUNT = 3
const creatureRefs = ref<HTMLDivElement[]>([])
const creatures: Creature[] = []

onMounted(() => {
  // Preload all frames from all config sets
  const allFrames = ALL_CONFIGS
    .flatMap(cfg => Object.values(cfg))
    .flatMap((item: any) => (item.frames && Array.isArray(item.frames)) ? item.frames : [])
  Promise.all(allFrames.map(src => new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  }))).then(() => {
    // Vue auto-populates creatureRefs when using :ref with v-for
    const els = creatureRefs.value
    for (let i = 0; i < PET_COUNT; i++) {
      const el = els[i]
      if (!el) continue
      // Creature 0 uses shimeji, creatures 1&2 use miku
      const config = i === 0 ? SHIMEJI_CONFIG : MIKU_CONFIG
      creatures.push(new Creature(config, el))
    }
  })
})

onBeforeUnmount(() => {
  creatures.forEach(c => c.clearAllTimers())
  creatures.length = 0
})
</script>

<template>
  <div
    v-for="i in PET_COUNT"
    :key="i"
    ref="creatureRefs"
    class="webmeji-container"
  >
    <img alt="pet" />
  </div>
</template>

<style scoped>
.webmeji-container {
  position: fixed;
  bottom: 0;
  width: 100px;
  height: 100px;
  overflow: hidden;
  z-index: 9999;
  cursor: grab;
}
.webmeji-container:active {
  cursor: grabbing;
}
.webmeji-container img {
  width: 100%;
  height: auto;
  user-select: none;
  pointer-events: none;
  display: block;
  transform-origin: center;
}
@media (max-width: 768px) {
  .webmeji-container {
    width: 50px;
    height: 50px;
  }
}
</style>
