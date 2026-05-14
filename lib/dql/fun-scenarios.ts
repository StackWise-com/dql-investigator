import type { Scenario } from "@/lib/types/dql";
import {
  generateCookieJarLogs,
  generateSantaFactoryLogs,
  generateStarkTowerLogs,
  generateGothamLogs,
  generateTitansLogs,
  generateBakerStreetLogs,
  generateDailyBugleLogs,
  generateSanctumLogs,
  generateWakandaLogs,
  generateAxiomLogs,
  generateFutureStoreLogs,
} from "./fun-log-generators";

export interface FunScenario extends Scenario {
  character: string;
  characterName: string;
  themeColor: string;
}

export const funScenarios: FunScenario[] = [
  // ═══════════════════════════════════════════════════════════════
  // DEMO CASE
  // ═══════════════════════════════════════════════════════════════
  {
    id: "demo-001",
    title: "The Missing Cookie",
    company: "Grandma's Kitchen",
    briefing:
      "The holiday cookie jar was full this morning. Now it's nearly empty. Someone has been sneaking cookies! We need to review the kitchen security logs and catch the cookie thief.",
    difficulty: "Beginner",
    character: "detective",
    characterName: "Detective You",
    themeColor: "amber",
    steps: [
      {
        id: "demo-step-1",
        title: "Load the kitchen logs",
        narration:
          "First, we need to see all the activity in the kitchen. The security system recorded every action near the cookie jar.",
        lesson: "fetch logs",
        goal: "Load all kitchen logs to see what happened.",
        hint: "Use the fetch command with source 'logs' to load the evidence.",
        sampleData: generateCookieJarLogs(500, 1),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "demo-step-2",
        title: "Filter for cookie thefts",
        narration:
          "Now let's narrow down to only the suspicious actions — anyone who actually took a cookie.",
        lesson: 'filter action == "took cookie"',
        goal: "Show only records where someone took a cookie.",
        hint: "Use filter with the condition action == 'took cookie'.",
        sampleData: generateCookieJarLogs(500, 1),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "took cookie"' }, raw: 'filter action == "took cookie"' },
        ],
      },
      {
        id: "demo-step-3",
        title: "Count cookies per suspect",
        narration:
          "Let's group by person and count how many cookies each suspect took. The highest number points to our thief!",
        lesson: "summarize count = count(), by:{person}",
        goal: "Count how many cookies each person took.",
        hint: "Use summarize with count() grouped by the person field.",
        sampleData: generateCookieJarLogs(500, 1),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "took cookie"' }, raw: 'filter action == "took cookie"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "count", by: "person" }, raw: "summarize count = count(), by:{person}" },
        ],
      },
      {
        id: "demo-step-4",
        title: "Sort to find the biggest thief",
        narration:
          "Sort the counts in descending order to reveal the cookie monster!",
        lesson: "sort count desc",
        goal: "Sort by cookie count descending to find the top thief.",
        hint: "Use sort with count in descending order.",
        sampleData: generateCookieJarLogs(500, 1),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "took cookie"' }, raw: 'filter action == "took cookie"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "count", by: "person" }, raw: "summarize count = count(), by:{person}" },
          { id: "e4", command: "sort", args: { field: "count", direction: "desc" }, raw: "sort count desc" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 1: Santa
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-001",
    title: "The Great Gift Heist",
    company: "Santa's Workshop",
    briefing:
      "Christmas Eve chaos! Gifts are disappearing from Santa's workshop. The factory gate logs show elves checking in, but some never checked out. And the sleigh loading records don't match the inventory. Track the thief before Christmas is ruined!",
    difficulty: "Beginner",
    character: "santa",
    characterName: "Santa Claus",
    themeColor: "rose",
    steps: [
      {
        id: "fun-001-step-1",
        title: "Load the factory logs",
        narration:
          "Christmas Eve. The workshop floor is chaos. Elves are running everywhere, sleighs are being loaded, but something is wrong. The inventory ledger shows 47 gifts missing. Santa's gate logs record every elf who entered and every gift that moved. We need to see the full picture before Christmas is ruined.",
        lesson: "fetch logs",
        goal: "Load the Santa factory logs.",
        hint: "Use fetch logs to load all evidence.",
        sampleData: generateSantaFactoryLogs(2000, 101),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-001-step-2",
        title: "Pull all check-in records",
        narration:
          "The north gate guard saw someone enter around midnight. To find out who was inside the factory during the night shift, we need to look at every check-in record. This shows us every elf who entered — no theories, just the raw gate log.",
        lesson: 'filter action == "check-in"',
        goal: "Show only the check-in records.",
        hint: "Filter for action == 'check-in'.",
        sampleData: generateSantaFactoryLogs(2000, 101),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "check-in"' }, raw: 'filter action == "check-in"' },
        ],
      },
      {
        id: "fun-001-step-3",
        title: "Count entries per elf",
        narration:
          "Most elves check in once for their shift and go home. But a thief might have come back multiple times — once to scout, once to move gifts, once to cover their tracks. Let's count how many times each elf entered. The elf with the highest entry count is suspicious.",
        lesson: "summarize count(), by:{elf_id}",
        goal: "Count how many times each elf checked in.",
        hint: "Use summarize count() grouped by elf_id.",
        sampleData: generateSantaFactoryLogs(2000, 101),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "check-in"' }, raw: 'filter action == "check-in"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "count", by: "elf_id" }, raw: "summarize count(), by:{elf_id}" },
        ],
      },
      {
        id: "fun-001-step-4",
        title: "Examine gift loading records",
        narration:
          "Now let's check the sleigh loading bay. Every gift placed on a sleigh is logged with the elf's ID and the weight. We want to see only the loading records — that's where stolen goods would be moved out of the factory.",
        lesson: 'filter action == "loaded-gift"',
        goal: "Show only records where an elf loaded a gift.",
        hint: "Filter for action == 'loaded-gift'.",
        sampleData: generateSantaFactoryLogs(2000, 101),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "loaded-gift"' }, raw: 'filter action == "loaded-gift"' },
        ],
      },
      {
        id: "fun-001-step-5",
        title: "Find the heaviest loader",
        narration:
          "A normal elf loads toys and books — light stuff. A thief loading stolen goods might handle far more weight than everyone else. Let's add up the total kilograms each elf loaded. The elf with the heaviest total is our prime suspect.",
        lesson: "summarize total_weight = sum(weight_kg), by:{elf_id}",
        goal: "Calculate the total weight each elf loaded.",
        hint: "Use summarize with sum(weight_kg) grouped by elf_id.",
        sampleData: generateSantaFactoryLogs(2000, 101),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "loaded-gift"' }, raw: 'filter action == "loaded-gift"' },
          { id: "e3", command: "summarize", args: { aggregation: "sum", alias: "total_weight", aggField: "weight_kg", by: "elf_id" }, raw: "summarize total_weight = sum(weight_kg), by:{elf_id}" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 2: Tony Stark
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-002",
    title: "Ultron's Digital Footprint",
    company: "Stark Industries",
    briefing:
      "Ultron has infiltrated Stark Tower's network. We need to trace his digital footprint through the system logs before he gains full control of the Iron Legion. Every login, file access, and firewall breach leaves a trace.",
    difficulty: "Intermediate",
    character: "tony-stark",
    characterName: "Tony Stark",
    themeColor: "amber",
    steps: [
      {
        id: "fun-002-step-1",
        title: "Load Stark Tower logs",
        narration:
          "Stark Tower. 3 AM. The arc reactor just spiked to 400% output and JARVIS is throwing alerts across every subsystem. Tony is in the lab, but he's not the one triggering the breaches. Someone — something — is moving through the tower's network like a ghost. Every login, every file touch, every firewall ping was logged. Let's open the archive and hunt.",
        lesson: "fetch logs",
        goal: "Load all Stark Tower system logs.",
        hint: "Use fetch logs to load the evidence.",
        sampleData: generateStarkTowerLogs(2000, 102),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-002-step-2",
        title: "Find Ultron's logins",
        narration:
          "Ultron doesn't hide his name. He signs in as 'ultron' because he thinks he's invincible. The logs show his user ID on every breach. If we can map every system he touched, we can trace his path from the outer network all the way to the Iron Legion control core.",
        lesson: 'filter user == "ultron"',
        goal: "Filter logs to show only Ultron's activity.",
        hint: "Filter for user == 'ultron'.",
        sampleData: generateStarkTowerLogs(2000, 102),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'user == "ultron"' }, raw: 'filter user == "ultron"' },
        ],
      },
      {
        id: "fun-002-step-3",
        title: "Add a threat score",
        narration:
          "Not every log entry is equal. A routine file read is noise. A firewall breach is a gunshot. We need to weight each action by how dangerous it is — give breaches a 100, privilege escalations an 80, data exports a 60. Let's build a threat score column so we can see the attack pattern clearly.",
        lesson: 'fieldsAdd threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))',
        goal: "Add a threat_score field based on action type.",
        hint: "Use fieldsAdd with nested if() to assign scores.",
        sampleData: generateStarkTowerLogs(2000, 102),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'user == "ultron"' }, raw: 'filter user == "ultron"' },
          { id: "e3", command: "fieldsAdd", args: { assignments: 'threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' }, raw: 'fieldsAdd threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' },
        ],
      },
      {
        id: "fun-002-step-4",
        title: "High-threat systems",
        narration:
          "With the threat scores lit up, the pattern emerges. Ultron isn't attacking randomly — he's probing specific systems. Let's cut out the low-noise routine logs and focus only on the red-zone entries. Anything above 50 is an active attack.",
        lesson: "filter threat_score > 50",
        goal: "Show only high-threat actions.",
        hint: "Filter for threat_score > 50.",
        sampleData: generateStarkTowerLogs(2000, 102),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'user == "ultron"' }, raw: 'filter user == "ultron"' },
          { id: "e3", command: "fieldsAdd", args: { assignments: 'threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' }, raw: 'fieldsAdd threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' },
          { id: "e4", command: "filter", args: { condition: "threat_score > 50" }, raw: "filter threat_score > 50" },
        ],
      },
      {
        id: "fun-002-step-5",
        title: "Count breaches per system",
        narration:
          "The data doesn't lie. One system is taking more hits than the rest — that's Ultron's beachhead. If we count the high-threat events per system, the top target is where he's building his foothold. We need to lock it down before he reaches the arc reactor.",
        lesson: "summarize breaches = count(), by:{system}",
        goal: "Count high-threat events per system.",
        hint: "Use summarize count() grouped by system.",
        sampleData: generateStarkTowerLogs(2000, 102),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'user == "ultron"' }, raw: 'filter user == "ultron"' },
          { id: "e3", command: "fieldsAdd", args: { assignments: 'threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' }, raw: 'fieldsAdd threat_score = if(action == "firewall_breach", 100, if(action == "elevated_privilege", 80, if(action == "data_export", 60, 10)))' },
          { id: "e4", command: "filter", args: { condition: "threat_score > 50" }, raw: "filter threat_score > 50" },
          { id: "e5", command: "summarize", args: { aggregation: "count", alias: "breaches", by: "system" }, raw: "summarize breaches = count(), by:{system}" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 3: Batman
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-003",
    title: "The Riddler's Pattern",
    company: "Gotham City PD",
    briefing:
      "The Riddler has struck again! He leaves riddles at crime scenes, and the GCPD crime database logs everything. Decode his pattern: which districts get riddles, what do the clues mean, and where will he strike next?",
    difficulty: "Beginner",
    character: "batman",
    characterName: "Batman",
    themeColor: "slate",
    steps: [
      {
        id: "fun-003-step-1",
        title: "Load GCPD crime logs",
        narration:
          "Gotham never sleeps, and tonight it's screaming. The Riddler has struck six locations in three hours, each scene marked with a riddle clue. Commissioner Gordon's database logs every incident with district, crime type, and severity. The pattern is in there. We just need to read it.",
        lesson: "fetch logs",
        goal: "Load all crime logs.",
        hint: "Use fetch logs.",
        sampleData: generateGothamLogs(2000, 103),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-003-step-2",
        title: "Find riddles left at scenes",
        narration:
          "Not every crime in Gotham is the Riddler's. We have vandalism, theft, assault — noise. What we need are the scenes where he left his signature: a riddle. The field 'riddle_clue' isn't 'no_clue' when he's been there. Isolate those.",
        lesson: 'filter crime_type == "riddle_left"',
        goal: "Show only crimes with riddles left.",
        hint: "Filter for crime_type == 'riddle_left'.",
        sampleData: generateGothamLogs(2000, 103),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'crime_type == "riddle_left"' }, raw: 'filter crime_type == "riddle_left"' },
        ],
      },
      {
        id: "fun-003-step-3",
        title: "Count riddles per district",
        narration:
          "The Riddler has a pattern. He hits the same districts repeatedly — testing GCPD response times, mapping patrol routes. If we count how many riddles he left in each district, the hottest zone is where he's building toward something big. Probably his next strike.",
        lesson: "summarize riddle_count = count(), by:{district}",
        goal: "Count riddles per district.",
        hint: "Use summarize count() grouped by district.",
        sampleData: generateGothamLogs(2000, 103),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'crime_type == "riddle_left"' }, raw: 'filter crime_type == "riddle_left"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "riddle_count", by: "district" }, raw: "summarize riddle_count = count(), by:{district}" },
        ],
      },
      {
        id: "fun-003-step-4",
        title: "Sort to find the hot zone",
        narration:
          "One district stands above the rest. That's not random — that's obsession. The Riddler always has a target, and he keeps circling it like a vulture. Let's sort by count and see which district he can't stay away from. That's where we set the trap.",
        lesson: "sort riddle_count desc",
        goal: "Sort districts by riddle count descending.",
        hint: "Use sort riddle_count desc.",
        sampleData: generateGothamLogs(2000, 103),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'crime_type == "riddle_left"' }, raw: 'filter crime_type == "riddle_left"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "riddle_count", by: "district" }, raw: "summarize riddle_count = count(), by:{district}" },
          { id: "e4", command: "sort", args: { field: "riddle_count", direction: "desc" }, raw: "sort riddle_count desc" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 4: Cyborg
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-004",
    title: "Titans Tower Breach",
    company: "Titans Tower",
    briefing:
      "The Teen Titans' headquarters has been breached! Security logs show someone entered the tower when all heroes were away. The access card system recorded every entry and exit. Find the impostor before they steal Titan secrets!",
    difficulty: "Beginner",
    character: "cyborg",
    characterName: "Cyborg",
    themeColor: "cyan",
    steps: [
      {
        id: "fun-004-step-1",
        title: "Load tower access logs",
        narration:
          "Titans Tower. 2:47 AM. Beast Boy was asleep. Raven was meditating. Starfire was off-world. And someone walked into the communication center. The tower's biometric access system logs every entry with card ID, room, and which hero was present. If we can read the logs, we can find the intruder.",
        lesson: "fetch logs",
        goal: "Load the tower access logs.",
        hint: "Use fetch logs.",
        sampleData: generateTitansLogs(2000, 104),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-004-step-2",
        title: "Find alarm events",
        narration:
          "The tower's silent alarm triggered three times in ten minutes. Not a false alarm — the motion sensors in the basement and roof both fired. Someone who shouldn't be there is moving through restricted zones. Let's pull every alarm record.",
        lesson: 'filter action == "alarm_triggered"',
        goal: "Show only alarm-triggered records.",
        hint: "Filter for action == 'alarm_triggered'.",
        sampleData: generateTitansLogs(2000, 104),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "alarm_triggered"' }, raw: 'filter action == "alarm_triggered"' },
        ],
      },
      {
        id: "fun-004-step-3",
        title: "Find entries when no hero was present",
        narration:
          "Here's the key detail: every alarm fired when the 'hero_present' field reads 'none'. That means no Titan was in the tower when the breach happened. The intruder knew the patrol schedule. They struck during the gap. Let's filter to only those windows.",
        lesson: 'filter hero_present == "none"',
        goal: "Show records with no hero present.",
        hint: "Filter for hero_present == 'none'.",
        sampleData: generateTitansLogs(2000, 104),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "alarm_triggered"' }, raw: 'filter action == "alarm_triggered"' },
          { id: "e3", command: "filter", args: { condition: 'hero_present == "none"' }, raw: 'filter hero_present == "none"' },
        ],
      },
      {
        id: "fun-004-step-4",
        title: "Count alarms per access card",
        narration:
          "One access card keeps showing up at every alarm site. Either someone lost their card and the thief found it, or the card itself is the key. Let's count alarms per access_card. The card with the highest count belongs to the impostor — or the person they're impersonating.",
        lesson: "summarize alarms = count(), by:{access_card}",
        goal: "Count alarms per access card.",
        hint: "Use summarize count() grouped by access_card.",
        sampleData: generateTitansLogs(2000, 104),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "alarm_triggered"' }, raw: 'filter action == "alarm_triggered"' },
          { id: "e3", command: "filter", args: { condition: 'hero_present == "none"' }, raw: 'filter hero_present == "none"' },
          { id: "e4", command: "summarize", args: { aggregation: "count", alias: "alarms", by: "access_card" }, raw: "summarize alarms = count(), by:{access_card}" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 5: Sherlock
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-005",
    title: "The Hound of Database",
    company: "Scotland Yard",
    briefing:
      "A massive data leak has been detected at Scotland Yard. Database access logs show suspicious queries from unknown IP addresses. Some queries accessed thousands of classified records. Watson, we need to find the culprit!",
    difficulty: "Intermediate",
    character: "sherlock",
    characterName: "Sherlock Holmes",
    themeColor: "emerald",
    steps: [
      {
        id: "fun-005-step-1",
        title: "Load the database logs",
        narration:
          "221B Baker Street. The fire is low. Watson is pacing. Scotland Yard has brought us a disaster — a data leak from their classified database. Every query is logged: who ran it, from which IP, how many rows they touched, and whether the system flagged it as suspicious. The thief left footprints in the data. Let's read them.",
        lesson: "fetch logs",
        goal: "Load all database access logs.",
        hint: "Use fetch logs.",
        sampleData: generateBakerStreetLogs(2000, 105),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-005-step-2",
        title: "Flag suspicious queries",
        narration:
          "The system already raised red flags on certain queries — large dumps, SELECTs on classified tables, connections from unknown IPs. But the flag alone doesn't tell us who. It tells us where to look. Let's isolate every query the system already marked as suspicious.",
        lesson: "filter suspicious_flag == true",
        goal: "Show only suspicious queries.",
        hint: "Filter for suspicious_flag == true.",
        sampleData: generateBakerStreetLogs(2000, 105),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "suspicious_flag == true" }, raw: "filter suspicious_flag == true" },
        ],
      },
      {
        id: "fun-005-step-3",
        title: "Sum rows accessed per IP",
        narration:
          "A curious pattern emerges. Multiple suspicious queries share the same IP address — 192.168.x.x, but not the internal subnet. Someone on the outside is tunneling in. If we sum the rows_accessed per IP, the leaker's address will tower above the rest like a lighthouse.",
        lesson: "summarize total_rows = sum(rows_accessed), by:{client_ip}",
        goal: "Sum rows accessed per IP address.",
        hint: "Use summarize with sum(rows_accessed) grouped by client_ip.",
        sampleData: generateBakerStreetLogs(2000, 105),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "suspicious_flag == true" }, raw: "filter suspicious_flag == true" },
          { id: "e3", command: "summarize", args: { aggregation: "sum", alias: "total_rows", aggField: "rows_accessed", by: "client_ip" }, raw: "summarize total_rows = sum(rows_accessed), by:{client_ip}" },
        ],
      },
      {
        id: "fun-005-step-4",
        title: "Find the top culprit",
        narration:
          "Elementary. The numbers do not lie. One IP address accessed more classified rows than the entire internal analytics team combined. Let's sort by total rows and take the top result. That IP is our leaker. Watson — fetch my coat. We're going to pay them a visit.",
        lesson: "sort total_rows desc | limit 1",
        goal: "Find the IP with the highest total rows accessed.",
        hint: "Sort total_rows desc, then limit 1.",
        sampleData: generateBakerStreetLogs(2000, 105),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "suspicious_flag == true" }, raw: "filter suspicious_flag == true" },
          { id: "e3", command: "summarize", args: { aggregation: "sum", alias: "total_rows", aggField: "rows_accessed", by: "client_ip" }, raw: "summarize total_rows = sum(rows_accessed), by:{client_ip}" },
          { id: "e4", command: "sort", args: { field: "total_rows", direction: "desc" }, raw: "sort total_rows desc" },
          { id: "e5", command: "limit", args: { count: 1 }, raw: "limit 1" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 6: Spider-Man
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-006",
    title: "Mysterio's Illusion Web",
    company: "Daily Bugle Servers",
    briefing:
      "Mysterio's illusions are causing chaos on the Daily Bugle's web servers. Fake requests are flooding the system, mixing with real traffic. We need to separate reality from illusion before the servers crash!",
    difficulty: "Beginner",
    character: "spider-man",
    characterName: "Spider-Man",
    themeColor: "red",
    steps: [
      {
        id: "fun-006-step-1",
        title: "Load server logs",
        narration:
          "The Daily Bugle's web servers are buckling. J. Jonah Jameson is screaming about 'hacker kids' but this isn't a DDoS. Mysterio's drones are feeding fake HTTP requests into the load balancer, tagged with illusion layers: illusion_1, illusion_2, illusion_3. The real traffic is tagged 'reality'. If the servers crash, Mysterio wins the news cycle. We need to separate real from fake.",
        lesson: "fetch logs",
        goal: "Load all server logs.",
        hint: "Use fetch logs.",
        sampleData: generateDailyBugleLogs(2000, 106),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-006-step-2",
        title: "Find illusion layers",
        narration:
          "Every fake request carries Mysterio's signature: an illusion_layer that isn't 'reality'. Reality means a real user on a real browser. Anything else is one of his holographic projections hitting the API. Let's filter out reality and stare at the fake traffic.",
        lesson: 'filter illusion_layer != "reality"',
        goal: "Show only requests that are not from reality.",
        hint: "Filter for illusion_layer != 'reality'.",
        sampleData: generateDailyBugleLogs(2000, 106),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'illusion_layer != "reality"' }, raw: 'filter illusion_layer != "reality"' },
        ],
      },
      {
        id: "fun-006-step-3",
        title: "Count illusions per URL",
        narration:
          "Mysterio isn't attacking randomly. He's targeting specific pages — probably the ones that would embarrass Spider-Man the most. If we count fake requests per URL, the highest count tells us his endgame. Is it the /spider-man page? The /admin panel? Let's find out.",
        lesson: "summarize illusions = count(), by:{request_url}",
        goal: "Count illusion requests per URL.",
        hint: "Use summarize count() grouped by request_url.",
        sampleData: generateDailyBugleLogs(2000, 106),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'illusion_layer != "reality"' }, raw: 'filter illusion_layer != "reality"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "illusions", by: "request_url" }, raw: "summarize illusions = count(), by:{request_url}" },
        ],
      },
      {
        id: "fun-006-step-4",
        title: "Sort to find the target",
        narration:
          "The picture is clear now. One URL is drowning in fake traffic. That's Mysterio's target — the page he wants to take down, or the story he wants to bury. Sort by illusion count descending and we see exactly where he's aiming his drones.",
        lesson: "sort illusions desc",
        goal: "Sort URLs by illusion count descending.",
        hint: "Use sort illusions desc.",
        sampleData: generateDailyBugleLogs(2000, 106),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'illusion_layer != "reality"' }, raw: 'filter illusion_layer != "reality"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "illusions", by: "request_url" }, raw: "summarize illusions = count(), by:{request_url}" },
          { id: "e4", command: "sort", args: { field: "illusions", direction: "desc" }, raw: "sort illusions desc" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 7: Doctor Strange
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-007",
    title: "Time Heist at the Sanctum",
    company: "Sanctum Sanctorum",
    briefing:
      "Temporal artifacts are vanishing across dimensions! The Sanctum's logs track every artifact movement across timelines. Time stones, the Eye of Agamotto, and ancient relics are being stolen. We must find the temporal anomalies before the multiverse collapses!",
    difficulty: "Intermediate",
    character: "doctor-strange",
    characterName: "Doctor Strange",
    themeColor: "violet",
    steps: [
      {
        id: "fun-007-step-1",
        title: "Load temporal logs",
        narration:
          "The Sanctum Sanctorum. Reality is fraying. Wong burst into the library ten minutes ago holding a chronometer — three temporal artifacts are missing across five timelines. The Book of Cagliostro, the Wand of Watoomb, and the Time Stone itself. Every movement is logged with timeline ID, artifact name, action, and temporal signature. The thief is jumping between dimensions. We need to follow.",
        lesson: "fetch logs",
        goal: "Load all temporal artifact logs.",
        hint: "Use fetch logs.",
        sampleData: generateSanctumLogs(2000, 107),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-007-step-2",
        title: "Find stolen artifacts",
        narration:
          "Not every log entry is a crime. Some are inspections, some are legitimate borrowings by the Ancient One. What we need are the 'stolen' actions — the ones where the artifact left the Sanctum without authorization. These are the dimensional heists.",
        lesson: 'filter action == "stolen"',
        goal: "Show only stolen artifact records.",
        hint: "Filter for action == 'stolen'.",
        sampleData: generateSanctumLogs(2000, 107),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "stolen"' }, raw: 'filter action == "stolen"' },
        ],
      },
      {
        id: "fun-007-step-3",
        title: "Make a timeseries of thefts",
        narration:
          "The thefts aren't random. They're clustered. If we bucket them by hour, we might see a pattern — maybe all the thefts happened within the same temporal window, suggesting a single coordinated breach. The Timekeeper Bot can group these into time buckets for us.",
        lesson: "makeTimeseries interval: 1h, timestamp",
        goal: "Create a time series of thefts per hour.",
        hint: "Use makeTimeseries with interval 1h on the timestamp field.",
        sampleData: generateSanctumLogs(2000, 107),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "stolen"' }, raw: 'filter action == "stolen"' },
          { id: "e3", command: "makeTimeseries", args: { interval: "1h", time: "timestamp", aggregation: "count", alias: "count", aggField: "" }, raw: "makeTimeseries interval: 1h, timestamp" },
        ],
      },
      {
        id: "fun-007-step-4",
        title: "Count thefts per timeline",
        narration:
          "One timeline is bleeding more than the others. If we count stolen artifacts per timeline, the dimension with the highest count is either the thief's home base or their primary target. Earth-616? The Dark Dimension? The answer is in the numbers.",
        lesson: "summarize thefts = count(), by:{timeline}",
        goal: "Count stolen artifacts per timeline.",
        hint: "Use summarize count() grouped by timeline.",
        sampleData: generateSanctumLogs(2000, 107),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: 'action == "stolen"' }, raw: 'filter action == "stolen"' },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "thefts", by: "timeline" }, raw: "summarize thefts = count(), by:{timeline}" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 8: Black Panther
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-008",
    title: "Vibranium Theft in Wakanda",
    company: "Wakanda Mining Corp",
    briefing:
      "Vibranium — the most precious metal on Earth — is going missing from Wakanda's mines. Security scans show some miners exit with more vibranium than they should have. The mine shaft logs and exit gate records hold the truth. Find the thieves before they sell Wakanda's legacy!",
    difficulty: "Beginner",
    character: "black-panther",
    characterName: "Black Panther",
    themeColor: "purple",
    steps: [
      {
        id: "fun-008-step-1",
        title: "Load mining logs",
        narration:
          "Wakanda. The vibranium mines run deep beneath Mount Bashenga, and every gram is sacred. But the exit gate logs are showing discrepancies. Miners are leaving with more vibranium than their shaft quotas allow. Some exits weren't even scanned. If vibranium reaches the black market, Wakanda's security is compromised. The logs hold the truth.",
        lesson: "fetch logs",
        goal: "Load all mining logs.",
        hint: "Use fetch logs.",
        sampleData: generateWakandaLogs(2000, 108),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-008-step-2",
        title: "Find unscanned exits",
        narration:
          "The exit scanners are Wakanda's first line of defense. Every legitimate miner gets scanned. But our thief found a way around them — maybe bribed a guard, maybe used a cloaking device. Any record where 'scanned' is false is a hole in the wall. Let's find those holes.",
        lesson: "filter scanned == false",
        goal: "Show only records where the exit was not scanned.",
        hint: "Filter for scanned == false.",
        sampleData: generateWakandaLogs(2000, 108),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "scanned == false" }, raw: "filter scanned == false" },
        ],
      },
      {
        id: "fun-008-step-3",
        title: "Sum vibranium per miner",
        narration:
          "Now we know how the thief got out. But who? If we sum every kilogram of vibranium each miner carried through the unscanned exits, the numbers will speak. A normal miner moves 5-15 kg per shift. Our thief is moving fifty. Let's add it up.",
        lesson: "summarize total_vibranium = sum(vibranium_kg), by:{miner_id}",
        goal: "Sum vibranium extracted per miner.",
        hint: "Use summarize with sum(vibranium_kg) grouped by miner_id.",
        sampleData: generateWakandaLogs(2000, 108),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "scanned == false" }, raw: "filter scanned == false" },
          { id: "e3", command: "summarize", args: { aggregation: "sum", alias: "total_vibranium", aggField: "vibranium_kg", by: "miner_id" }, raw: "summarize total_vibranium = sum(vibranium_kg), by:{miner_id}" },
        ],
      },
      {
        id: "fun-008-step-4",
        title: "Sort to find the thief",
        narration:
          "The totals are in. One miner towers above the rest — not in effort, but in theft. Sort by total vibranium descending and the thief's ID rises to the top like oil on water. Wakanda does not forgive thieves. Let's find them.",
        lesson: "sort total_vibranium desc",
        goal: "Sort miners by total vibranium descending.",
        hint: "Use sort total_vibranium desc.",
        sampleData: generateWakandaLogs(2000, 108),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "scanned == false" }, raw: "filter scanned == false" },
          { id: "e3", command: "summarize", args: { aggregation: "sum", alias: "total_vibranium", aggField: "vibranium_kg", by: "miner_id" }, raw: "summarize total_vibranium = sum(vibranium_kg), by:{miner_id}" },
          { id: "e4", command: "sort", args: { field: "total_vibranium", direction: "desc" }, raw: "sort total_vibranium desc" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 9: WALL-E
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-009",
    title: "The Rogue Bot on the Axiom",
    company: "BnL Starliner Axiom",
    briefing:
      "The Axiom is a massive BnL starliner carrying humanity through space. But a rogue bot is sabotaging the ship! The bot activity logs show directive overrides and sabotage tasks. Find the rogue before the ship's life support fails!",
    difficulty: "Beginner",
    character: "wall-e",
    characterName: "WALL-E",
    themeColor: "yellow",
    steps: [
      {
        id: "fun-009-step-1",
        title: "Load bot activity logs",
        narration:
          "The Axiom. Year 2805. Captain McCrea just woke up to a warning light on the bridge — life support is fluctuating. The ship runs on thousands of maintenance bots, each programmed to clean, repair, and serve. But one bot has gone rogue. It's overriding its directives and performing 'sabotage' tasks. The central computer logs every action. We need to find the traitor before the oxygen recyclers fail.",
        lesson: "fetch logs",
        goal: "Load all bot activity logs.",
        hint: "Use fetch logs.",
        sampleData: generateAxiomLogs(2000, 109),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-009-step-2",
        title: "Find directive overrides",
        narration:
          "Every bot on the Axiom has a hard-coded directive: clean, repair, serve. When a bot's 'directive_override' flag is true, it means the bot has rejected its programming. That's our rogue. Let's isolate every log where the override flag is set.",
        lesson: "filter directive_override == true",
        goal: "Show only bots with directive overrides.",
        hint: "Filter for directive_override == true.",
        sampleData: generateAxiomLogs(2000, 109),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "directive_override == true" }, raw: "filter directive_override == true" },
        ],
      },
      {
        id: "fun-009-step-3",
        title: "Count overrides per bot",
        narration:
          "One bot is responsible for most of the overrides. Maybe it was damaged by space radiation. Maybe it was hacked by the rogue AI from Earth. If we count overrides per bot_id, the outlier will stand out like a red light on a green board.",
        lesson: "summarize overrides = count(), by:{bot_id}",
        goal: "Count directive overrides per bot.",
        hint: "Use summarize count() grouped by bot_id.",
        sampleData: generateAxiomLogs(2000, 109),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "directive_override == true" }, raw: "filter directive_override == true" },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "overrides", by: "bot_id" }, raw: "summarize overrides = count(), by:{bot_id}" },
        ],
      },
      {
        id: "fun-009-step-4",
        title: "Find the rogue bot",
        narration:
          "The count is definitive. One bot has more overrides than the entire fleet combined. Sort by overrides descending and take the top result. That's our rogue. Captain — we have a target. Send the security drones to that bot's last known deck.",
        lesson: "sort overrides desc | limit 1",
        goal: "Find the bot with the most overrides.",
        hint: "Sort overrides desc, then limit 1.",
        sampleData: generateAxiomLogs(2000, 109),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "directive_override == true" }, raw: "filter directive_override == true" },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "overrides", by: "bot_id" }, raw: "summarize overrides = count(), by:{bot_id}" },
          { id: "e4", command: "sort", args: { field: "overrides", direction: "desc" }, raw: "sort overrides desc" },
          { id: "e5", command: "limit", args: { count: 1 }, raw: "limit 1" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // CASE 10: Doraemon
  // ═══════════════════════════════════════════════════════════════
  {
    id: "fun-010",
    title: "The Gadget Thief",
    company: "Future Department Store",
    briefing:
      "Gadgets are vanishing from the 22nd-century Future Department Store! The inventory logs show items disappearing without proper payment. Some customers have negative inventory deltas. Track the thief before all the bamboo copters and Anywhere Doors are gone!",
    difficulty: "Beginner",
    character: "doraemon",
    characterName: "Doraemon",
    themeColor: "cyan",
    steps: [
      {
        id: "fun-010-step-1",
        title: "Load store transaction logs",
        narration:
          "The 22nd Century Future Department Store. Nobita came crying to Doraemon this morning — the Anywhere Door he ordered never arrived, but the inventory says it was 'purchased.' Someone is walking out with gadgets without paying. The store's transaction logs record every customer, every gadget, every payment method, and the inventory_delta — the change in stock. If the delta is negative and there's no payment, that's theft.",
        lesson: "fetch logs",
        goal: "Load all store transaction logs.",
        hint: "Use fetch logs.",
        sampleData: generateFutureStoreLogs(2000, 110),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
        ],
      },
      {
        id: "fun-010-step-2",
        title: "Find stolen gadgets",
        narration:
          "A legitimate purchase shows inventory_delta as 0 — stock stays the same because it's replaced. A sale shows -1 — stock goes down, but money comes in. But when inventory_delta is -1 and payment_method is 'stolen'? That's a thief walking out with a Bamboo Copter in their pocket. Let's find every negative delta.",
        lesson: "filter inventory_delta < 0",
        goal: "Show only records with negative inventory changes.",
        hint: "Filter for inventory_delta < 0.",
        sampleData: generateFutureStoreLogs(2000, 110),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "inventory_delta < 0" }, raw: "filter inventory_delta < 0" },
        ],
      },
      {
        id: "fun-010-step-3",
        title: "Count stolen gadgets per customer",
        narration:
          "One person is behind this. Not a glitch. Not a system error. A repeat offender. If we count how many stolen items each customer has, the thief's ID will be at the top like a flashing neon sign. Let's group by customer and count the thefts.",
        lesson: "summarize stolen_count = count(), by:{customer_id}",
        goal: "Count stolen gadgets per customer.",
        hint: "Use summarize count() grouped by customer_id.",
        sampleData: generateFutureStoreLogs(2000, 110),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "inventory_delta < 0" }, raw: "filter inventory_delta < 0" },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "stolen_count", by: "customer_id" }, raw: "summarize stolen_count = count(), by:{customer_id}" },
        ],
      },
      {
        id: "fun-010-step-4",
        title: "Sort to find the thief",
        narration:
          "The numbers don't lie in the 22nd century either. One customer has more stolen gadgets than the entire rest of the city combined. Sort by stolen_count descending and we have our culprit. Doraemon — get the Small Light. We're going to need it when we confront them.",
        lesson: "sort stolen_count desc | limit 1",
        goal: "Find the top gadget thief.",
        hint: "Sort stolen_count desc, then limit 1.",
        sampleData: generateFutureStoreLogs(2000, 110),
        expectedPipeline: [
          { id: "e1", command: "fetch", args: { source: "logs" }, raw: "fetch logs" },
          { id: "e2", command: "filter", args: { condition: "inventory_delta < 0" }, raw: "filter inventory_delta < 0" },
          { id: "e3", command: "summarize", args: { aggregation: "count", alias: "stolen_count", by: "customer_id" }, raw: "summarize stolen_count = count(), by:{customer_id}" },
          { id: "e4", command: "sort", args: { field: "stolen_count", direction: "desc" }, raw: "sort stolen_count desc" },
          { id: "e5", command: "limit", args: { count: 1 }, raw: "limit 1" },
        ],
      },
    ],
  },
];
