import { scenario01 } from "./scenario_01_silent_crash";
import { scenario02 } from "./scenario_02_memory_leak";
import { scenario03 } from "./scenario_03_phantom_404";
import { scenario04 } from "./scenario_04_rogue_deployment";
import { scenario05 } from "./scenario_05_dns_tunneling";
import { scenario06 } from "./scenario_06_cert_expiry";
import { scenario07 } from "./scenario_07_resource_starvation";
import { scenario08 } from "./scenario_08_crypto_miner";
import { scenario09 } from "./scenario_09_compliance_breach";
import { scenario10 } from "./scenario_10_cascading_catastrophe";
import type { ScenarioV2 } from "../../types/scenario";

export const ALL_SCENARIOS: ScenarioV2[] = [
  scenario01,
  scenario02,
  scenario03,
  scenario04,
  scenario05,
  scenario06,
  scenario07,
  scenario08,
  scenario09,
  scenario10,
];
