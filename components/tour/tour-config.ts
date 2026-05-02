export interface TourStep {
  targetId: string | null; // null means centered (no target)
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export interface TourSegment {
  id: string;
  steps: TourStep[];
}

export const TOUR_SEGMENTS: TourSegment[] = [
  {
    id: "landing",
    steps: [
      {
        targetId: null,
        title: "Welcome, Investigator",
        description:
          "DQL Detective is your hands-on training ground for Dynatrace Query Language. This quick tour will show you around the key areas so you can start solving cases right away.",
      },
      {
        targetId: "landing-title",
        title: "Your Dashboard",
        description:
          "This is your home base. Your XP, solved cases, and arcade stats are tracked here.",
        placement: "bottom",
      },
      {
        targetId: "landing-learn",
        title: "Learn — The Codex",
        description:
          "Study DQL commands, operators, data types, and functions. Think of it as your field manual.",
        placement: "bottom",
      },
      {
        targetId: "landing-sandbox",
        title: "Sandbox",
        description:
          "Build queries freely with sample data. No objectives, no pressure — just experiment.",
        placement: "bottom",
      },
      {
        targetId: "landing-cases",
        title: "Cases",
        description:
          "Solve real-world incidents. Build pipelines to investigate breaches, slow queries, and outages.",
        placement: "bottom",
      },
      {
        targetId: "landing-arcade",
        title: "Arcade",
        description:
          "Test your skills with timed challenges, pipeline builders, and DQL quizzes. Compete for high scores.",
        placement: "bottom",
      },
      {
        targetId: "landing-avatar",
        title: "Your Profile",
        description:
          "Track your XP, premium status, and progress. You can also request a refund here if needed.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "learn",
    steps: [
      {
        targetId: "learn-sidebar",
        title: "Codex Navigation",
        description:
          "Jump between topics: Overview, Commands, Data Types, Operators, Functions, and the Query Cookbook.",
        placement: "right",
      },
      {
        targetId: "learn-content",
        title: "Reference Content",
        description:
          "Each section includes explanations, syntax, examples, and practical tips. Read up before you dive into cases.",
        placement: "left",
      },
      {
        targetId: "learn-cookbook",
        title: "Query Cookbook",
        description:
          "Browse real-world DQL snippets by category and difficulty. A great place to copy and adapt queries.",
        placement: "top",
      },
    ],
  },
  {
    id: "sandbox",
    steps: [
      {
        targetId: "sandbox-starters",
        title: "Starter Queries",
        description:
          "Click any starter to load a pre-built query into the editor. A fast way to see DQL in action.",
        placement: "right",
      },
      {
        targetId: "dataview",
        title: "Data View",
        description:
          "This panel shows the live result of your pipeline. Watch rows transform as you add commands.",
        placement: "left",
      },
      {
        targetId: "commanddeck",
        title: "Command Deck",
        description:
          "Build your pipeline here. Switch between Cards mode (drag-and-drop) and Editor mode (write raw DQL).",
        placement: "left",
      },
      {
        targetId: "run-button",
        title: "Run Your Pipeline",
        description:
          "Hit Run (or press Ctrl+Enter) to execute your query and see the data update instantly.",
        placement: "top",
      },
    ],
  },
  {
    id: "visualize",
    steps: [
      {
        targetId: "visualize-sidebar",
        title: "Visual Signatures",
        description:
          "Each DQL command has a unique visual effect. Hover over these cards to preview how filter, sort, limit, and summarize look in the data view.",
        placement: "right",
      },
      {
        targetId: "dataview",
        title: "Live Preview",
        description:
          "Build a pipeline and watch the visual transformation happen in real time. Rows glow, merge, slide, and fade.",
        placement: "left",
      },
      {
        targetId: "commanddeck",
        title: "Build & Watch",
        description:
          "Use the Command Deck to add stages, then see the visual signature play out in the Data View.",
        placement: "left",
      },
    ],
  },
  {
    id: "cases-selector",
    steps: [
      {
        targetId: "cases-tabs",
        title: "Learning Tracks",
        description:
          "Switch between Onboarding, DQL, DPL, and Combined tracks. Each track teaches a different skill layer.",
        placement: "bottom",
      },
      {
        targetId: "cases-cards",
        title: "Scenario Cards",
        description:
          "Each card is a real-world incident. Click one to open the case file, read the mission brief, and start investigating.",
        placement: "top",
      },
      {
        targetId: "cases-locks",
        title: "Premium Cases",
        description:
          "Some cases are locked behind a one-time premium purchase. The first few cases in each track are free so you can try before you buy.",
        placement: "top",
      },
    ],
  },
  {
    id: "cases-active",
    steps: [
      {
        targetId: "case-brief",
        title: "Mission Brief",
        description:
          "Read the story behind the incident. Understanding the context is half the investigation.",
        placement: "right",
      },
      {
        targetId: "case-objective",
        title: "Your Objective",
        description:
          "This tells you exactly what your query needs to produce. Match the expected output to close the case.",
        placement: "right",
      },
      {
        targetId: "case-hint",
        title: "Need a Clue?",
        description:
          "Stuck? Click Show Hint to reveal the command or approach you should try. No penalty for using hints.",
        placement: "right",
      },
      {
        targetId: "dataview",
        title: "Inspect the Evidence",
        description:
          "Look at the raw data. Identify patterns, outliers, and the fields you'll need to filter or aggregate.",
        placement: "left",
      },
      {
        targetId: "commanddeck",
        title: "Build the Solution",
        description:
          "Construct your DQL pipeline in the Command Deck. Use the editor for full control or cards for a guided build.",
        placement: "left",
      },
      {
        targetId: "case-check",
        title: "Close the Case",
        description:
          "When you think your pipeline is correct, click Check Solution. If it matches the expected output, the case is closed and you earn XP.",
        placement: "top",
      },
    ],
  },
  {
    id: "arcade",
    steps: [
      {
        targetId: "arcade-modes",
        title: "Game Modes",
        description:
          "Pick a challenge: Timer Rush (speed), Pipeline Builder (logic), DQL Quiz (knowledge), DPL Matcher, or DPL Pattern Builder.",
        placement: "bottom",
      },
      {
        targetId: "arcade-scores",
        title: "Recent Scores",
        description:
          "Your last 10 game sessions are listed here. Track improvement over time.",
        placement: "top",
      },
      {
        targetId: "arcade-modes",
        title: "Arcade Stats",
        description:
          "High scores, games played, and streaks per mode are shown on each card. Premium users get 2× XP on every game.",
        placement: "top",
      },
    ],
  },
];

export function getSegment(id: string): TourSegment | undefined {
  return TOUR_SEGMENTS.find((s) => s.id === id);
}

export function getSegmentStepCount(id: string): number {
  return getSegment(id)?.steps.length ?? 0;
}
