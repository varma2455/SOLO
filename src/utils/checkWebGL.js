export function checkWebGLSupport() {
  if (typeof window === 'undefined') return { supported: true, webgl2: false };
  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) return { supported: true, webgl2: true };

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) return { supported: true, webgl2: false };

    return { supported: false, webgl2: false };
  } catch (e) {
    return { supported: false, webgl2: false };
  }
}
