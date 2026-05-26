export function add(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Matrix dimensions must match for addition");
  }
  return A.map((row, i) => row.map((val, j) => val + B[i][j]));
}

export function subtract(A, B) {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Matrix dimensions must match for subtraction");
  }
  return A.map((row, i) => row.map((val, j) => val - B[i][j]));
}

export function multiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;

  if (colsA !== B.length) {
    throw new Error("Matrix dimensions incompatible for multiplication");
  }

  const result = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function scalarMultiply(scalar, A) {
  if (Array.isArray(A) && Array.isArray(A[0])) {
    return A.map(row => row.map(val => val * scalar));
  }
  return A.map(val => val * scalar);
}

export function transpose(A) {
  return A[0].map((_, i) => A.map(row => row[i]));
}

export function det2x2(A) {
  if (A.length !== 2 || A[0].length !== 2) {
    throw new Error("Matrix must be 2x2 for det2x2");
  }
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function det3x3(A) {
  if (A.length !== 3 || A[0].length !== 3) {
    throw new Error("Matrix must be 3x3 for det3x3");
  }
  const [a, b, c] = A[0];
  const [d, e, f] = A[1];
  const [g, h, i] = A[2];

  return (
    a * (e * i - f * h) -
    b * (d * i - f * g) +
    c * (d * h - e * g)
  );
}

export function inverse2x2(A) {
  if (A.length !== 2 || A[0].length !== 2) {
    throw new Error("Matrix must be 2x2 for inverse2x2");
  }

  const det = det2x2(A);
  if (Math.abs(det) < 1e-10) {
    throw new Error("Matrix is singular and cannot be inverted");
  }

  const invDet = 1 / det;
  return [
    [A[1][1] * invDet, -A[0][1] * invDet],
    [-A[1][0] * invDet, A[0][0] * invDet],
  ];
}

export function inverse3x3(A) {
  if (A.length !== 3 || A[0].length !== 3) {
    throw new Error("Matrix must be 3x3 for inverse3x3");
  }

  const n = 3;
  const augmented = A.map((row, i) => {
    const newRow = [...row];
    for (let j = 0; j < n; j++) {
      newRow.push(i === j ? 1 : 0);
    }
    return newRow;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    if (Math.abs(augmented[i][i]) < 1e-10) {
      throw new Error("Matrix is singular and cannot be inverted");
    }

    const pivot = augmented[i][i];
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }

  return augmented.map(row => row.slice(n));
}

export function eigenvalues2x2(A) {
  if (A.length !== 2 || A[0].length !== 2) {
    throw new Error("Matrix must be 2x2 for eigenvalues2x2");
  }

  const a = A[0][0];
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1];

  const trace = a + d;
  const det = a * d - b * c;
  const discriminant = trace * trace - 4 * det;

  if (discriminant < -1e-10) {
    const realPart = trace / 2;
    const imagPart = Math.sqrt(-discriminant) / 2;
    return [
      { re: realPart, im: imagPart, isComplex: true },
      { re: realPart, im: -imagPart, isComplex: true },
    ];
  }

  if (Math.abs(discriminant) < 1e-10) {
    return [{ value: trace / 2, isComplex: false, repeated: true }];
  }

  const sqrtDisc = Math.sqrt(discriminant);
  return [
    { value: (trace + sqrtDisc) / 2, isComplex: false },
    { value: (trace - sqrtDisc) / 2, isComplex: false },
  ];
}

export function eigenvectors2x2(A, lambda) {
  if (A.length !== 2 || A[0].length !== 2) {
    throw new Error("Matrix must be 2x2 for eigenvectors2x2");
  }

  const a = A[0][0];
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1];

  const diff = [
    [a - lambda, b],
    [c, d - lambda],
  ];

  if (Math.abs(diff[0][0]) > 1e-10 || Math.abs(diff[0][1]) > 1e-10) {
    if (Math.abs(diff[0][0]) > Math.abs(diff[0][1])) {
      return [diff[0][0], diff[0][1]];
    } else if (Math.abs(diff[0][1]) > 1e-10) {
      return [-diff[0][1], diff[0][0]];
    }
  }

  if (Math.abs(diff[1][0]) > 1e-10 || Math.abs(diff[1][1]) > 1e-10) {
    if (Math.abs(diff[1][0]) > Math.abs(diff[1][1])) {
      return [diff[1][0], diff[1][1]];
    } else if (Math.abs(diff[1][1]) > 1e-10) {
      return [-diff[1][1], diff[1][0]];
    }
  }

  return [1, 0];
}

