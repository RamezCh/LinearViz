import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { svd2x2 } from '../../utils/linalg';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';
import { Button } from '../../components/UI/Button';

const ACCENT = 'var(--color-accent)';
const ACCENT_RGB = '75,160,195';

const steps = [
  {
    title: 'Every Matrix is Three Operations',
    concept: 'SVD reveals that ANY matrix A can be decomposed into three sequential transformations: A = U × Σ × Vᵀ. First, Vᵀ rotates to align the input basis.',
    hint: 'Look at the 3D visualization — Vᵀ rotates first, then Σ stretches.',
    action: 'Observe the Vᵀ rotation step',
  },
  {
    title: 'Singular Values as Stretch Amounts',
    concept: 'The diagonal entries σ₁ ≥ σ₂ ≥ ... of Σ tell us exactly how much stretching happens at each step. The bars show their relative magnitudes.',
    hint: 'The bar chart shows the singular values for compression.',
    action: 'Check the singular value chart',
  },
  {
    title: 'Rank-k Approximation',
    concept: 'Keeping only the top k singular values gives the best rank-k approximation. The error decreases as k increases — fewer values needed for good accuracy!',
    hint: 'Drag the rank slider to see how image quality changes.',
    action: 'Adjust the rank k slider',
  },
  {
    title: 'Connection to PCA',
    concept: 'SVD and PCA are deeply connected! PCA finds directions of maximum variance — these are exactly the columns of U (left singular vectors).',
    hint: 'U columns are the principal directions of the data.',
    action: 'Learn about PCA connection',
  },
];

