# Configuration

`config/hospital.config.ts` is the sole hospital identity source. Identity, Thai location, branding, installed-module ceiling, default flags, confirmed water selections, and integration flags are typed and validated. `installed` is a hard ceiling; runtime settings cannot enable anything outside it.

The example deliberately uses `CHANGE_ME`, hcode `00000`, and coordinates `0,0`. Production and normal doctor checks reject these. Water discovery returns suggestions only. An operator must confirm choices and river direction; upstream stations are invalid while `riverChain.status` is `unconfirmed`. Setup never changes selections silently.
