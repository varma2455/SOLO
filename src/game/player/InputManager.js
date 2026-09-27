// -------------------------------------------------------------
// SHADOW ASCENSION - INPUT MANAGER
// Authoritative, zero-dependency, crash-safe keyboard & mouse tracking.
// Listens to event.code and event.key, works without pointer-lock,
// and provides programmatic movement overrides for testing.
// -------------------------------------------------------------

class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      dash: false,
      skill: false,
      ultimate: false,
      interact: false,
      targetLock: false,
      shadowSummon: false,
      shadowTarget: false,
      shadowRecall: false,
      shadowSkill1: false,
      shadowSkill2: false,
      shadowSkill3: false,
      shadowSkill4: false
    };

    this.mouse = {
      yaw: 0,
      pitch: 0.35,
      isDragging: false,
      lastX: 0,
      lastY: 0
    };

    this.listenersAttached = false;
    this.subscribers = new Set();
  }

  init() {
    if (this.listenersAttached || typeof window === 'undefined') return;

    this.handleKeyDown = (e) => {
      // Don't capture inputs if user is typing in a form input or textarea
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') {
        this.keys.forward = true;
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') {
        this.keys.backward = true;
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') {
        this.keys.left = true;
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') {
        this.keys.right = true;
      }
      if (code === 'KeyE' || key === 'e' || code === 'Space' || key === ' ') {
        this.keys.dash = true;
      }
      if (code === 'KeyQ' || key === 'q') {
        this.keys.skill = true;
      }
      if (code === 'KeyR' || key === 'r') {
        this.keys.ultimate = true;
      }
      if (code === 'KeyF' || key === 'f') {
        this.keys.interact = true;
      }
      if (code === 'Tab' || key === 'tab') {
        e.preventDefault?.();
        this.keys.targetLock = true;
      }
      if (code === 'KeyZ' || key === 'z') {
        this.keys.shadowSummon = true;
      }
      if (code === 'KeyX' || key === 'x') {
        this.keys.shadowTarget = true;
      }
      if (code === 'KeyC' || key === 'c') {
        this.keys.shadowRecall = true;
      }
      if (code === 'Digit1' || key === '1') {
        this.keys.shadowSkill1 = true;
      }
      if (code === 'Digit2' || key === '2') {
        this.keys.shadowSkill2 = true;
      }
      if (code === 'Digit3' || key === '3') {
        this.keys.shadowSkill3 = true;
      }
      if (code === 'Digit4' || key === '4') {
        this.keys.shadowSkill4 = true;
      }

      this.notify();
    };

    this.handleKeyUp = (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup') {
        this.keys.forward = false;
      }
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown') {
        this.keys.backward = false;
      }
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft') {
        this.keys.left = false;
      }
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright') {
        this.keys.right = false;
      }
      if (code === 'KeyE' || key === 'e' || code === 'Space' || key === ' ') {
        this.keys.dash = false;
      }
      if (code === 'KeyQ' || key === 'q') {
        this.keys.skill = false;
      }
      if (code === 'KeyR' || key === 'r') {
        this.keys.ultimate = false;
      }
      if (code === 'KeyF' || key === 'f') {
        this.keys.interact = false;
      }
      if (code === 'Tab' || key === 'tab') {
        this.keys.targetLock = false;
      }
      if (code === 'KeyZ' || key === 'z') {
        this.keys.shadowSummon = false;
      }
      if (code === 'KeyX' || key === 'x') {
        this.keys.shadowTarget = false;
      }
      if (code === 'KeyC' || key === 'c') {
        this.keys.shadowRecall = false;
      }
      if (code === 'Digit1' || key === '1') {
        this.keys.shadowSkill1 = false;
      }
      if (code === 'Digit2' || key === '2') {
        this.keys.shadowSkill2 = false;
      }
      if (code === 'Digit3' || key === '3') {
        this.keys.shadowSkill3 = false;
      }
      if (code === 'Digit4' || key === '4') {
        this.keys.shadowSkill4 = false;
      }

      this.notify();
    };

    this.handleMouseDown = (e) => {
      this.mouse.isDragging = true;
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;
    };

    this.handleMouseUp = () => {
      this.mouse.isDragging = false;
    };

    this.handleMouseMove = (e) => {
      const isLocked = document.pointerLockElement != null;
      let dx = e.movementX;
      let dy = e.movementY;

      if (!isLocked) {
        if (!this.mouse.isDragging) {
          this.mouse.lastX = e.clientX;
          this.mouse.lastY = e.clientY;
          return;
        }
        if (dx === undefined || (dx === 0 && dy === 0)) {
          dx = this.mouse.lastX ? e.clientX - this.mouse.lastX : 0;
          dy = this.mouse.lastY ? e.clientY - this.mouse.lastY : 0;
        }
      }

      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;

      const sens = 0.0035;
      this.mouse.yaw -= (dx || 0) * sens;
      this.mouse.pitch = Math.max(0.08, Math.min(1.25, this.mouse.pitch + (dy || 0) * sens));
    };

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: true });
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);

    this.listenersAttached = true;
  }

  // Programmatic key override for debug buttons and testing
  setKey(name, value) {
    const keyMap = {
      w: 'forward',
      s: 'backward',
      a: 'left',
      d: 'right',
      space: 'dash',
      e: 'dash',
      q: 'skill',
      r: 'ultimate',
      f: 'interact',
      z: 'shadowSummon',
      x: 'shadowTarget',
      c: 'shadowRecall',
      '1': 'shadowSkill1',
      '2': 'shadowSkill2',
      '3': 'shadowSkill3',
      '4': 'shadowSkill4'
    };
    const keyName = keyMap[name?.toLowerCase()] || name;
    if (this.keys[keyName] !== undefined) {
      this.keys[keyName] = Boolean(value);
      this.notify();
    }
  }

  pulseKey(name, durationMs = 400) {
    this.setKey(name, true);
    setTimeout(() => {
      this.setKey(name, false);
    }, durationMs);
  }

  resetCamera() {
    this.mouse.yaw = 0;
    this.mouse.pitch = 0.35;
  }

  reset() {
    for (const k in this.keys) {
      this.keys[k] = false;
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    for (const sub of this.subscribers) {
      try { sub(this.keys); } catch (_) {}
    }
  }

  destroy() {
    if (!this.listenersAttached || typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.listenersAttached = false;
  }
}

export const inputManager = new InputManager();

if (typeof window !== 'undefined') {
  inputManager.init();
  window.__inputManager = inputManager;
}
