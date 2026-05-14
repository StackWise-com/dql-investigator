import type { DQLRecord } from "@/lib/types/dql";

// Reuse the seeded random helpers from log-generator.ts
// (they are not exported, so we duplicate the minimal set here)
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randItem<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatTimestamp(base: Date, offsetSeconds: number) {
  const d = new Date(base.getTime() + offsetSeconds * 1000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
}

// ═══════════════════════════════════════════════════════════════
// 1. DEMO: The Missing Cookie
// ═══════════════════════════════════════════════════════════════
export function generateCookieJarLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-12-24T14:00:00Z");
  const people = ["mom", "dad", "sister", "brother", "cousin_eddie", "grandma", "aunt_may", "uncle_ben"];
  const actions = ["took cookie", "left crumbs", "closed jar", "opened jar", "peeked inside", "sniffed around"];
  const locations = ["kitchen", "pantry", "living_room", "dining_room", "hallway"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 5, 60);
    const person = randItem(rng, people);
    const action = randItem(rng, actions);
    const location = randItem(rng, locations);
    const cookieCount = action === "took cookie" ? randInt(rng, 1, 5) : 0;

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      person,
      action,
      location,
      cookie_count: cookieCount,
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 2. Santa: The Great Gift Heist
// ═══════════════════════════════════════════════════════════════
export function generateSantaFactoryLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-12-23T20:00:00Z");
  const elves = Array.from({ length: 40 }, (_, i) => `ELF-${100 + i}`);
  const gates = ["north", "south", "east", "west"];
  const actions = ["check-in", "check-out", "loaded-gift", "unloaded-gift", "inspection"];
  const giftTypes = ["toy_train", "doll", "lego_set", "book", "bicycle", "game_console", "puzzle", "art_kit"];
  const zones = ["sleigh-A", "sleigh-B", "sleigh-C", "warehouse", "packing"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 10, 90);
    const elf = randItem(rng, elves);
    const gate = randItem(rng, gates);
    const action = randItem(rng, actions);
    const gift = action === "loaded-gift" || action === "unloaded-gift" ? randItem(rng, giftTypes) : null;
    const zone = randItem(rng, zones);
    const weight = gift ? randInt(rng, 1, 20) : 0;

    const rec: DQLRecord = {
      timestamp: formatTimestamp(baseTime, elapsed),
      elf_id: elf,
      gate,
      action,
      sleigh_zone: zone,
    };
    if (gift) rec.gift_type = gift;
    if (weight) rec.weight_kg = weight;
    records.push(rec);
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 3. Tony Stark: Ultron's Digital Footprint
// ═══════════════════════════════════════════════════════════════
export function generateStarkTowerLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-05-15T08:00:00Z");
  const systems = ["jarvis", "friday", "arc_reactor", "security", "lab_network", "qu jet", "armory"];
  const users = ["tony", "pepper", "rhodey", "banner", "vision", "ultron", "guest"];
  const actions = ["login", "logout", "file_access", "firewall_breach", "data_export", "system_scan", "elevated_privilege"];
  const paths = ["/core/ai", "/weapons/iron_man", "/research/hulk", "/finance/stark", "/security/cameras", "/communications"];
  const levels = ["low", "medium", "high", "critical"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 2, 45);
    const system = randItem(rng, systems);
    const user = randItem(rng, users);
    const action = randItem(rng, actions);
    const level = randItem(rng, levels);
    const ip = `${randInt(rng, 10, 223)}.${randInt(rng, 0, 255)}.${randInt(rng, 0, 255)}.${randInt(rng, 1, 254)}`;

    const rec: DQLRecord = {
      timestamp: formatTimestamp(baseTime, elapsed),
      system,
      user,
      action,
      threat_level: level,
      ip_address: ip,
    };
    if (action === "file_access" || action === "data_export") {
      rec.file_path = randItem(rng, paths);
    }
    records.push(rec);
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 4. Batman: The Riddler's Pattern
// ═══════════════════════════════════════════════════════════════
export function generateGothamLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-10-31T19:00:00Z");
  const districts = ["downtown", "arkham", "gotham_heights", "crime_alley", "wayne_tower", " GCPD"];
  const crimes = ["vandalism", "theft", "assault", "riddle_left", "hostage", "bomb_threat"];
  const clues = [
    "what_has_keys_but_no_locks",
    "the_more_you_take_the_more_you_leave_behind",
    "i_speak_without_a_mouth",
    "no_clue",
    "no_clue",
    "no_clue",
  ];
  const responders = ["batman", "robin", " GCPD", "gordon", "no_response"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 15, 180);
    const district = randItem(rng, districts);
    const crime = randItem(rng, crimes);
    const clue = crime === "riddle_left" ? randItem(rng, clues.slice(0, 3)) : "no_clue";
    const severity = crime === "bomb_threat" ? "critical" : crime === "hostage" ? "high" : crime === "assault" ? "high" : randItem(rng, ["low", "medium"]);

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      district,
      crime_type: crime,
      riddle_clue: clue,
      severity,
      responded_by: randItem(rng, responders),
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 5. Cyborg: Titans Tower Breach
// ═══════════════════════════════════════════════════════════════
export function generateTitansLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-07-04T22:00:00Z");
  const rooms = ["main_hall", "kitchen", "training_room", "garage", "roof", "basement", "communication_center"];
  const cards = Array.from({ length: 30 }, (_, i) => `CARD-${200 + i}`);
  const actions = ["entry", "exit", "alarm_triggered"];
  const heroes = ["robin", "starfire", "raven", "beast_boy", "cyborg", "none"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 5, 120);
    const card = randItem(rng, cards);
    const action = randItem(rng, actions);
    const hero = randItem(rng, heroes);

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      room: randItem(rng, rooms),
      access_card: card,
      action,
      hero_present: hero,
      anomaly_detected: action === "alarm_triggered",
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 6. Sherlock: The Hound of Database
// ═══════════════════════════════════════════════════════════════
export function generateBakerStreetLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-03-10T09:00:00Z");
  const databases = ["scotland_yard", "mi6", "hospital_records", "financial", "transport"];
  const queries = ["SELECT", "INSERT", "UPDATE", "DELETE", "DUMP"];
  const ips = Array.from({ length: 50 }, (_, i) => `192.168.${randInt(rng, 1, 255)}.${randInt(rng, 1, 254)}`);

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 3, 60);
    const db = randItem(rng, databases);
    const query = randItem(rng, queries);
    const ip = randItem(rng, ips);
    const rows = randInt(rng, 1, 5000);
    const suspicious = query === "DUMP" || rows > 3000 || (db === "scotland_yard" && query === "SELECT" && rows > 1000);

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      database: db,
      query_type: query,
      client_ip: ip,
      rows_accessed: rows,
      suspicious_flag: suspicious,
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 7. Spider-Man: Mysterio's Illusion Web
// ═══════════════════════════════════════════════════════════════
export function generateDailyBugleLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-06-15T10:00:00Z");
  const servers = ["web-01", "web-02", "api-01", "cdn-01", "db-01"];
  const urls = ["/home", "/news", "/spider-man", "/mysterio", "/api/feed", "/admin", "/health"];
  const codes = [200, 200, 200, 301, 404, 500, 503];
  const layers = ["reality", "illusion_1", "illusion_2", "illusion_3"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 1, 20);
    const code = randItem(rng, codes);
    const layer = randItem(rng, layers);
    const reality = layer === "reality" && code === 200;

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      server: randItem(rng, servers),
      request_url: randItem(rng, urls),
      response_code: code,
      illusion_layer: layer,
      reality_check: reality,
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 8. Doctor Strange: Time Heist at the Sanctum
// ═══════════════════════════════════════════════════════════════
export function generateSanctumLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-11-05T00:00:00Z");
  const timelines = ["earth-616", "earth-838", "dark_dimension", "mirror_dimension", "ancient_one_era"];
  const artifacts = ["time_stone", "eye_of_agamotto", "book_of_cagliostro", "wand_of_watoomb", "cloak_of_levitation"];
  const actions = ["borrowed", "returned", "stolen", "inspected", "relocated"];
  const wardens = ["strange", "wong", "ancient_one", "mordo", "no_warden"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 30, 300);
    const action = randItem(rng, actions);
    const tempSig = `${randInt(rng, 1000, 9999)}-${randItem(rng, ["alpha", "beta", "gamma", "delta"])}`;

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      timeline: randItem(rng, timelines),
      artifact: randItem(rng, artifacts),
      action,
      temporal_signature: tempSig,
      warden: randItem(rng, wardens),
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 9. Black Panther: Vibranium Theft in Wakanda
// ═══════════════════════════════════════════════════════════════
export function generateWakandaLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2024-08-20T06:00:00Z");
  const shafts = ["shaft-A", "shaft-B", "shaft-C", "shaft-D"];
  const miners = Array.from({ length: 25 }, (_, i) => `MINER-${50 + i}`);
  const gates = ["gate-north", "gate-south", "gate-east"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 10, 120);
    const miner = randItem(rng, miners);
    const kg = parseFloat((rng() * 50 + 5).toFixed(2));
    const scanned = rng() < 0.85;
    const level = randItem(rng, ["low", "medium", "high", "classified"]);

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      mine_shaft: randItem(rng, shafts),
      miner_id: miner,
      vibranium_kg: kg,
      exit_gate: randItem(rng, gates),
      scanned,
      security_level: level,
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 10. WALL-E: The Rogue Bot on the Axiom
// ═══════════════════════════════════════════════════════════════
export function generateAxiomLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2805-01-01T12:00:00Z");
  const decks = ["deck-1", "deck-2", "deck-3", "deck-4", "deck-5", "bridge"];
  const bots = Array.from({ length: 30 }, (_, i) => `BOT-${300 + i}`);
  const tasks = ["clean", "repair", "serve", "sabotage", "inspect"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 5, 90);
    const bot = randItem(rng, bots);
    const task = randItem(rng, tasks);
    const waste = randInt(rng, 0, 100);
    const override = task === "sabotage" || (rng() < 0.08 && task !== "clean");

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      deck: randItem(rng, decks),
      bot_id: bot,
      task,
      waste_level: waste,
      directive_override: override,
    });
  }
  return records;
}

