import CanvasWrapper, { useCanvasContext } from './CanvasWrapper';
import Grid2D, { GridOverlay } from './Grid2D';
import Vector2D from './Vector2D';
import Scene3D, { Scene3DOverlay, Scene3DLabel } from './Scene3D';
import Parallelogram from './Parallelogram';
import ParallelogramEdge from './ParallelogramEdge';
import AngleArc from './AngleArc';
import TransformGrid from './TransformGrid';
import MatrixGrid from './MatrixGrid';

export { CanvasWrapper, useCanvasContext, Grid2D, GridOverlay, Vector2D, Scene3D, Scene3DOverlay, Scene3DLabel, Parallelogram, ParallelogramEdge, AngleArc, TransformGrid, MatrixGrid };

export const Canvas = {
  Wrapper: CanvasWrapper,
  Grid: Grid2D,
  GridOverlay: GridOverlay,
  Vector: Vector2D,
  Scene3D: Scene3D,
  Scene3DOverlay: Scene3DOverlay,
  Scene3DLabel: Scene3DLabel,
  Parallelogram: Parallelogram,
  ParallelogramEdge: ParallelogramEdge,
  AngleArc: AngleArc,
  TransformGrid: TransformGrid,
  MatrixGrid: MatrixGrid,
};

export default {
  CanvasWrapper,
  Grid2D,
  Vector2D,
  Scene3D,
  Parallelogram,
  ParallelogramEdge,
  AngleArc,
  TransformGrid,
  MatrixGrid,
};