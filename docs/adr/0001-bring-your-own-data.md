---
status: accepted (to be revisited)
---

# Bring your own data

Meet files contain real swimmers' names, birth years and clubs, published by organizers without an open license. For now the app ships, hosts and republishes no meet data: each person loads a LENEX file they obtained themselves, and the bundled `samples/` are for local development only. Because the app itself contains no data, it may be hosted publicly as a static site, on one condition: a loaded file is read only in the visitor's browser and never leaves it. Whether and how we may collect or republish meet data (including live timing) is an open discussion; revisit this ADR when it is settled.