export function gramSchmidt(vectors) {
  if (!vectors || vectors.length === 0) return [];

  const n = vectors.length;
  const m = vectors[0].length;
  const orthogonal = [];

  for (let i = 0; i < n; i++) {
    let u = [...vectors[i]];

    for (let j = 0; j < i; j++) {
      const proj = projectOnto(vectors[i], orthogonal[j]);
      u = u.map((val, k) => val - proj[k]);
    }

    const mag = magnitude(u);
    if (mag > 1e-10) {
      orthogonal.push(u.map(v => v / mag));
    } else {
      orthogonal.push(u);
    }
  }

  return orthogonal;
}

export function projectOnto(b, u) {
  const dot = dotProduct(b, u);
  const magSq = magnitude(u) ** 2;

  if (Math.abs(magSq) < 1e-10) {
    return u.map(() => 0);
  }

  const scalar = dot / magSq;
  return u.map(v => v * scalar);
}

export function svd2x2(A) {
  const a = A[0][0];
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1];

  const ATA = [
    [a * a + c * c, a * b + c * d],
    [a * b + c * d, b * b + d * d],
  ];

  const trace = ATA[0][0] + ATA[1][1];
  const det = ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0];
  const discriminant = trace * trace - 4 * det;

  if (discriminant < 0) {
    const eval1 = trace / 2;
    const eval2 = trace / 2;
    return {
      sigma: [Math.sqrt(Math.abs(eval1)), Math.sqrt(Math.abs(eval2))],
      U: [[1, 0], [0, 1]],
      V: [[1, 0], [0, 1]],
    };
  }

  const sqrtDisc = Math.sqrt(discriminant);
  const sigma1 = Math.sqrt((trace + sqrtDisc) / 2);
  const sigma2 = Math.sqrt(Math.max(0, (trace - sqrtDisc) / 2));

  let v1x, v1y;
  if (Math.abs(ATA[0][1]) > 1e-10) {
    v1x = ATA[0][1];
    v1y = (trace + sqrtDisc) / 2 - ATA[0][0];
  } else {
    v1x = 1;
    v1y = 0;
  }

  const len = Math.sqrt(v1x * v1x + v1y * v1y);
  v1x /= len;
  v1y /= len;

  const v2x = -v1y;
  const v2y = v1x;

  let u1x = v1x * a + v1y * b;
  let u1y = v1x * c + v1y * d;
  const u1Len = Math.sqrt(u1x * u1x + u1y * u1y);

  if (u1Len > 1e-10) {
    u1x /= u1Len;
    u1y /= u1Len;
  } else {
    u1x = 1;
    u1y = 0;
  }

  const u2x = -u1y;
  const u2y = u1x;

  return {
    sigma: [sigma1, sigma2],
    U: [[u1x, u2x], [u1y, u2y]],
    V: [[v1x, v2x], [v1y, v2y]],
  };
}

export function dotProduct(u, v) {
  if (u.length !== v.length) {
    throw new Error("Vectors must have the same dimension");
  }
  return u.reduce((sum, val, i) => sum + val * v[i], 0);
}

export function magnitude(v) {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

export function normalize(v) {
  const mag = magnitude(v);
  if (mag < 1e-10) {
    return v.map(() => 0);
  }
  return v.map(val => val / mag);
}

export function angleBetween(u, v) {
  const dot = dotProduct(u, v);
  const magU = magnitude(u);
  const magV = magnitude(v);

  if (magU < 1e-10 || magV < 1e-10) {
    return 0;
  }

  const cosAngle = Math.max(-1, Math.min(1, dot / (magU * magV)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

export function matrixToVector(M) {
  const rows = M.length;
  const cols = M[0].length;
  const vector = [];

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      vector.push(M[i][j]);
    }
  }

  return vector;
}

export function vectorToMatrix(v, rows, cols) {
  if (v.length !== rows * cols) {
    throw new Error(`Vector length ${v.length} doesn't match dimensions ${rows}x${cols}`);
  }

  const M = [];
  for (let i = 0; i < rows; i++) {
    M[i] = [];
    for (let j = 0; j < cols; j++) {
      M[i][j] = v[i * cols + j];
    }
  }
  return M;
}

export function identity(n) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
}

export function zeros(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0)
  );
}

