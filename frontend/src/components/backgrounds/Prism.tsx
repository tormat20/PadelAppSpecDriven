import { useEffect, useRef } from "react"
import { Mesh, Program, Renderer, Triangle } from "ogl"

import "./Prism.css"

export type PrismProps = {
  animationType?: "rotate" | "3drotate" | "hover"
  timeScale?: number
  height?: number
  baseWidth?: number
  scale?: number
  hueShift?: number
  colorFrequency?: number
  noise?: number
  glow?: number
}

export const DEFAULT_PRISM_PROPS: Required<PrismProps> = {
  animationType: "rotate",
  timeScale: 0.5,
  height: 3.5,
  baseWidth: 4.7,
  scale: 3.6,
  hueShift: 0,
  colorFrequency: 0.95,
  noise: 0,
  glow: 1,
}

export function getEffectiveTimeScale(timeScale: number): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return timeScale
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : timeScale
}

export function Prism(props: PrismProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const {
    animationType,
    timeScale,
    height,
    baseWidth,
    scale,
    hueShift,
    colorFrequency,
    noise,
    glow,
  } = { ...DEFAULT_PRISM_PROPS, ...props }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({
      dpr: Math.min(2, window.devicePixelRatio || 1),
      alpha: true,
      antialias: false,
    })
    const gl = renderer.gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.BLEND)

    Object.assign(gl.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "none",
    })
    container.appendChild(gl.canvas)

    const vertex = /* glsl */ `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `

    const fragment = /* glsl */ `
      precision highp float;

      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHeight;
      uniform float uBaseHalf;
      uniform mat3 uRot;
      uniform int uUseBaseWobble;
      uniform float uGlow;
      uniform float uNoise;
      uniform float uScale;
      uniform float uHueShift;
      uniform float uColorFreq;
      uniform float uCenterShift;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uTimeScale;

      vec4 tanh4(vec4 x) {
        vec4 e2x = exp(2.0 * x);
        return (e2x - 1.0) / (e2x + 1.0);
      }

      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float sdOctaAnisoInv(vec3 p) {
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }

      float sdPyramidUpInv(vec3 p) {
        float oct = sdOctaAnisoInv(p);
        float halfSpace = -p.y;
        return max(oct, halfSpace);
      }

      mat3 hueRotation(float a) {
        float c = cos(a), s = sin(a);
        mat3 W = mat3(
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114
        );
        mat3 U = mat3(
          0.701, -0.587, -0.114,
          -0.299, 0.413, -0.114,
          -0.300, -0.588, 0.886
        );
        mat3 V = mat3(
          0.168, -0.331, 0.500,
          0.328, 0.035, -0.500,
          -0.497, 0.296, 0.201
        );
        return W + U * c + V * s;
      }

      void main() {
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy) * uPxScale;

        float z = 5.0;
        float d = 0.0;
        vec3 p;
        vec4 o = vec4(0.0);
        mat2 wob = mat2(1.0);

        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          float c0 = cos(t + 0.0);
          float c1 = cos(t + 33.0);
          float c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS = 100;
        for (int i = 0; i < STEPS; i++) {
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p;
          q.y += uCenterShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * uColorFreq + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * uGlow / 1e5);
        vec3 col = o.rgb;
        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        if (abs(uHueShift) > 0.0001) {
          col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
        }

        gl_FragColor = vec4(col, o.a);
      }
    `

    const geometry = new Triangle(gl)
    const iResBuf = new Float32Array(2)
    const effectiveTimeScale = getEffectiveTimeScale(timeScale)

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: iResBuf },
        iTime: { value: 0 },
        uHeight: { value: height },
        uBaseHalf: { value: baseWidth * 0.5 },
        uUseBaseWobble: { value: animationType === "rotate" ? 1 : 0 },
        uRot: { value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]) },
        uGlow: { value: Math.max(0, glow) },
        uNoise: { value: Math.max(0, noise) },
        uScale: { value: Math.max(0.001, scale) },
        uHueShift: { value: hueShift || 0 },
        uColorFreq: { value: Math.max(0, colorFrequency || 1) },
        uCenterShift: { value: height * 0.25 },
        uInvBaseHalf: { value: 1 / Math.max(0.001, baseWidth * 0.5) },
        uInvHeight: { value: 1 / Math.max(0.001, height) },
        uMinAxis: { value: Math.min(baseWidth * 0.5, height) },
        uPxScale: { value: 1 },
        uTimeScale: { value: effectiveTimeScale },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    const resize = () => {
      const width = container.clientWidth || 1
      const heightPx = container.clientHeight || 1
      renderer.setSize(width, heightPx)
      iResBuf[0] = gl.drawingBufferWidth
      iResBuf[1] = gl.drawingBufferHeight
      program.uniforms.uPxScale.value = 1 / ((gl.drawingBufferHeight || 1) * 0.1 * Math.max(0.001, scale))
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    const rotBuf = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])
    const setMat3FromEuler = (yawY: number, pitchX: number, rollZ: number) => {
      const cy = Math.cos(yawY)
      const sy = Math.sin(yawY)
      const cx = Math.cos(pitchX)
      const sx = Math.sin(pitchX)
      const cz = Math.cos(rollZ)
      const sz = Math.sin(rollZ)

      rotBuf[0] = cy * cz + sy * sx * sz
      rotBuf[1] = cx * sz
      rotBuf[2] = -sy * cz + cy * sx * sz
      rotBuf[3] = -cy * sz + sy * sx * cz
      rotBuf[4] = cx * cz
      rotBuf[5] = sy * sz + cy * sx * cz
      rotBuf[6] = sy * cx
      rotBuf[7] = -sx
      rotBuf[8] = cy * cx
      program.uniforms.uRot.value = rotBuf
    }

    const started = performance.now()
    let frame = 0
    const animate = (now: number) => {
      program.uniforms.iTime.value = (now - started) * 0.001

      if (animationType === "3drotate") {
        const t = (now - started) * 0.001 * effectiveTimeScale
        setMat3FromEuler(t * 0.45, Math.sin(t * 0.33) * 0.55, Math.sin(t * 0.2) * 0.4)
      }

      renderer.render({ scene: mesh })
      if (effectiveTimeScale > 0) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      if (gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas)
      }
    }
  }, [
    animationType,
    baseWidth,
    colorFrequency,
    glow,
    height,
    hueShift,
    noise,
    scale,
    timeScale,
  ])

  return <div className="prism-container" ref={containerRef} aria-hidden="true" />
}

export default Prism
