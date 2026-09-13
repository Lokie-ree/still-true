# still-true — demo VO script (2:30)

Target: ~150s. Read pace ~140 wpm with real pauses. Each segment is its own audio file so you can re-render one line without touching the rest.

**Rule for every line below:** it points at something on screen at that moment. If a line has nothing to point at, it's inspiration and it gets cut.

---

## A — The refusal (0:00–0:28)

**On screen:** board open on a refusal card. Empty gutter. Hold it. No cursor movement for the first two seconds.

> This is a question the system was asked and would not answer.
>
> It searched a hundred and seventy-four lines and said the answer isn't in the document.
>
> A refusal is a first-class output here. It gets its own line count, and an empty gutter where the quote would be.
>
> Everything after this is about making that refusal worth believing.

---

## B — Live forward, verified by hand (0:28–1:10)

**On screen:** Gmail forward to still-true@agentmail.to → reply arriving → copy quote → source PDF → Ctrl+F → match highlights.

> I'm forwarding a Summary of Benefits from my own inbox.
>
> *(hold on the round trip — let it take as long as it takes)*
>
> Twenty-three seconds. Four answered, four refused. Unedited.
>
> Every answer carries a line number. The model never writes the quote — it returns an index, and the quote is pulled from the source by that index.
>
> So the check is: copy the quote, open the original, Ctrl+F.
>
> A fabricated quote isn't something this system can express. That isn't a rule I asked it to follow.

**Cut note:** if you trim the round trip, put `23s — unedited` on screen. Don't let a fast cut do the lying.

---

## C — SLOT: the unprompted change notice (1:10–1:45)

**Fill after 6:17.** Draft below — swap the bracketed values for whatever the receipt actually says.

**On screen:** the change notice in the inbox, timestamped. Then the diff: old clause, new clause.

> Nobody asked it for this.
>
> At 6:17 this morning the daily watch re-read a document it had already answered on.
>
> [The hash moved, and the clause it had quoted is gone.]
>
> Two gates have to fire before anyone gets mail: the content hash changed, **and** the quoted clause is missing. Either one alone mails nobody.
>
> Full disclosure — I made that edit myself so you could watch it land. The watch is real and running on real documents. The edit is mine.

**Do not** bump `PARSER_VERSION` between the fixture enrolment and the fixture edit. The freeze holds until this beat is in the can.

---

## D — What it does when it's wrong (1:45–2:12)

**On screen:** the published late-fee answer beside the line it cites. Then `docs/READINESS.md` with the scored flags.

> Here's where it's currently wrong.
>
> Published answer: the late fee is fifty dollars. The line it cites reads only "Dollars, fifty dollars, for that month." The answer out-ran its own citation. It's open, it's scored, and it has a fix order.
>
> I scored this project at ninety-two, twice, by reading my own code. Then I started sending it mail. It's at sixty-seven.
>
> Every point it lost this week, it lost to evidence.

---

## E — The stack (2:12–2:30)

**On screen:** `npm run gate` running, 6/6 green.

> Convex for the backend. AgentMail for the inbox. Firecrawl for the parse. OpenAI for extraction.
>
> Six read-only checks run against production. They've caught my own README drifting three times.
>
> The hard problem here was never generating the answer. It was knowing when to stop trusting one. That's a state machine, not a model.

---

## Delivery notes

- Flat, factual read. No lift at the end of sentences. The numbers do the work; don't help them.
- Same voice and same settings across all six segments, or the joins will click. Generate one segment, listen, lock the settings, then batch the rest.
- Record the pauses into the video, not the audio. Silence between segments is a cut, not a breath.

## Words that don't appear in this script

`just` · `simple` · `only` · `a little` · `kind of` · `sort of` · `hopefully` · `I'm still learning` · `two years in`

If one shows up in a rewrite at 1am, it's the undersell talking. Cut it and re-render that segment.