export function createRotation2D(angle) {
  const rad = angle * Math.PI / 180;
  return [
    [Math.cos(rad), -Math.sin(rad)],
    [Math.sin(rad), Math.cos(rad)],
  ];
}

export function createRotation3D(axis, angle) {
  const rad = angle * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const t = 1 - c;

  if (axis === 'x') {
    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ];
  } else if (axis === 'y') {
    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ];
  } else {
    return [
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ];
  }
}

export function crossProduct(u, v) {
  if (u.length !== 3 || v.length !== 3) {
    throw new Error("Cross product requires 3D vectors");
  }
  return [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
}

// --- Transformation Matrix Generators ---
export function identityMatrix() {
  return [[1, 0], [0, 1]];
}

export function rotationMatrix(angleDeg) {
  const rad = angleDeg * Math.PI / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [
    [c, -s],
    [s, c],
  ];
}

export function scaleMatrix(sx, sy) {
  return [
    [sx, 0],
    [0, sy],
  ];
}

export function shearMatrix(kx, ky = 0) {
  return [
    [1, kx],
    [ky, 1],
  ];
}

export function reflectMatrix(axis) {
  switch (axis) {
    case 'x':
      return [[1, 0], [0, -1]];
    case 'y':
      return [[-1, 0], [0, 1]];
    case 'origin':
      return [[-1, 0], [0, -1]];
    case 'y=x':
      return [[0, 1], [1, 0]];
    case 'y=-x':
      return [[0, -1], [-1, 0]];
    default:
      return identityMatrix();
  }
}

// --- Transformation Application ---
export function applyMatrix(M, v) {
  const [a, b] = M[0];
  const [c, d] = M[1];
  const [x, y] = v;
  return [a * x + b * y, c * x + d * y];
}

export function transformPoint(M, p) {
  return applyMatrix(M, p);
}

export function isInvertible(M) {
  return Math.abs(det2x2(M)) > 1e-10;
}

export function composeTransforms(A, B) {
  return multiply(A, B);
}

// --- Matrix Operations ---
export function matSubtract(A, B) {
  return subtract(A, B);
}

export function matMultiplyVec(M, v) {
  return applyMatrix(M, v);
}

export function traceMatrix(M) {
  return M[0][0] + M[1][1];
}

export function adjugate2x2(M) {
  return [
    [M[1][1], -M[0][1]],
    [-M[1][0], M[0][0]],
  ];
}

// --- Row Reduction (Gauss-Jordan) ---
export function rowReduce(augmented) {
  const steps = [];
  const n = augmented.length;
  const m = augmented[0].length;
  
  let matrix = augmented.map(row => [...row]);
  
  const copyMatrix = (m) => m.map(row => [...row]);
  
  const formatOp = (type, details) => {
    switch (type) {
      case 'swap':
        return `Swap R${details.i + 1} ↔ R${details.j + 1}`;
      case 'scale':
        return `R${details.i + 1} → ${details.factor.toFixed(2)} · R${details.i + 1}`;
      case 'add':
        return `R${details.i + 1} → R${details.i + 1} + ${details.factor.toFixed(2)} · R${details.j + 1}`;
      default:
        return '';
    }
  };

  let pivotRow = 0;
  let pivotCol = 0;
  
  while (pivotRow < n && pivotCol < m - n) {
    let maxRow = pivotRow;
    for (let i = pivotRow + 1; i < n; i++) {
      if (Math.abs(matrix[i][pivotCol]) > Math.abs(matrix[maxRow][pivotCol])) {
        maxRow = i;
      }
    }
    
    if (Math.abs(matrix[maxRow][pivotCol]) < 1e-10) {
      pivotCol++;
      continue;
    }
    
    if (maxRow !== pivotRow) {
      [matrix[pivotRow], matrix[maxRow]] = [matrix[maxRow], matrix[pivotRow]];
      steps.push({
        matrix: copyMatrix(matrix),
        operation: formatOp('swap', { i: pivotRow, j: maxRow }),
      });
    }
    
    const pivot = matrix[pivotRow][pivotCol];
    if (Math.abs(pivot - 1) > 1e-10) {
      for (let j = pivotCol; j < m; j++) {
        matrix[pivotRow][j] /= pivot;
      }
      steps.push({
        matrix: copyMatrix(matrix),
        operation: formatOp('scale', { i: pivotRow, factor: 1 / pivot }),
      });
    }
    
    for (let i = 0; i < n; i++) {
      if (i !== pivotRow && Math.abs(matrix[i][pivotCol]) > 1e-10) {
        const factor = matrix[i][pivotCol];
        for (let j = pivotCol; j < m; j++) {
          matrix[i][j] -= factor * matrix[pivotRow][j];
        }
        steps.push({
          matrix: copyMatrix(matrix),
          operation: formatOp('add', { i: i, j: pivotRow, factor: -factor }),
        });
      }
    }
    
    pivotRow++;
    pivotCol++;
  }
  
  return { steps, result: matrix };
}

// --- Test Functions ---
/*
console.assert(JSON.stringify(identityMatrix()) === '[[1,0],[0,1]]', 'identityMatrix test failed');
console.assert(Math.abs(rotationMatrix(90)[0][0]) < 1e-10, 'rotationMatrix cos test failed');
console.assert(Math.abs(rotationMatrix(90)[0][1] + 1) < 1e-10, 'rotationMatrix sin test failed');
console.assert(rotationMatrix(0)[0][0] === 1, 'rotationMatrix 0 deg test failed');

console.assert(JSON.stringify(scaleMatrix(2, 3)) === '[[2,0],[0,3]]', 'scaleMatrix test failed');
console.assert(JSON.stringify(shearMatrix(1)) === '[[1,1],[0,1]]', 'shearMatrix test failed');
console.assert(JSON.stringify(shearMatrix(1, 2)) === '[[1,1],[2,1]]', 'shearMatrix with ky test failed');

console.assert(JSON.stringify(reflectMatrix('x')) === '[[1,0],[0,-1]]', 'reflectMatrix x failed');
console.assert(JSON.stringify(reflectMatrix('y')) === '[[-1,0],[0,1]]', 'reflectMatrix y failed');
console.assert(JSON.stringify(reflectMatrix('y=x')) === '[[0,1],[1,0]]', 'reflectMatrix y=x failed');

console.assert(JSON.stringify(applyMatrix([[1, 2], [3, 4]], [1, 1])) === '[3,7]', 'applyMatrix test failed');
console.assert(JSON.stringify(transformPoint([[1, 2], [3, 4]], [1, 1])) === '[3,7]', 'transformPoint test failed');
console.assert(isInvertible([[1, 2], [3, 4]]) === true, 'isInvertible true test failed');
console.assert(isInvertible([[1, 1], [2, 2]]) === false, 'isInvertible false test failed');

const composed = composeTransforms([[2, 0], [0, 2]], [[1, 1], [0, 1]]);
console.assert(composed[0][0] === 2, 'composeTransforms test failed');
console.assert(composed[0][1] === 2, 'composeTransforms test failed');

console.assert(traceMatrix([[1, 2], [3, 4]]) === 5, 'traceMatrix test failed');
console.assert(JSON.stringify(adjugate2x2([[1, 2], [3, 4]])) === '[[4,-2],[-3,1]]', 'adjugate2x2 test failed');

const augmented = [[1, 1, 1, 0], [2, 3, 0, 1]];
const gaussResult = rowReduce(augmented);
console.assert(gaussResult.steps.length > 0, 'rowReduce steps test failed');
console.assert(gaussResult.result.length === 2, 'rowReduce result test failed');
*/