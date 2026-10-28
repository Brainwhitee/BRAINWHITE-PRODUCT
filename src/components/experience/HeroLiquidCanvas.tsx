"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useRef, useMemo, useEffect, Suspense } from "react";
import * as THREE from "three";

const fragmentShader = `
uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform float uVelo;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Adjust aspect ratio for circle math
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 mouseUv = uMouse;
  
  // Distance from mouse
  float dist = distance(uv * aspect, mouseUv * aspect);
  
  // Calculate mask (reveal area)
  // Radius of reveal: 0.25 (adjust as needed)
  float mask = 1.0 - smoothstep(0.1, 0.4, dist);
  
  // Liquid distortion (ripple based on velocity and time)
  float ripple = sin(dist * 30.0 - uTime * 4.0) * 0.05 * clamp(uVelo, 0.0, 1.0);
  vec2 displacedUv = uv + (uv - mouseUv) * ripple * mask;
  
  // Sample texture
  vec4 texColor = texture2D(uTexture, displacedUv);
  
  // The background is pure black for mix-blend-screen
  vec3 bgColor = vec3(0.0, 0.0, 0.0);
  
  // Blend white background with the revealed texture
  vec3 finalColor = mix(bgColor, texColor.rgb, mask * 0.8); // 0.8 max opacity for aesthetic
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function LiquidPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Load a fluid abstract texture (high-res placeholder)
  const texture = useTexture("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop");
  
  const { size, viewport } = useThree();
  
  // Track mouse and velocity
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const velocity = useRef(0);
  
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVelo: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) }
  }), [texture, size]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse to 0-1 for UVs (Y is inverted in WebGL textures typically, but let's map standard)
      targetMouse.current.x = e.clientX / window.innerWidth;
      targetMouse.current.y = 1.0 - (e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    // Smoothly interpolate mouse position
    const dx = targetMouse.current.x - mouse.current.x;
    const dy = targetMouse.current.y - mouse.current.y;
    mouse.current.x += dx * 0.1;
    mouse.current.y += dy * 0.1;
    
    // Calculate velocity based on movement distance
    const speed = Math.sqrt(dx * dx + dy * dy);
    velocity.current += (speed * 100.0 - velocity.current) * 0.1;
    // Decay velocity
    velocity.current *= 0.95;

    // Update uniforms
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uMouse.value.copy(mouse.current);
    materialRef.current.uniforms.uVelo.value = velocity.current;
    materialRef.current.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function HeroLiquidCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 0, 1] }} 
        dpr={[1, 2]} // Handle Retina displays as requested
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <LiquidPlane />
        </Suspense>
      </Canvas>
    </div>
  );
}