export default function SVDModule() {
  const [activeTab, setActiveTab] = useState('decomposition');
  const [currentStep, setCurrentStep] = useState(0);
  const [rankK, setRankK] = useState(10);
  const [gameScore, setGameScore] = useState(0);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  const [svdMatrix] = useState(() => {
    const A = [[3, 1], [2, 2]];
    const result = svd2x2(A);
    return { U: result.U, S: result.S, V: result.Vt, fullA: A };
  });

  useEffect(() => {
    if (!canvasRef.current || activeTab !== 'decomposition') return;

    const container = canvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0c14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(4, 3, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const gridHelper = new THREE.GridHelper(6, 6, 0x333355, 0x222244);
    scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    const sphereGeom = new THREE.SphereGeometry(1, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, wireframe: true, transparent: true, opacity: 0.3 });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    scene.add(sphere);

    const unitCirclePoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      unitCirclePoints.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    const unitCircleGeom = new THREE.BufferGeometry().setFromPoints(unitCirclePoints);
    const unitCircleMat = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });
    const unitCircle = new THREE.Line(unitCircleGeom, unitCircleMat);
    scene.add(unitCircle);

    const transformedPoints = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      const scale = 1.2 + 0.3 * Math.cos(angle * 3);
      transformedPoints.push(new THREE.Vector3(x * scale, 0.1, z * scale));
    }
    const transGeom = new THREE.BufferGeometry().setFromPoints(transformedPoints);
    const transMat = new THREE.LineBasicMaterial({ color: 0xff6644, linewidth: 2 });
    const transCircle = new THREE.Line(transGeom, transMat);
    scene.add(transCircle);

    const stepperLabels = ['Vᵀ', 'Σ', 'U'];
    const labelPositions = [new THREE.Vector3(-2.5, 0.3, 0), new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(2.5, 0.3, 0)];

    stepperLabels.forEach((label, i) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 128;
      canvas.height = 64;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, 64, 40);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(labelPositions[i]);
      sprite.scale.set(1, 0.25, 1);
      scene.add(sprite);
    });

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [activeTab]);

  const compressImage = (k) => {
    const size = 32;
    const imgData = [];
    for (let y = 0; y < size; y++) {
      imgData[y] = [];
      for (let x = 0; x < size; x++) {
        const freq = 3;
        const value = 0.5 + 0.3 * Math.sin(x * freq * 0.2) * Math.cos(y * freq * 0.2);
        const noise = 0.1 * Math.sin(x * 10 + y * 7);
        const center = 0.5 + 0.2 * Math.cos(Math.sqrt((x - 16) ** 2 + (y - 16) ** 2) * 0.3);
        imgData[y][x] = (value * 0.5 + center * 0.5 + noise) * 255;
      }
    }
    const mean = imgData.flat().reduce((a, b) => a + b, 0) / (size * size);
    const singularValues = [];
    for (let i = 0; i < size; i++) {
      singularValues.push((size - i) * 8 + Math.random() * 2);
    }
    return { singularValues: singularValues.slice(0, 15) };
  };

  const { singularValues } = useMemo(() => compressImage(rankK), [rankK]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 flex-wrap"
        style={{ backgroundColor: 'var(--color-paper)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'decomposition' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('decomposition')}
          >
            Decomposition
          </Button>
          <Button
            variant={activeTab === 'compression' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('compression')}
          >
            Compression
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRankK(10)}>
            Reset
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Guided Learning Card */}
        <div
          className="px-4 py-2.5 border-b flex-shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(75,150,200,0.06), rgba(75,200,150,0.06))',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-3 max-w-full">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-paper)', fontFamily: 'var(--font-mono)' }}>
                {currentStep + 1}
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                / {steps.length}
              </span>
            </div>
            <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-sm font-bold mb-0.5 truncate" style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}>
                {steps[currentStep].title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {steps[currentStep].concept}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: currentStep > 0 ? 'var(--color-paper-2)' : 'transparent',
                  color: currentStep > 0 ? 'var(--color-ink)' : 'transparent',
                  cursor: currentStep > 0 ? 'pointer' : 'default',
                }}
                disabled={currentStep <= 0}
              >
                ←
              </button>
              <div className="flex items-center gap-1">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: currentStep === i ? '10px' : '5px',
                      height: '5px',
                      backgroundColor: currentStep === i ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: currentStep < steps.length - 1 ? 'var(--color-accent)' : 'transparent',
                  color: currentStep < steps.length - 1 ? 'var(--color-paper)' : 'transparent',
                  cursor: currentStep < steps.length - 1 ? 'pointer' : 'default',
                }}
                disabled={currentStep >= steps.length - 1}
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Main area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'decomposition' && (
              <>
                <div ref={canvasRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '400px', backgroundColor: '#0c0c14' }} />
                <div className="flex justify-center gap-4 mt-4">
                  {[0, 1, 2].map(step => (
                    <button key={step} onClick={() => setCurrentStep(step)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={currentStep === step
                        ? { backgroundColor: ACCENT, color: 'var(--color-paper)' }
                        : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-neutral)' }}>
                      Step {step + 1}: {['Vᵀ Rotation', 'Σ Stretching', 'U Rotation'][step]}
                    </button>
                  ))}
                </div>
              </>
            )}
            {activeTab === 'compression' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm w-20" style={{ color: 'var(--color-neutral)' }}>Rank k:</span>
                  <input type="range" min="1" max="32" value={rankK} onChange={(e) => setRankK(parseInt(e.target.value))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: ACCENT, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-sm w-16 text-right" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>{rankK}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-wrap gap-1">
                    {singularValues.map((sv, i) => (
                      <div key={i} className="w-4 transition-all" style={{ height: `${(sv / Math.max(...singularValues)) * 60}px`, backgroundColor: i < rankK ? ACCENT : 'rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-neutral)' }}>
                    σ₁ ≥ σ₂ ≥ ... — {rankK} values used for approximation
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--color-neutral)' }}>A = U · Σ · Vᵀ</div>
                  <div className="space-y-2 text-xs" style={{ color: 'var(--color-neutral)' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'oklch(52% 0.16 155)' }}>U</span>
                      <span>columns: left singular vectors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'oklch(65% 0.10 70)' }}>Σ</span>
                      <span>diagonal: σ₁ ≥ σ₂ ≥ ...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'oklch(50% 0.12 270)' }}>Vᵀ</span>
                      <span>rows: right singular vectors</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-64 lg:w-72 xl:w-80 flex-shrink-0 min-h-0 overflow-y-auto border-l"
            style={{ backgroundColor: 'var(--color-paper)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="p-3 space-y-3">
              {/* SVD Formula */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em)' }}>
                  SVD Formula
                </div>
                <div className="text-2xl mb-4" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>A = U · Σ · Vᵀ</div>
                <div className="space-y-2 text-xs" style={{ color: 'var(--color-neutral)' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'oklch(52% 0.16 155)' }}>U</span>
                    <span>columns: left singular vectors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'oklch(65% 0.10 70)' }}>Σ</span>
                    <span>diagonal: σ₁ ≥ σ₂ ≥ ...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'oklch(50% 0.12 270)' }}>Vᵀ</span>
                    <span>rows: right singular vectors</span>
                  </div>
                </div>
              </div>

              {/* Learn Steps */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-neutral)', textTransform: 'uppercase', letterSpacing: '0.07em)' }}>
                  Learn SVD
                </div>
                <div className="space-y-2">
                  {steps.map((step, idx) => (
                    <div key={idx} onClick={() => setCurrentStep(idx)} className="p-2 rounded-lg cursor-pointer transition-all"
                      style={currentStep === idx
                        ? { backgroundColor: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.35)` }
                        : { backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={currentStep === idx ? { backgroundColor: ACCENT, color: 'var(--color-paper)' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-neutral)' }}>
                          {idx + 1}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{step.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hint */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(200,155,50,0.08)', border: '1px solid oklch(65% 0.10 70)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'oklch(65% 0.10 70)', textTransform: 'uppercase', letterSpacing: '0.06em)' }}>
                  Hint
                </div>
                <p className="text-xs" style={{ color: 'oklch(65% 0.10 70)' }}>
                  {steps[currentStep].hint}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2 flex items-center justify-center gap-4 border-t flex-shrink-0"
          style={{ backgroundColor: 'var(--color-paper)', borderColor: 'rgba(255,255,255,0.08)', color: 'var(--color-muted)' }}
        >
          <span className="text-xs">Action: {steps[currentStep].action}</span>
          <span>•</span>
          <CompletionToggle moduleId={9} />
        </div>
      </div>
    </div>
  );
}