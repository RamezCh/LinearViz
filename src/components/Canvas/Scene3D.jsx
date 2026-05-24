import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';

function AxisIndicators() {
  return (
    <group position={[0, 0, 0]}>
      <arrowHelper
        args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3, 0xff0000, 0.3, 0.15]}
      />
      <arrowHelper
        args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 3, 0x00ff00, 0.3, 0.15]}
      />
      <arrowHelper
        args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 3, 0x0088ff, 0.3, 0.15]}
      />

      <Html position={[3.5, 0, 0]} style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '14px' }}>
        X
      </Html>
      <Html position={[0, 3.5, 0]} style={{ color: '#44ff44', fontWeight: 'bold', fontSize: '14px' }}>
        Y
      </Html>
      <Html position={[0, 0, 3.5]} style={{ color: '#4488ff', fontWeight: 'bold', fontSize: '14px' }}>
        Z
      </Html>
    </group>
  );
}

function Lighting({ darkMode }) {
  return (
    <>
      <ambientLight intensity={darkMode ? 0.3 : 0.7} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={darkMode ? 0.8 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={darkMode ? 0.4 : 0.6}
      />
      <pointLight position={[0, 5, 0]} intensity={darkMode ? 0.3 : 0.5} />
    </>
  );
}

function GroundGrid({ darkMode, gridSize = 1, gridDivisions = 10 }) {
  return (
    <Grid
      position={[0, 0, 0]}
      args={[gridDivisions * 2, gridDivisions * 2]}
      cellSize={gridSize}
      cellThickness={0.5}
      cellColor={darkMode ? '#334155' : '#e2e8f0'}
      sectionSize={gridSize * 5}
      sectionThickness={1}
      sectionColor={darkMode ? '#475569' : '#94a3b8'}
      fadeDistance={50}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={false}
    />
  );
}

function CameraController({ enableDamping = true, dampingFactor = 0.05 }) {
  return (
    <OrbitControls
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI * 0.9}
      enablePan={true}
      panSpeed={0.8}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
}

function OriginMarker() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export default function Scene3D({
  children,
  cameraPosition = [5, 5, 5],
  cameraTarget = [0, 0, 0],
  fov = 60,
  showGrid = true,
  gridSize = 1,
  gridDivisions = 10,
  showAxes = true,
  enableControls = true,
  backgroundColor = null,
  className = '',
}) {
  const darkMode = useStore((state) => state.darkMode);
  const containerRef = useRef(null);

  const bgColor = backgroundColor || (darkMode ? '#0f172a' : '#f8fafc');

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] rounded-lg overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: bgColor }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: fov,
          near: 0.1,
          far: 1000,
        }}
        shadows
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(bgColor));
        }}
      >
        <Suspense fallback={null}>
          <Lighting darkMode={darkMode} />

          {showGrid && (
            <GroundGrid
              darkMode={darkMode}
              gridSize={gridSize}
              gridDivisions={gridDivisions}
            />
          )}

          {showAxes && <AxisIndicators />}

          <OriginMarker />

          {children}

          {enableControls && <CameraController />}
        </Suspense>
      </Canvas>

      <div className="absolute bottom-3 left-3 text-xs pointer-events-none" style={{ color: 'var(--color-muted)' }}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(220,75,55,0.9)' }}></span>
            X
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-emerald)' }}></span>
            Y
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }}></span>
            Z
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function Scene3DOverlay({ children, className = '' }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {children}
    </div>
  );
}

export function Scene3DLabel({ position, children, className = '' }) {
  return (
    <Html position={position} center className={className}>
      <div className="px-2 py-1 rounded text-sm font-medium" style={{ backgroundColor: 'var(--color-paper-2)', color: 'var(--color-paper)' }}>
        {children}
      </div>
    </Html>
  );
}