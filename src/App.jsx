import { useEffect, Suspense, lazy, useState, useCallback } from 'react';
import { useStore } from './store/useStore';
import { Navbar } from './components/Shell/Navbar';
import { Sidebar } from './components/Shell/Sidebar';
import NotationPanel from './components/NotationPanel/NotationPanel';
import ConceptBridgePanel from './components/Shell/ConceptBridge';
import { modules } from './data/modules';

const ModuleComponents = {
  1: lazy(() => import('./modules/01-vectors/VectorsModule')),
  2: lazy(() => import('./modules/02-transformations/TransformationsModule')),
  3: lazy(() => import('./modules/03-matrix-ops/MatrixOpsModule')),
  4: lazy(() => import('./modules/04-determinants/DeterminantsModule')),
  5: lazy(() => import('./modules/05-systems/SystemsModule')),
  6: lazy(() => import('./modules/06-vector-spaces/VectorSpacesModule')),
  7: lazy(() => import('./modules/07-eigenvalues/EigenvaluesModule')),
  8: lazy(() => import('./modules/08-orthogonality/OrthogonalityModule')),
  9: lazy(() => import('./modules/09-svd/SVDModule')),
};

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div
          className="w-12 h-12 mx-auto mb-3 rounded-xl animate-pulse"
          style={{ backgroundColor: 'var(--color-rule)' }}
        />
        <div
          className="h-3 w-28 mx-auto rounded-lg animate-pulse"
          style={{ backgroundColor: 'var(--color-rule)' }}
        />
      </div>
    </div>
  );
}

function ComingSoon({ moduleData }) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-xl flex items-center justify-center text-2xl font-bold"
          style={{
            backgroundColor: moduleData?.color || 'var(--color-accent)',
            color: 'var(--color-paper)',
            fontFamily: 'var(--font-display)',
            boxShadow: 'var(--shadow-accent)',
          }}
        >
          {moduleData?.id}
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-ink)',
            letterSpacing: '-0.012em',
          }}
        >
          {moduleData?.title}
        </h2>
        <p
          className="text-sm mb-5 max-w-xs"
          style={{
            color: 'var(--color-muted)',
            lineHeight: 'var(--lh-relaxed)',
          }}
        >
          {moduleData?.description || 'This module is coming soon.'}
        </p>
        <div
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: 'var(--color-paper-2)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Coming Soon
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { currentModule, darkMode, sidebarCollapsed, setCurrentModule, toggleDarkMode } = useStore();
  const [notationOpen, setNotationOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const currentModuleData = modules.find((m) => m.id === currentModule);
  const ModuleComponent = ModuleComponents[currentModule];

  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      toggleDarkMode();
    }
    if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setNotationOpen(true);
    }
    if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setBridgeOpen(true);
    }
    if (e.key === 'Escape') {
      setNotationOpen(false);
      setBridgeOpen(false);
    }
    if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey) {
      const num = parseInt(e.key);
      if (ModuleComponents[num]) {
        setCurrentModule(num);
      }
    }
  }, [toggleDarkMode, setCurrentModule]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar onOpenNotation={() => setNotationOpen(true)} onOpenBridge={() => setBridgeOpen(true)} />
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ paddingTop: '3.75rem' }}>
        <Sidebar onShowBridge={() => setBridgeOpen(true)} />
        <main className="flex-1 min-h-0 overflow-hidden transition-all duration-300">
          <Suspense fallback={<LoadingState />}>
            {ModuleComponent ? (
              <ModuleComponent />
            ) : (
              <ComingSoon moduleData={currentModuleData} />
            )}
          </Suspense>
        </main>
      </div>
      <NotationPanel isOpen={notationOpen} onClose={() => setNotationOpen(false)} />
      <ConceptBridgePanel isOpen={bridgeOpen} onClose={() => setBridgeOpen(false)} currentModule={currentModule} />
    </div>
  );
}