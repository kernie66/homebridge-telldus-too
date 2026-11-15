---
'homebridge-telldus-too': patch
---

Fix accessories being rejected on Homebridge 2.x ("Accessory Out of Compliance"). Custom characteristics now use `Perms.PAIRED_READ`/`Perms.PAIRED_WRITE` instead of the removed `Perms.READ`/`Perms.WRITE`, and invalid permissions already saved in cached accessories are repaired at startup, so the cache doesn't need to be cleared.
