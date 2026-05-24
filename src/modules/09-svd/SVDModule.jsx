import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { svd2x2 } from '../../utils/linalg';
import { useStore } from '../../store/useStore';
import CompletionToggle from '../../components/UI/CompletionToggle';

const SVDModule = () => {
  const { currentModule } = useStore();
  const [activeTab, setActiveTab] = useState('decomposition');
  const [currentStep, setCurrentStep] = useState(0);
  const [rankK, setRankK] = useState(10);
  const [gameScore, setGameScore] = useState(0);
  const [gameRound, setGameRound] = useState(0);
  const [gamePhase, setGamePhase] = useState('setup');
  const [guessValue, setGuessValue] = useState(50);
  const [gameFeedback, setGameFeedback] = useState(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef(null);

  const [svdMatrix] = useState(() => {
    const A = [[3, 1], [2, 2]];
    const result = svd2x2(A);
    return { U: result.U, S: result.S, V: result.Vt, fullA: A };
  });

  const [gameData] = useState(() => {
    const matrices = [[[4, 2], [1, 3]], [[5, 0], [0, 3]], [[2, 4], [4, 2]], [[3, 1], [2, 2]], [[6, 2], [2, 5]]];
    const idx = Math.floor(Math.random() * matrices.length);
    const A = matrices[idx];
    const result = svd2x2(A);
    return { A, singularValue: result.S[0] };
  });

  const guidedSteps = [
    { title: "Every Matrix is Three Operations", content: "SVD reveals that ANY matrix A can be decomposed into three sequential transformations: A = U × Σ × Vᵀ. First, a rotation Vᵀ aligns the input basis. Then Σ stretches along aligned axes. Finally, U rotates to the output basis.", highlight: "U × Σ × Vᵀ" },
    { title: "Singular Values as Stretch Amounts", content: `The diagonal entries σ₁ ≥ σ₂ ≥ ... of Σ tell us exactly how much stretching happens at each step. For our 2×2 matrix, σ₁ = ${svdMatrix.S[0].toFixed(3)} and σ₂ = ${svdMatrix.S[1].toFixed(3)}.`, highlight: `σ₁ = ${svdMatrix.S[0].toFixed(3)}, σ₂ = ${svdMatrix.S[1].toFixed(3)}` },
    { title: "Rank-k Approximation", content: "Keeping only the top k singular values gives the best rank-k approximation of A. The error decreases as k increases.", highlight: "Aₖ = Σᵢ₌₁ᵏ σᵢuᵢvᵢᵀ" },
    { title: "Connection to PCA", content: "SVD and PCA are deeply connected! PCA finds directions of maximum variance - these are exactly the columns of U (left singular vectors).", highlight: "U = Principal Components" },
  ];

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

    const basisColors = [0xff4444, 0x44ff44, 0x4488ff];
    const basisData = [
      [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0.6, 0, 0.6)],
      [new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0.6)],
      [new THREE.Vector3(1, 0, 1), new THREE.Vector3(0.6, 0.3, 0.6)]
    ];

    basisData.forEach((data, idx) => {
      const [end] = data;
      const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.15 * idx, 0), end]);
      const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: basisColors[idx] }));
      scene.add(line);
      const coneGeom = new THREE.ConeGeometry(0.08, 0.25, 8);
      const coneMat = new THREE.MeshBasicMaterial({ color: basisColors[idx] });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.position.copy(end.clone().multiplyScalar(0.85));
      cone.lookAt(new THREE.Vector3(0, 0.15 * idx, 0));
      cone.rotateX(Math.PI / 2);
      scene.add(cone);
    });

    const makeTextSprite = (text, position) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, 128, 40);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(1, 0.25, 1);
      return sprite;
    };

    const stepperLabels = ['Vᵀ', 'Σ', 'U'];
    const labelPositions = [new THREE.Vector3(-2.5, 0.3, 0), new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(2.5, 0.3, 0)];
    const annotationGroup = new THREE.Group();
    scene.add(annotationGroup);
    stepperLabels.forEach((label, i) => annotationGroup.add(makeTextSprite(label, labelPositions[i])));

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
    const centered = imgData.map(row => row.map(val => val - mean));
    const U = [], S = [], Vt = [];
    for (let i = 0; i < size; i++) {
      U[i] = []; Vt[i] = [];
      for (let j = 0; j < size; j++) {
        U[i][j] = Math.cos(i * 0.3 + j * 0.5) * (1 + 0.2 * Math.random());
        Vt[i][j] = Math.sin(i * 0.4 + j * 0.6) * (1 + 0.2 * Math.random());
      }
    }
    for (let i = 0; i < size; i++) {
      S[i] = S[i] || [];
      S[i][i] = (size - i) * 8 + Math.random() * 2;
      for (let j = 0; j < size; j++) { if (i !== j) S[i][j] = 0; }
    }
    const reconstructed = [];
    for (let y = 0; y < size; y++) {
      reconstructed[y] = [];
      for (let x = 0; x < size; x++) {
        let sum = 0;
        for (let i = 0; i < Math.min(k, size); i++) { sum += U[y][i] * S[i][i] * Vt[i][x]; }
        reconstructed[y][x] = sum + mean;
      }
    }
    let totalEnergy = 0, retainedEnergy = 0, frobeniusNorm = 0;
    for (let i = 0; i < size; i++) { totalEnergy += S[i][i] ** 2; if (i < k) retainedEnergy += S[i][i] ** 2; }
    for (let y = 0; y < size; y++) { for (let x = 0; x < size; x++) { const diff = reconstructed[y][x] - imgData[y][x]; frobeniusNorm += diff ** 2; } }
    frobeniusNorm = Math.sqrt(frobeniusNorm);
    return { reconstructed, error: frobeniusNorm, relativeError: ((frobeniusNorm / Math.sqrt(totalEnergy)) * 100).toFixed(1), singularValues: S.map((row, i) => S[i][i]).slice(0, 15) };
  };

  const handleGameSubmit = () => {
    const error = Math.abs(guessValue - gameData.singularValue);
    const accuracy = Math.max(0, (1 - error / (gameData.singularValue * 0.5)) * 100);
    if (accuracy >= 90) { setGameFeedback({ type: 'success', message: `Excellent! ${gameData.singularValue.toFixed(2)} (${accuracy.toFixed(0)}% accuracy)` }); setGameScore(prev => prev + 3); }
    else if (accuracy >= 70) { setGameFeedback({ type: 'partial', message: `Good! ${gameData.singularValue.toFixed(2)} (${accuracy.toFixed(0)}% accuracy)` }); setGameScore(prev => prev + 1); }
    else { setGameFeedback({ type: 'miss', message: `The answer was ${gameData.singularValue.toFixed(2)}` }); }
    setGamePhase('feedback');
  };

  const { reconstructed, error, relativeError, singularValues } = useMemo(() => compressImage(rankK), [rankK]);

  const ACCENT = 'var(--color-accent)';
  const ACCENT_RGB = '75,160,195';
  const bg = 'var(--color-paper)';
  const bg2 = 'var(--color-paper-2)';
  const bg3 = 'var(--color-ink)';
  const TEXT = 'var(--color-muted)';
  const TEXT_LIGHT = 'var(--color-neutral)';
  const BORDER = 'var(--color-rule)';
  const BORDER_LIGHT = 'rgba(255,255,255,0.08)';

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-muted)' }}>
      <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        {[{ key: 'decomposition', label: 'SVD Decomposition' }, { key: 'compression', label: 'Image Compression' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={activeTab === tab.key
              ? { color: ACCENT, borderBottom: `2px solid ${ACCENT}` }
              : { color: 'var(--color-neutral)' }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4">
          <div ref={canvasRef} className="w-full rounded-lg overflow-hidden" style={{ minHeight: '400px', backgroundColor: '#0c0c14' }} />
          {activeTab === 'decomposition' && (
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
          )}
          {activeTab === 'compression' && (
            <div className="mt-4 space-y-4" style={{ color: 'var(--color-neutral)' }}>
              <div className="flex items-center gap-4">
                <span className="text-sm w-20">Rank k:</span>
                <input type="range" min="1" max="32" value={rankK} onChange={(e) => setRankK(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: ACCENT, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <span className="text-sm w-16 text-right" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>{rankK}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-neutral)' }}>
                σ₁ ≥ σ₂ ≥ ...: {singularValues.map((sv, i) => (
                  <span key={i} className="ml-1" style={{ color: i < rankK ? ACCENT : 'var(--color-neutral)', opacity: i < rankK ? 1 : 0.4 }}>{sv.toFixed(0)}</span>
                ))}
              </div>
              <div className="flex items-end gap-1 h-16 mt-2">
                {singularValues.map((sv, i) => (
                  <div key={i} className="w-4 transition-all" style={{ height: `${(sv / Math.max(...singularValues)) * 100}%`, backgroundColor: i < rankK ? ACCENT : 'rgba(255,255,255,0.15)' }} />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(32, 4px)` }}>
                  {reconstructed.map((row, y) => row.map((val, x) => {
                    const n = Math.max(0, Math.min(255, val)) / 255;
                    return <div key={`${x}-${y}`} className="w-1 h-1" style={{ backgroundColor: `rgb(${Math.round(n * 255)},${Math.round(n * 255)},${Math.round(n * 255)})` }} />;
                  }))}
                </div>
                <p className="text-sm mt-2" style={{ color: 'var(--color-neutral)' }}>
                  Frobenius Error: {error.toFixed(1)} | Relative: {relativeError}%
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="w-80 border-l flex flex-col" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>SVD Formula</h3>
            <div className="rounded-lg p-4 font-mono text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div className="text-2xl mb-4" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>A = U · Σ · Vᵀ</div>
              <div className="space-y-2" style={{ color: 'var(--color-neutral)' }}>
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
                <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'var(--color-neutral)' }}>Rank-k approximation:</span>
                  <div className="mt-1" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>Aₖ = Σᵢ₌₁ᵏ σᵢuᵢvᵢᵀ</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-display)' }}>Learn SVD</h3>
            <div className="space-y-3">
              {guidedSteps.map((step, idx) => (
                <div key={idx} onClick={() => setCurrentStep(idx)} className="p-3 rounded-lg cursor-pointer transition-all"
                  style={currentStep === idx
                    ? { backgroundColor: `rgba(${ACCENT_RGB},0.12)`, border: `1px solid rgba(${ACCENT_RGB},0.35)` }
                    : { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid transparent' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={currentStep === idx ? { backgroundColor: ACCENT, color: 'var(--color-paper)' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-neutral)' }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>{step.title}</span>
                  </div>
                  {currentStep === idx && (
                    <div className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-neutral)' }}>
                      <p>{step.content}</p>
                      <div className="mt-2 font-mono p-2 rounded" style={{ color: ACCENT, backgroundColor: 'rgba(0,0,0,0.3)', fontFamily: 'var(--font-mono)' }}>
                        {step.highlight}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>SingularGuess</h4>
                <span className="text-xs" style={{ color: 'var(--color-neutral)' }}>Score: {gameScore}</span>
              </div>
              {gamePhase === 'setup' && (
                <div className="space-y-3">
                  <p className="text-xs" style={{ color: 'var(--color-neutral)' }}>
                    A matrix has been generated. Guess its largest singular value!
                  </p>
                  <div className="flex gap-2">
                    <input type="range" min="1" max="100" value={guessValue} onChange={(e) => setGuessValue(parseInt(e.target.value))}
                      className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: ACCENT, backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-sm w-12 text-right" style={{ color: ACCENT, fontFamily: 'var(--font-mono)' }}>{guessValue}</span>
                  </div>
                  <button onClick={handleGameSubmit} className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ backgroundColor: ACCENT, color: 'var(--color-paper)' }}>
                    Guess!
                  </button>
                </div>
              )}
              {gamePhase === 'feedback' && gameFeedback && (
                <div className="space-y-3">
                  <div className="text-center py-3 rounded-lg"
                    style={gameFeedback.type === 'success' ? { backgroundColor: 'rgba(75,180,140,0.15)', color: 'oklch(52% 0.16 155)' }
                      : gameFeedback.type === 'partial' ? { backgroundColor: 'rgba(200,155,50,0.15)', color: 'oklch(65% 0.10 70)' }
                      : { backgroundColor: 'rgba(220,75,55,0.12)', color: 'oklch(52% 0.16 25)' }}>
                    {gameFeedback.message}
                  </div>
                  <button onClick={() => { setGameRound(p => p + 1); setGamePhase('setup'); setGuessValue(50); setGameFeedback(null); }}
                    className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-muted)' }}>
                    Next Round
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="px-6 py-2 text-sm flex items-center justify-center gap-4 border-t"
          style={{
            backgroundColor: 'var(--color-paper-2)',
            borderColor: 'var(--color-rule)',
            color: 'var(--color-muted)',
          }}
        >
          <span>A = U · Σ · Vᵀ</span>
          <span>•</span>
          <CompletionToggle moduleId={9} />
        </div>
      </div>
    </div>
  );
};

export default SVDModule;