// ═══════════════════════════════════════════════════════════════
// 11. Doraemon: The Gadget Thief
// ═══════════════════════════════════════════════════════════════
export function generateFutureStoreLogs(count: number, seed: number): DQLRecord[] {
  const rng = seededRandom(seed);
  const baseTime = new Date("2112-09-03T10:00:00Z");
  const aisles = ["time_travel", "space_gadgets", "memory_bread", "anywhere_door", "gadget_copies"];
  const customers = Array.from({ length: 40 }, (_, i) => `CUST-${1000 + i}`);
  const gadgets = ["anywhere_door", "bamboo_copter", "time_cloth", "memory_bread", "small_light", "big_light", "gadget_copies"];
  const payments = ["cash", "credit", "future_pay", "nobita_wallet", "stolen"];

  const records: DQLRecord[] = [];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    elapsed += randInt(rng, 5, 60);
    const gadget = randItem(rng, gadgets);
    const payment = randItem(rng, payments);
    const price = parseFloat((rng() * 500 + 10).toFixed(2));
    const delta = payment === "stolen" ? -1 : payment === "future_pay" ? 0 : -1;

    records.push({
      timestamp: formatTimestamp(baseTime, elapsed),
      aisle: randItem(rng, aisles),
      customer_id: randItem(rng, customers),
      gadget,
      price,
      payment_method: payment,
      inventory_delta: delta,
    });
  }
  return records;
}
