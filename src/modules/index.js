export { default as VectorsModule } from './01-vectors/VectorsModule';
export { default as TransformationsModule } from './02-transformations/TransformationsModule';
export { default as MatrixOpsModule } from './03-matrix-ops/MatrixOpsModule';
export { default as DeterminantsModule } from './04-determinants/DeterminantsModule';
export { default as SystemsModule } from './05-systems/SystemsModule';
export { default as VectorSpacesModule } from './06-vector-spaces/VectorSpacesModule';
export { default as EigenvaluesModule } from './07-eigenvalues/EigenvaluesModule';
export { default as OrthogonalityModule } from './08-orthogonality/OrthogonalityModule';
export { default as SVDModule } from './09-svd/SVDModule';

export const MODULE_COMPONENTS = {
  1: () => import('./01-vectors/VectorsModule').then(m => ({ default: m.VectorsModule })),
  2: () => import('./02-transformations/TransformationsModule').then(m => ({ default: m.default })),
  3: () => import('./03-matrix-ops/MatrixOpsModule').then(m => ({ default: m.MatrixOpsModule })),
  4: () => import('./04-determinants/DeterminantsModule').then(m => ({ default: m.default })),
  5: () => import('./05-systems/SystemsModule').then(m => ({ default: m.default })),
  6: () => import('./06-vector-spaces/VectorSpacesModule').then(m => ({ default: m.VectorSpacesModule })),
  7: () => import('./07-eigenvalues/EigenvaluesModule').then(m => ({ default: m.default })),
  8: () => import('./08-orthogonality/OrthogonalityModule').then(m => ({ default: m.default })),
  9: () => import('./09-svd/SVDModule').then(m => ({ default: m.default })),
};

export const MODULE_IDS = {
  VECTORS: 1,
  LINEAR_TRANSFORMATIONS: 2,
  MATRIX_OPS: 3,
  DETERMINANTS: 4,
  SYSTEMS: 5,
  VECTOR_SPACES: 6,
  EIGENVALUES: 7,
  ORTHOGONALITY: 8,
  SVD: 9,
};

export function getModuleComponent(moduleId) {
  return MODULE_COMPONENTS[moduleId] || null;
}

export function isModuleAvailable(moduleId) {
  return MODULE_COMPONENTS[moduleId] !== null;
}

export const AVAILABLE_MODULES = Object.keys(MODULE_COMPONENTS).map(id => parseInt(id, 10));

export const MODULE_PROGRESS = {
  1: { name: 'Vectors', color: '#3B82F6', available: true },
  2: { name: 'Linear Transformations', color: '#8B5CF6', available: true },
  3: { name: 'Matrix Operations', color: '#EC4899', available: true },
  4: { name: 'Determinants', color: '#10B981', available: true },
  5: { name: 'Systems of Equations', color: '#F59E0B', available: true },
  6: { name: 'Vector Spaces', color: '#6366F1', available: true },
  7: { name: 'Eigenvalues', color: '#14B8A6', available: true },
  8: { name: 'Orthogonality', color: '#A855F7', available: true },
  9: { name: 'SVD', color: '#EF4444', available: true },
};

export const MODULE_TITLES = {
  1: 'Vectors',
  2: 'Linear Transformations',
  3: 'Matrix Operations',
  4: 'Determinants',
  5: 'Systems of Equations',
  6: 'Vector Spaces & Subspaces',
  7: 'Eigenvalues & Eigenvectors',
  8: 'Orthogonality & Projections',
  9: 'SVD & Applications',
};

export const MODULE_DESCRIPTIONS = {
  1: 'Learn about vectors, magnitude, addition, and dot products through interactive visualization.',
  2: 'Discover how matrices transform space through rotation, scaling, and shear.',
  3: 'Master matrix operations: addition, multiplication, transpose, and inverse.',
  4: 'Understand determinants as area scaling factors with geometric intuition.',
  5: 'Solve systems of equations graphically and through row reduction.',
  6: 'Explore span, linear independence, and subspace concepts.',
  7: 'Find eigenvectors and eigenvalues to understand matrix behavior.',
  8: 'Learn about projections, Gram-Schmidt, and least squares fitting.',
  9: 'Decompose matrices into singular values for compression and analysis.',
};