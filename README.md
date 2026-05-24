# 📐 LinearViz — Premium Interactive Linear Algebra Visualizer

LinearViz is a high-fidelity, interactive, and visually stunning web application designed to help students, educators, and researchers build a deep, intuitive geometric understanding of Linear Algebra. 

Rather than treating linear algebra as dry algebraic formulas and symbol-pushing, LinearViz bridges the gap between numbers and space—allowing users to touch, drag, transform, and decompose mathematical objects in real time.

---

## 🌟 Features Overview

LinearViz consists of **9 highly specialized interactive modules** covering fundamental and advanced topics in linear algebra:

1. **Vectors Module**:
   - **Dynamic Manipulation**: Drag vector tips in real-time on a coordinate grid.
   - **Flexible Operations Selector**: Choose any two vectors to perform addition ($\Sigma$), calculate their dot product ($a \cdot b$), or show the angle ($\theta$) between them.
   - **Geometric Parallelogram**: Automatic tip-to-tail parallelogram visualizer to illustrate geometric vector addition.
   - **Guided Learning Journey**: Step-by-step interactive card deck guiding beginners through the core concepts.

2. **Matrix Operations**:
   - Visualizing matrix-vector and matrix-matrix multiplication.
   - Step-by-step arithmetic grids showing dot product alignments and dimensions.
   - Visual transpose and property checkers.

3. **Linear Transformations**:
   - Apply arbitrary $2 \times 2$ matrices $A$ to standard shapes (grid, circle, house).
   - Dynamic animations of shear, rotation, scaling, and reflection.
   - Real-time coordinates tracking.

4. **Determinants**:
   - Watch the unit area scale, flip, or collapse as you adjust matrix columns.
   - Clear visual representation of negative orientation and zero-area singularity.

5. **Linear Systems**:
   - Visualize system equations ($Ax = b$) as intersecting lines in a 2D plane.
   - Interactive sliders to shift variables and watch the system move to consistency or inconsistency.

6. **Vector Spaces**:
   - Explore concepts of **span**, **basis**, and **linear independence**.
   - Watch the span collapse from $\mathbb{R}^2$ to a 1D line or 0D point as basis vectors become collinear.

7. **Orthogonality & Gram-Schmidt**:
   - Interactive projection of one vector onto another.
   - Step-by-step orthogonalization animation (making a basis mutually perpendicular).

8. **Eigenvalues & Eigenvectors**:
   - Drag test vectors to see if they maintain their span under matrix transformation.
   - Real-time trace of the characteristic equation and dynamic eigenvalue scaling.

9. **SVD (Singular Value Decomposition)**:
   - Deep three-stage visual breakdown of $A = U \Sigma V^T$.
   - Interactive representation of rotation ($V^T$), scaling ($\Sigma$), and second rotation ($U$).

---

## 🎨 Design Philosophy

LinearViz is built around the modern **Plume Design System**:
- **Palette**: Sleek neutral paper backgrounds with vibrant, carefully tuned OKLCH color accents (avoiding harsh primaries).
- **Responsive Layout**: Fluid flex panels, adaptable sidebar drawers, and automatic layout scaling utilizing high-performance `ResizeObserver`.
- **Aesthetic Math**: Typeset formulas using high-speed KaTeX integration.
- **Dynamic Feedback**: Micro-interactions, custom transition systems, and rich dark/light adaptive elements.

---

## 🚀 Getting Started

Follow these steps to run LinearViz locally on your computer:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Clone & Navigate
```bash
git clone https://github.com/your-username/LinearVis.git
cd LinearVis
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to the address shown in your console (usually `http://localhost:5173`).

### 4. Build for Production
```bash
npm run build
```
This produces a highly compressed, minified, and optimized distribution folder (`dist/`) ready for web deployment.

---

## 🔒 License & Terms of Use

LinearViz is distributed under a **strictly non-commercial, educational license**:

- **Allowed**:
  - ✅ Using LinearViz for personal study, academic research, and learning.
  - ✅ Utilizing it in classrooms, lecture halls, and virtual courses to teach linear algebra.
  - ✅ Forking, modifying, and hosting personal clones for individual study or classroom demonstrations.
- **Prohibited**:
  - ❌ **Commercial Use**: You may not sell, rent, lease, license, or monetize the software, its build artifacts, or its derivative works.
  - ❌ **Paid Courses**: You may not bundle this code inside paid online courses, books, or subscription-based educational programs.
  - ❌ **Ad-Monetization**: Hosting the visualizer on an ad-supported domain or charging fees for access is strictly prohibited.

---

## 📬 Contributing & Reporting Issues

Your feedback is highly valued! If you find a bug, encounter a layout mismatch, or have an idea for an interactive module, feel free to get in touch:

1. **Check Existing Issues**: Check active issues to see if it's already being addressed.
2. **Open an Issue**: Clearly describe the bug, document the steps to reproduce it, and attach screenshots or console logs if applicable.
3. **Submit a Pull Request**: If you are a developer looking to fix layout or math bugs, pull requests matching our design system tokens are welcome.
