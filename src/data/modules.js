export const modules = [
  {
    id: 1,
    title: "Vectors",
    description: "Introduction to vectors, operations, and geometric interpretation in 2D and 3D space.",
    icon: "vector",
    color: "#3B82F6",
    prerequisites: [],
    unlockCondition: () => true,
    guidedSteps: [
      {
        id: "v1",
        title: "Create a Vector",
        description: "Define a 2D vector with components (x, y)",
        interactive: "matrix-input",
        inputs: ["x1", "y1"],
        formula: "\\vec{v} = \\begin{pmatrix} x \\\\ y \\end{pmatrix}",
      },
      {
        id: "v2",
        title: "Add Vectors",
        description: "Visualize vector addition geometrically",
        interactive: "dual-matrix-input",
        inputs: ["x1", "y1", "x2", "y2"],
        formula: "\\vec{v} + \\vec{w} = \\begin{pmatrix} v_1 + w_1 \\\\ v_2 + w_2 \\end{pmatrix}",
      },
      {
        id: "v3",
        title: "Scalar Multiplication",
        description: "Scale vectors and observe magnitude changes",
        interactive: "matrix-slider",
        inputs: ["x1", "y1", "scalar"],
        formula: "c\\vec{v} = \\begin{pmatrix} cv_1 \\\\ cv_2 \\end{pmatrix}",
      },
      {
        id: "v4",
        title: "Dot Product",
        description: "Explore angle and projection relationships",
        interactive: "dual-matrix-input",
        inputs: ["x1", "y1", "x2", "y2"],
        formula: "\\vec{v} \\cdot \\vec{w} = |v||w|\\cos\\theta",
      },
    ],
  },
  {
    id: 2,
    title: "Matrices",
    description: "Matrix operations, transformations, and the geometric meaning of matrix multiplication.",
    icon: "matrix",
    color: "#8B5CF6",
    prerequisites: [1],
    unlockCondition: (progress) => progress[1]?.completed,
    guidedSteps: [
      {
        id: "m1",
        title: "Matrix Addition",
        description: "Add two matrices element by element",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "A + B = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}",
      },
      {
        id: "m2",
        title: "Matrix Multiplication",
        description: "See how rows and columns combine",
        interactive: "dual-matrix-input",
        inputs: ["a11", "a12", "a21", "a22", "b11", "b12", "b21", "b22"],
        formula: "[AB]_{ij} = \\sum_{k} a_{ik}b_{kj}",
      },
      {
        id: "m3",
        title: "Transpose",
        description: "Flip rows and columns",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "A^T_{ij} = A_{ji}",
      },
      {
        id: "m4",
        title: "Identity Matrix",
        description: "The multiplicative identity",
        interactive: "constant-display",
        inputs: [],
        formula: "AI = IA = A",
      },
    ],
  },
  {
    id: 3,
    title: "Determinants",
    description: "Calculate determinants and understand their geometric interpretation as area and volume scaling.",
    icon: "determinant",
    color: "#EC4899",
    prerequisites: [2],
    unlockCondition: (progress) => progress[2]?.completed,
    guidedSteps: [
      {
        id: "d1",
        title: "2x2 Determinant",
        description: "Calculate the area of the parallelogram",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc",
      },
      {
        id: "d2",
        title: "Geometric Meaning",
        description: "See how det affects area scaling",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "|\\det(A)| = \\text{area scaling factor}",
      },
      {
        id: "d3",
        title: "Zero Determinant",
        description: "When transformation collapses area",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "\\det(A) = 0 \\Rightarrow \\text{singular}",
      },
      {
        id: "d4",
        title: "Multiplicative Property",
        description: "det(AB) = det(A)det(B)",
        interactive: "dual-matrix-input",
        inputs: ["a11", "a12", "a21", "a22", "b11", "b12", "b21", "b22"],
        formula: "\\det(AB) = \\det(A)\\det(B)",
      },
    ],
  },
  {
    id: 4,
    title: "Inverse Matrices",
    description: "Learn to invert matrices and understand when inverses exist through Gauss-Jordan elimination.",
    icon: "inverse",
    color: "#10B981",
    prerequisites: [3],
    unlockCondition: (progress) => progress[3]?.completed,
    guidedSteps: [
      {
        id: "i1",
        title: "2x2 Inverse Formula",
        description: "Quick formula for 2x2 matrices",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "A^{-1} = \\frac{1}{ad-bc}\\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}",
      },
      {
        id: "i2",
        title: "Gauss-Jordan Method",
        description: "Row reduction to [I|A⁻¹]",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "[A|I] \\rightarrow [I|A^{-1}]",
      },
      {
        id: "i3",
        title: "Verify Inverse",
        description: "Check that AA⁻¹ = I",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "A A^{-1} = I",
      },
      {
        id: "i4",
        title: "Singular Matrices",
        description: "Why some matrices cannot be inverted",
        interactive: "matrix-input",
        inputs: ["a", "b", "c", "d"],
        formula: "\\det(A) = 0 \\Rightarrow A^{-1} \\text{ does not exist}",
      },
    ],
  },
  {
    id: 5,
    title: "Eigenvalues & Eigenvectors",
    description: "Discover the special vectors that don't change direction under transformation.",
    icon: "eigen",
    color: "#F59E0B",
    prerequisites: [4],
    unlockCondition: (progress) => progress[4]?.completed,
    guidedSteps: [
      {
        id: "e1",
        title: "Definition",
        description: "Av = λv - vectors that stay on their span",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "A\\vec{v} = \\lambda\\vec{v}",
      },
      {
        id: "e2",
        title: "Characteristic Polynomial",
        description: "Solve det(A - λI) = 0",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "\\det(A - \\lambda I) = 0",
      },
      {
        id: "e3",
        title: "Compute Eigenvalues",
        description: "Find λ from the characteristic equation",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "\\lambda = \\frac{tr(A) \\pm \\sqrt{tr(A)^2 - 4\\det(A)}}{2}",
      },
      {
        id: "e4",
        title: "Compute Eigenvectors",
        description: "Find v for each eigenvalue",
        interactive: "eigen-vector-display",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "(A - \\lambda I)\\vec{v} = 0",
      },
    ],
  },
  {
    id: 6,
    title: "Linear Transformations",
    description: "Visualize how matrices transform space through rotation, scaling, shear, and reflection.",
    icon: "transform",
    color: "#6366F1",
    prerequisites: [5],
    unlockCondition: (progress) => progress[5]?.completed,
    guidedSteps: [
      {
        id: "t1",
        title: "Rotation",
        description: "Rotate vectors around the origin",
        interactive: "rotation-control",
        inputs: ["angle"],
        formula: "R(\\theta) = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix}",
      },
      {
        id: "t2",
        title: "Scaling",
        description: "Scale in x and y directions",
        interactive: "dual-slider",
        inputs: ["scaleX", "scaleY"],
        formula: "S(s_x, s_y) = \\begin{pmatrix} s_x & 0 \\\\ 0 & s_y \\end{pmatrix}",
      },
      {
        id: "t3",
        title: "Shear",
        description: "Shear parallel to an axis",
        interactive: "slider-input",
        inputs: ["shear"],
        formula: "H(k) = \\begin{pmatrix} 1 & k \\\\ 0 & 1 \\end{pmatrix}",
      },
      {
        id: "t4",
        title: "Reflection",
        description: "Reflect across an axis",
        interactive: "axis-select",
        inputs: ["axis"],
        formula: "R_x = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}",
      },
    ],
  },
  {
    id: 7,
    title: "Projections",
    description: "Project vectors onto lines and subspaces, including orthogonal projections.",
    icon: "projection",
    color: "#14B8A6",
    prerequisites: [6],
    unlockCondition: (progress) => progress[6]?.completed,
    guidedSteps: [
      {
        id: "p1",
        title: "Projection onto Vector",
        description: "Drop perpendicular to find the projection",
        interactive: "dual-matrix-input",
        inputs: ["x1", "y1", "u1", "u2"],
        formula: "proj_{\\vec{u}}\\vec{v} = \\frac{\\vec{v} \\cdot \\vec{u}}{\\vec{u} \\cdot \\vec{u}}\\vec{u}",
      },
      {
        id: "p2",
        title: "Orthogonal Component",
        description: "Find the perpendicular part",
        interactive: "dual-matrix-input",
        inputs: ["x1", "y1", "u1", "u2"],
        formula: "\\vec{v}_\\perp = \\vec{v} - proj_{\\vec{u}}\\vec{v}",
      },
      {
        id: "p3",
        title: "Projection Matrix",
        description: "Matrix that projects any vector",
        interactive: "matrix-input",
        inputs: ["u1", "u2"],
        formula: "P = \\frac{\\vec{u}\\vec{u}^T}{\\vec{u}^T\\vec{u}",
      },
      {
        id: "p4",
        title: "3D Projection",
        description: "Project onto a plane in 3D",
        interactive: "plane-matrix-input",
        inputs: ["n1", "n2", "n3"],
        formula: "P = I - \\frac{\\vec{n}\\vec{n}^T}{\\vec{n}^T\\vec{n}",
      },
    ],
  },
  {
    id: 8,
    title: "Gram-Schmidt",
    description: "Orthogonalize basis vectors to create orthonormal sets using sequential projection.",
    icon: "gram",
    color: "#A855F7",
    prerequisites: [7],
    unlockCondition: (progress) => progress[7]?.completed,
    guidedSteps: [
      {
        id: "g1",
        title: "First Vector",
        description: "Start with the first basis vector",
        interactive: "dual-matrix-input",
        inputs: ["v1_1", "v1_2", "v2_1", "v2_2"],
        formula: "\\vec{u}_1 = \\vec{v}_1",
      },
      {
        id: "g2",
        title: "Subtract Projections",
        description: "Remove components in existing directions",
        interactive: "dual-matrix-input",
        inputs: ["v1_1", "v1_2", "v2_1", "v2_2"],
        formula: "\\vec{u}_2 = \\vec{v}_2 - proj_{\\vec{u}_1}\\vec{v}_2",
      },
      {
        id: "g3",
        title: "Normalize",
        description: "Scale to unit length",
        interactive: "dual-matrix-input",
        inputs: ["v1_1", "v1_2", "v2_1", "v2_2"],
        formula: "\\vec{e}_1 = \\frac{\\vec{u}_1}{\\|\\vec{u}_1\\|}",
      },
      {
        id: "g4",
        title: "Verify Orthogonality",
        description: "Check that dot products are zero",
        interactive: "dual-matrix-input",
        inputs: ["v1_1", "v1_2", "v2_1", "v2_2"],
        formula: "\\vec{e}_1 \\cdot \\vec{e}_2 = 0",
      },
    ],
  },
  {
    id: 9,
    title: "SVD",
    description: "Explore the Singular Value Decomposition for understanding any matrix as rotation, scale, rotation.",
    icon: "svd",
    color: "#EF4444",
    prerequisites: [8],
    unlockCondition: (progress) => progress[8]?.completed,
    guidedSteps: [
      {
        id: "s1",
        title: "SVD Overview",
        description: "A = UΣV^T - the geometry of SVD",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "A = U \\Sigma V^T",
      },
      {
        id: "s2",
        title: "Right Singular Vectors",
        description: "Eigenvectors of A^TA (V)",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "A^TA = V \\Sigma^T \\Sigma V^T",
      },
      {
        id: "s3",
        title: "Singular Values",
        description: "Square roots of eigenvalues of A^TA",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "\\sigma_i = \\sqrt{\\lambda_i(A^TA)}",
      },
      {
        id: "s4",
        title: "Left Singular Vectors",
        description: "Eigenvectors of AA^T (U)",
        interactive: "matrix-input",
        inputs: ["a11", "a12", "a21", "a22"],
        formula: "AA^T = U \\Sigma \\Sigma^T U^T",
      },
    ],
  },
];

export const moduleIndex = modules.reduce((acc, module) => {
  acc[module.id] = module;
  return acc;
}, {});

export function getModuleById(id) {
  return moduleIndex[id] || null;
}

export function getNextModule(currentId) {
  const currentIndex = modules.findIndex((m) => m.id === currentId);
  if (currentIndex === -1 || currentIndex === modules.length - 1) {
    return null;
  }
  return modules[currentIndex + 1];
}

export function getPreviousModule(currentId) {
  const currentIndex = modules.findIndex((m) => m.id === currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return modules[currentIndex - 1];
}

export function isModuleUnlocked(moduleId, progress) {
  const module = moduleIndex[moduleId];
  if (!module) return false;
  return module.unlockCondition(progress);
}