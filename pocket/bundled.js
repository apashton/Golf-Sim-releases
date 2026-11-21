// In the Android app the game page's code is one bundle (tools/androidweb.mjs
// bundleGame), the pocket server in it: this, its first module, hands the
// server to the page's pocket start (pocket/start.js), which waits for it
// rather than loading it file by file - before the game's own modules ask
// it anything (they wait for it all the same).
import * as pocket from "./pocket.mjs";

window.pocketModule?.(pocket);
