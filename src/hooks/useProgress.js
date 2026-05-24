import { useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { isModuleUnlocked } from '../data/modules';

const STORAGE_KEY = 'linearvis-progress';

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn('Failed to save progress:', error);
  }
}

export function useProgress() {
  const storeProgress = useStore((state) => state.moduleProgress);
  const updateStoreProgress = useStore((state) => state.updateProgress);
  const markComplete = useStore((state) => state.markModuleComplete);
  const currentModule = useStore((state) => state.currentModule);
  const setCurrentModule = useStore((state) => state.setCurrentModule);

  const [localProgress, setLocalProgress] = useStateWithStorage(
    () => loadProgress() || storeProgress
  );

  useEffect(() => {
    const merged = { ...storeProgress };
    Object.keys(storeProgress).forEach((key) => {
      if (storeProgress[key].completed) {
        merged[key] = storeProgress[key];
      }
    });
    setLocalProgress(merged);
  }, [storeProgress]);

  const isCompleted = useCallback(
    (moduleId) => {
      return localProgress[moduleId]?.completed || false;
    },
    [localProgress]
  );

  const getStepsCompleted = useCallback(
    (moduleId) => {
      return localProgress[moduleId]?.stepsCompleted || 0;
    },
    [localProgress]
  );

  const completeStep = useCallback(
    (moduleId, stepNumber) => {
      const currentSteps = localProgress[moduleId]?.stepsCompleted || 0;
      const newProgress = {
        ...localProgress,
        [moduleId]: {
          ...localProgress[moduleId],
          stepsCompleted: Math.max(currentSteps, stepNumber),
        },
      };
      setLocalProgress(newProgress);
      saveProgress(newProgress);
    },
    [localProgress, setLocalProgress]
  );

  const completeModule = useCallback(
    (moduleId) => {
      const newProgress = {
        ...localProgress,
        [moduleId]: {
          ...localProgress[moduleId],
          completed: true,
          completedAt: Date.now(),
        },
      };
      setLocalProgress(newProgress);
      saveProgress(newProgress);
      markComplete(moduleId);
    },
    [localProgress, setLocalProgress, markComplete]
  );

  const isModuleUnlockedCallback = useCallback(
    (moduleId) => {
      return isModuleUnlocked(moduleId, localProgress);
    },
    [localProgress]
  );

  const getNextUnlockedModule = useCallback(() => {
    for (let i = 1; i <= 9; i++) {
      if (!localProgress[i]?.completed && isModuleUnlockedCallback(i)) {
        return i;
      }
    }
    return null;
  }, [localProgress, isModuleUnlockedCallback]);

  const stats = useMemo(() => {
    const completedCount = Object.values(localProgress).filter(
      (p) => p?.completed
    ).length;
    const totalSteps = Object.values(localProgress).reduce(
      (sum, p) => sum + (p?.stepsCompleted || 0),
      0
    );
    const percentComplete = Math.round((completedCount / 9) * 100);

    return {
      modulesCompleted: completedCount,
      totalModules: 9,
      totalStepsCompleted: totalSteps,
      percentComplete,
    };
  }, [localProgress]);

  return {
    progress: localProgress,
    isCompleted,
    getStepsCompleted,
    completeStep,
    completeModule,
    isModuleUnlocked: isModuleUnlockedCallback,
    getNextUnlockedModule,
    stats,
    currentModule,
    setCurrentModule,
  };
}

function useStateWithStorage(initialValue) {
  const [value, setValue] = React.useState(initialValue);

  const setValueAndSave = React.useCallback(
    (newValue) => {
      setValue(newValue);
      saveProgress(newValue);
    },
    []
  );

  return [value, setValueAndSave];
}

import React from 'react';
export function useProgressSync() {
  const storeProgress = useStore((state) => state.moduleProgress);
  const syncFromStore = useStore((state) => state.updateProgress);
  const currentModule = useStore((state) => state.currentModule);

  const mergeProgress = useCallback(() => {
    const local = loadProgress();
    if (!local) return;

    Object.keys(local).forEach((moduleId) => {
      if (local[moduleId]?.completed) {
        syncFromStore(parseInt(moduleId), local[moduleId]?.stepsCompleted || 0, true);
      }
    });
  }, [syncFromStore]);

  useEffect(() => {
    mergeProgress();
  }, []);

  return {
    mergeProgress,
    storeProgress,
    currentModule,
  };
}