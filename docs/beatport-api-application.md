# Beatport API access — application (paste-ready)

**Why:** to upgrade sam.toys/tracks from Beatport *search* links to *direct* buy links (needs read access to Beatport's catalog search + track metadata incl. ISRC).

**Where to submit:** https://partnerportal.beatport.com/hc/en-us/requests/new
**How:** open it in a normal browser **while signed in to your Beatport account** (the form is Cloudflare + login gated — that's why it can't be automated). Fill the fields below.

**Realistic odds:** access is de-facto "partners only" — hobbyist requests are often ignored or slow (weeks, no SLA). Non-commercial use is explicitly allowed by their terms, so the non-commercial framing below is the best angle. Worst case: no reply, and /tracks stays on the free search links (no harm).

---

## Field-by-field

**Applicant / name:** Sam Mathews (individual developer — non-commercial)
**Contact email:** sam@fnatic.com
**App or website name & URL:** sam.toys/tracks — https://sam.toys/tracks

**Intended API usage:**
> sam.toys/tracks is a personal, non-commercial tool that turns my Spotify playlists and my Rekordbox library into a buy list. I'd like read-only access to Beatport's catalog search and track metadata (title, artist, mix/remix name, and ISRC where available) so I can resolve each of my tracks to its exact Beatport release and link straight to its purchase page. The tool's entire purpose is to send me — and anyone I share it with — to Beatport to buy music; every purchase happens on beatport.com. I don't cache, redistribute, resell, or train models on Beatport data.

**How the Beatport brand / content is represented to end users:**
> Beatport is presented as the primary place to buy each track. Every matched track shows a "Buy on Beatport" button linking directly to that track's Beatport page (falling back to a Beatport search when an exact match isn't found). Beatport is credited as the source; nothing is stored beyond the outbound link, and nothing is scraped.

**OAuth2 callback / redirect URI (if/when they issue credentials):**
> https://sam.toys/api/beatport/callback

---

When approved, ping me the `client_id` / `client_secret` — swapping the Beatport buttons from search → direct links is ~30 min of work on `api/tracks-resolve` + the client.
