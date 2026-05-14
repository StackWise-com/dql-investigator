import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DQLRecord,
  DQLColumn,
  PipelineStage,
  Scenario,
  ViewMode,
  GamePhase,
} from "@/lib/types/dql";

export interface GameScore {
  mode: "timer" | "pipeline" | "mcq" | "dpl-matcher" | "dpl-builder";
  score: number;
  maxScore: number;
  date: string;
}

export interface GameSession {
  mode: string;
  questionIndex: number;
  score: number;
  startTime: number;
  lives: number;
}

interface InvestigatorState {
  // Phase
  currentPhase: number;
  phases: GamePhase[];
  setPhase: (index: number) => void;

  // Scenario
  activeScenario: Scenario | null;
  currentStepIndex: number;
  setScenario: (scenario: Scenario | null) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Pipeline
  pipeline: PipelineStage[];
  setPipeline: (pipeline: PipelineStage[]) => void;
  addStage: (stage: PipelineStage) => void;
  removeStage: (id: string) => void;
  moveStage: (fromIndex: number, toIndex: number) => void;

  // Data View
  currentData: DQLRecord[];
  currentColumns: DQLColumn[];
  stageResults: { stageId: string; data: DQLRecord[]; columns: DQLColumn[]; previousData?: DQLRecord[]; previousColumns?: DQLColumn[] }[];
  setStageResults: (results: { stageId: string; data: DQLRecord[]; columns: DQLColumn[]; previousData?: DQLRecord[]; previousColumns?: DQLColumn[] }[]) => void;
  selectedStageIndex: number;
  setSelectedStageIndex: (index: number) => void;

  // UI
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showNarrative: boolean;
  setShowNarrative: (show: boolean) => void;
  showHint: boolean;
  setShowHint: (show: boolean) => void;
  editorValue: string;
  setEditorValue: (value: string) => void;

  // Landing
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;

  // Unlocks
  unlockedScenarios: string[];

  // Session restore
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  lastActiveAt: string | null;
  setLastActiveAt: (at: string | null) => void;

  // Demo
  hasSeenDemo: boolean;
  setHasSeenDemo: (seen: boolean) => void;

