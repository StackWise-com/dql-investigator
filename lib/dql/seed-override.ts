import { setOverrideSeed } from "./log-generator";
import { getCurrentBucketId } from "./bucket";

// Set the global log-generator seed to the current live bucket BEFORE
// any scenario modules are imported so that all case data is generated
// with fresh seeds instead of hard-coded static ones.
const seed = getCurrentBucketId();
setOverrideSeed(seed);
