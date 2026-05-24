import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      currentModule: 1,
      moduleProgress: {
        1: { completed: false, stepsCompleted: 0 },
        2: { completed: false, stepsCompleted: 0 },
        3: { completed: false, stepsCompleted: 0 },
        4: { completed: false, stepsCompleted: 0 },
        5: { completed: false, stepsCompleted: 0 },
        6: { completed: false, stepsCompleted: 0 },
        7: { completed: false, stepsCompleted: 0 },
        8: { completed: false, stepsCompleted: 0 },
        9: { completed: false, stepsCompleted: 0 },
      },
      unlockedModules: { 1: true, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false, 9: false },
      guidedMode: true,
      darkMode: true,
      sidebarCollapsed: false,
      highlightEvents: [],

      setCurrentModule: (moduleNumber) => {
        if (moduleNumber >= 1 && moduleNumber <= 9) {
          const { unlockedModules, moduleProgress, currentModule } = get();
          if (unlockedModules[moduleNumber]) {
            set({ currentModule: moduleNumber });
          } else if (moduleNumber === 1) {
            set({ currentModule: 1 });
          }
        }
      },

      unlockNextModule: () => {
        const { currentModule, unlockedModules } = get();
        const nextModule = currentModule + 1;
        if (nextModule <= 9 && !unlockedModules[nextModule]) {
          set({
            unlockedModules: {
              ...unlockedModules,
              [nextModule]: true,
            },
          });
        }
      },

      isModuleUnlocked: (moduleNumber) => {
        const { unlockedModules } = get();
        return unlockedModules[moduleNumber] || false;
      },

      getUnlockedCount: () => {
        const { unlockedModules } = get();
        return Object.values(unlockedModules).filter(Boolean).length;
      },

      toggleGuidedMode: () => {
        set((state) => ({ guidedMode: !state.guidedMode }));
      },

      setGuidedMode: (mode) => {
        set({ guidedMode: mode });
      },

      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      setDarkMode: (mode) => {
        set({ darkMode: mode });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      updateProgress: (moduleId, stepsCompleted, completed = false) => {
        set((state) => ({
          moduleProgress: {
            ...state.moduleProgress,
            [moduleId]: {
              completed: completed || state.moduleProgress[moduleId]?.completed || false,
              stepsCompleted: Math.max(
                state.moduleProgress[moduleId]?.stepsCompleted || 0,
                stepsCompleted
              ),
            },
          },
        }));
      },

      markModuleComplete: (moduleId) => {
        set((state) => ({
          moduleProgress: {
            ...state.moduleProgress,
            [moduleId]: {
              ...state.moduleProgress[moduleId],
              completed: true,
            },
          },
          unlockedModules: {
            ...state.unlockedModules,
            [moduleId + 1]: moduleId + 1 <= 9 ? true : state.unlockedModules[moduleId + 1],
          },
        }));
      },

      markModuleIncomplete: (moduleId) => {
        set((state) => ({
          moduleProgress: {
            ...state.moduleProgress,
            [moduleId]: {
              ...state.moduleProgress[moduleId],
              completed: false,
            },
          },
        }));
      },

      completeCurrentModule: () => {
        const { currentModule } = get();
        if (currentModule < 9) {
          set((state) => ({
            moduleProgress: {
              ...state.moduleProgress,
              [currentModule]: {
                ...state.moduleProgress[currentModule],
                completed: true,
              },
            },
            unlockedModules: {
              ...state.unlockedModules,
              [currentModule + 1]: true,
            },
          }));
        } else {
          set((state) => ({
            moduleProgress: {
              ...state.moduleProgress,
              [currentModule]: {
                ...state.moduleProgress[currentModule],
                completed: true,
              },
            },
          }));
        }
      },

      emitHighlight: (event) => {
        const timestamp = Date.now();
        const highlightEvent = { ...event, timestamp, id: `${timestamp}-${Math.random()}` };

        set((state) => ({
          highlightEvents: [
            ...state.highlightEvents.slice(-19),
            highlightEvent,
          ],
        }));
      },

      clearHighlights: () => {
        set({ highlightEvents: [] });
      },

      removeHighlight: (eventId) => {
        set((state) => ({
          highlightEvents: state.highlightEvents.filter((e) => e.id !== eventId),
        }));
      },

      getProgress: () => {
        const { moduleProgress } = get();
        const completedCount = Object.values(moduleProgress).filter((p) => p.completed).length;
        const totalSteps = Object.values(moduleProgress).reduce(
          (sum, p) => sum + (p.stepsCompleted || 0),
          0
        );
        return {
          modulesCompleted: completedCount,
          totalModules: 9,
          totalStepsCompleted: totalSteps,
        };
      },
    }),
    {
      name: 'linearvis-storage',
      partialize: (state) => ({
        currentModule: state.currentModule,
        moduleProgress: state.moduleProgress,
        unlockedModules: state.unlockedModules,
        guidedMode: state.guidedMode,
        darkMode: state.darkMode,
      }),
    }
  )
);