  // User profile (hydrated from Supabase by useAuth, not persisted locally)
  userId: string;
  setUserId: (id: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userCountry: string;
  userCurrency: string;
  setUserCountry: (code: string) => void;
  displayName: string;
  setDisplayName: (name: string) => void;
  displaySlug: string;
  setDisplaySlug: (slug: string) => void;
  avatarEmoji: string;
  setAvatarEmoji: (emoji: string) => void;
  termsAcceptedAt: string | null;
  setTermsAcceptedAt: (at: string | null) => void;
  // Hydration: once true, the store mirrors the server and every
  // addXP / addGameScore call also pushes to Supabase.
  progressHydrated: boolean;
  setProgressHydrated: (val: boolean) => void;
  setTotalXP: (xp: number) => void;
  setGameHighScores: (scores: Record<string, number>) => void;

  // XP / Progress
  totalXP: number;
  addXP: (amount: number) => void;
  completedScenarios: string[];
  markScenarioComplete: (id: string) => void;

  // Arcade
  gameScores: GameScore[];
  addGameScore: (score: GameScore) => void;
  gameHighScores: Record<string, number>;
  gameSession: GameSession | null;
  setGameSession: (session: GameSession | null) => void;

  // Tour
  tourCompletedSegments: string[];
  completeTourSegment: (segment: string) => void;
  skipTour: () => void;
}

export const useInvestigatorStore = create<InvestigatorState>()(
  persist(
    (set, get) => ({
      currentPhase: 0,
      phases: [
        { id: "learn", title: "Learn", description: "Master DQL fundamentals", active: true, completed: false },
        { id: "sandbox", title: "Sandbox", description: "Build queries freely", active: false, completed: false },
        { id: "visualize", title: "Visualize", description: "See how data transforms", active: false, completed: false },
        { id: "cases", title: "Cases", description: "Solve real incidents", active: false, completed: false },
        { id: "arcade", title: "Arcade", description: "Game modes & challenges", active: false, completed: false },
      ],
      setPhase: (index) => {
        const phases = get().phases.map((p, i) => ({
          ...p,
          active: i === index,
          completed: i < index ? true : p.completed,
        }));
        set({ currentPhase: index, phases, lastActiveAt: new Date().toISOString() });
      },

      activeScenario: null,
      activeScenarioId: "",
      setActiveScenarioId: (activeScenarioId) => set({ activeScenarioId }),
      currentStepIndex: 0,
      setScenario: (scenario) =>
        set({
          activeScenario: scenario,
          activeScenarioId: scenario?.id ?? "",
          currentStepIndex: 0,
          pipeline: [],
          editorValue: "",
          stageResults: [],
          selectedStageIndex: -1,
          lastActiveAt: new Date().toISOString(),
        }),
      nextStep: () => {
        const s = get().activeScenario;
        if (!s) return;
        const next = Math.min(get().currentStepIndex + 1, s.steps.length - 1);
        set({
          currentStepIndex: next,
          lastActiveAt: new Date().toISOString(),
        });
      },
      prevStep: () => {
        const prev = Math.max(get().currentStepIndex - 1, 0);
        set({ currentStepIndex: prev, lastActiveAt: new Date().toISOString() });
      },

      showLanding: true,
      setShowLanding: (showLanding) => set({ showLanding, lastActiveAt: new Date().toISOString() }),

      lastActiveAt: null,
      setLastActiveAt: (lastActiveAt) => set({ lastActiveAt }),

      hasSeenDemo: false,
      setHasSeenDemo: (hasSeenDemo) => set({ hasSeenDemo }),

      unlockedScenarios: [
        // All DQL cases (free)
        "case-001", "case-002", "case-003", "case-004", "case-005",
        "case-006", "case-007", "case-008", "case-009", "case-010",
        "case-011", "case-012", "case-013", "case-014", "case-015",
        "case-016", "case-017", "case-018", "case-019", "case-020",
        "case-021", "case-022", "case-023", "case-024", "case-025",
        "case-026", "case-027", "case-028", "case-029", "case-030",
        "case-031", "case-032", "case-033", "case-034", "case-035",
        "case-036", "case-037", "case-038", "case-039", "case-040",
        "case-041", "case-042", "case-043",
        // Onboarding track
        "onboard-001", "onboard-002", "onboard-003", "onboard-004", "onboard-005", "onboard-006",
        // DPL track
        "dpl-001", "dpl-002", "dpl-003", "dpl-004", "dpl-005", "dpl-006",
        "dpl-007", "dpl-008", "dpl-009", "dpl-010", "dpl-011", "dpl-012",
        // Combined track
        "combo-001", "combo-002", "combo-003", "combo-004", "combo-005",
        "combo-006", "combo-007", "combo-008",
      ],

      userId: "",
      setUserId: (userId) => set({ userId }),
      userEmail: "",
      setUserEmail: (email) => set({ userEmail: email }),
      userCountry: "US",
      userCurrency: "USD",
      setUserCountry: (code) => set({ userCountry: code }),
      displayName: "",
      setDisplayName: (displayName) => set({ displayName }),
      displaySlug: "",
      setDisplaySlug: (displaySlug) => set({ displaySlug }),
      avatarEmoji: "",
      setAvatarEmoji: (avatarEmoji) => set({ avatarEmoji }),
      termsAcceptedAt: null,
      setTermsAcceptedAt: (termsAcceptedAt) => set({ termsAcceptedAt }),
      progressHydrated: false,
      setProgressHydrated: (progressHydrated) => set({ progressHydrated }),
      setTotalXP: (totalXP) => set({ totalXP }),
      setGameHighScores: (gameHighScores) => set({ gameHighScores }),

      pipeline: [],
      setPipeline: (pipeline) => set({ pipeline }),
      addStage: (stage) => set((state) => ({ pipeline: [...state.pipeline, stage] })),
      removeStage: (id) => set((state) => ({ pipeline: state.pipeline.filter((s) => s.id !== id) })),
      moveStage: (fromIndex, toIndex) => {
        const p = [...get().pipeline];
        const [removed] = p.splice(fromIndex, 1);
        p.splice(toIndex, 0, removed);
        set({ pipeline: p });
      },

      currentData: [],
      currentColumns: [],
      stageResults: [],
      setStageResults: (stageResults) => set({ stageResults }),
      selectedStageIndex: -1,
      setSelectedStageIndex: (selectedStageIndex) => set({ selectedStageIndex }),

      viewMode: "cards",
      setViewMode: (viewMode) => set({ viewMode }),
      showNarrative: true,
      setShowNarrative: (showNarrative) => set({ showNarrative }),
      showHint: false,
      setShowHint: (showHint) => set({ showHint }),
      editorValue: "",
      setEditorValue: (editorValue) => set({ editorValue }),

      totalXP: 0,
      addXP: (amount) => set((state) => ({ totalXP: state.totalXP + amount })),
      completedScenarios: [],
      markScenarioComplete: (id) =>
        set((state) => ({
          completedScenarios: state.completedScenarios.includes(id)
            ? state.completedScenarios
            : [...state.completedScenarios, id],
        })),

      gameScores: [],
      addGameScore: (score) =>
        set((state) => {
          const nextScores = [...state.gameScores, score];
          const key = score.mode;
          const prevBest = state.gameHighScores[key] ?? 0;
          return {
            gameScores: nextScores,
            gameHighScores: {
              ...state.gameHighScores,
              [key]: Math.max(prevBest, score.score),
            },
          };
        }),
      gameHighScores: {},
      gameSession: null,
      setGameSession: (gameSession) => set({ gameSession }),

      tourCompletedSegments: [],
      completeTourSegment: (segment) =>
        set((state) => ({
          tourCompletedSegments: state.tourCompletedSegments.includes(segment)
            ? state.tourCompletedSegments
            : [...state.tourCompletedSegments, segment],
        })),
      skipTour: () =>
        set(() => ({
          tourCompletedSegments: [
            "landing",
            "learn",
            "sandbox",
            "visualize",
            "cases-selector",
            "cases-active",
            "arcade",
          ],
        })),
    }),
    {
      name: "dql-investigator-store",
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version !== 1) {
          return {};
        }
        return persistedState as Partial<InvestigatorState>;
      },
      partialize: (state) => ({
        phases: state.phases,
        unlockedScenarios: state.unlockedScenarios,
        tourCompletedSegments: state.tourCompletedSegments,
        activeScenarioId: state.activeScenarioId,
        currentStepIndex: state.currentStepIndex,
        lastActiveAt: state.lastActiveAt,
        completedScenarios: state.completedScenarios,
        totalXP: state.totalXP,
        gameHighScores: state.gameHighScores,
        gameScores: state.gameScores,
        hasSeenDemo: state.hasSeenDemo,
      }),
    }
  )
);
