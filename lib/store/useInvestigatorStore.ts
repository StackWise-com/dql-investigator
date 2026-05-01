import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPriceForCountry } from "@/lib/pricing";
import type {
  DQLRecord,
  DQLColumn,
  PipelineStage,
  Scenario,
  ViewMode,
  GamePhase,
} from "@/lib/types/dql";

export interface GameScore {
  mode: "timer" | "pipeline" | "mcq";
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
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;

  // User profile
  userEmail: string;
  setUserEmail: (email: string) => void;
  userCountry: string;
  userCurrency: string;
  setUserCountry: (code: string) => void;
  isGuest: boolean;
  setIsGuest: (val: boolean) => void;

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
        set({ currentPhase: index, phases });
      },

      activeScenario: null,
      currentStepIndex: 0,
      setScenario: (scenario) =>
        set({
          activeScenario: scenario,
          currentStepIndex: 0,
          pipeline: [],
          editorValue: "",
          stageResults: [],
          selectedStageIndex: -1,
        }),
      nextStep: () => {
        const s = get().activeScenario;
        if (!s) return;
        const next = Math.min(get().currentStepIndex + 1, s.steps.length - 1);
        set({
          currentStepIndex: next,
          pipeline: [],
          editorValue: "",
          stageResults: [],
          selectedStageIndex: -1,
        });
      },
      prevStep: () => {
        const prev = Math.max(get().currentStepIndex - 1, 0);
        set({ currentStepIndex: prev });
      },

      showLanding: true,
      setShowLanding: (showLanding) => set({ showLanding }),

      unlockedScenarios: [
        "case-001", "case-006", "case-007", "case-008", "case-009",
        "case-010", "case-011", "case-012", "case-013", "case-014",
        "case-015", "case-016", "case-017", "case-018", "case-019",
      ],
      isPremium: false,
      setIsPremium: (isPremium) => set({ isPremium }),

      userEmail: "",
      setUserEmail: (email) => set({ userEmail: email }),
      userCountry: "US",
      userCurrency: "USD",
      setUserCountry: (code) => {
        const price = getPriceForCountry(code);
        set({ userCountry: code, userCurrency: price.currency });
      },
      isGuest: false,
      setIsGuest: (isGuest) => set({ isGuest }),

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
        totalXP: state.totalXP,
        completedScenarios: state.completedScenarios,
        phases: state.phases,
        userEmail: state.userEmail,
        userCountry: state.userCountry,
        userCurrency: state.userCurrency,
        isPremium: state.isPremium,
        unlockedScenarios: state.unlockedScenarios,
        isGuest: state.isGuest,
        gameScores: state.gameScores,
        gameHighScores: state.gameHighScores,
      }),
    }
  )
);
