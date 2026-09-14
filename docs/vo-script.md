# still-true — demo VO script

Spoken lines only. Shot order, stage directions, and the `IF THIS HAPPENS`
table live on `docs/shoot-card.md`.

> **Every line below exists on `docs/shoot-card.md` or is a bracket.** Two
> brackets, both filled from footage: `[N]` in B and `[timestamp]` in C. A, D
> and E carry no bracket and render before the shoot. No relative-time word
> appears anywhere, because A, D and E are rendered under locked settings and
> have to stay true on whatever day you record.

---

## A — what it never says

**On screen:** the health plan card, four refusals, no scrolling.

> You can read a document once. You can't notice what it doesn't say, there's nothing there to notice.
>
> This is the government's model health plan summary. The form every insurer fills in.
>
> No single line of it tells you how to cancel your coverage.
>
> Something read every line to be able to say that. I opened the source PDF and checked it by hand.

## B — why you can believe it

**On screen:** the forward, the reply landing, then the quote checked against the lease with Ctrl+F.

> Here's the same thing, live, on a document you can go read yourself.
>
> No app. No upload. No account. I sent it to an email address.
>
> That took about a minute.
>
> Every claim comes back with a sentence from the document and the line it's on.
>
> The plain sentence is the model's summary. The quote under it isn't.
>
> The model returns a line number. The server cuts that sentence out of your document by index, after the model is done talking.
>
> So it can't show you a sentence that isn't in your document.

## C — the change nobody asked for

**On screen:** the fixture as it now reads, then the notice in the inbox with its timestamp.

> This page is a fixture I control. I changed it, on purpose, before the watch's next run, and I'm telling you so the next part means something.
>
> I asked one question about this page. Once, and then left it alone.
>
> That arrived at 6:18 in the morning. I didn't run it. It's a daily job, and it found this while nobody was looking.
>
> Two things I'd quoted don't read the same way. It's not telling me the lease got worse, it isn't qualified to judge that. It's telling me these aren't the words that were there.
>
> It won't email you because a model answered differently on a Tuesday. A change is reported when the hash of the text moved and the exact clause it quoted is gone. Both gates are string comparisons. Neither asks the model again.

## D — what it does when it is wrong

**On screen:** the no-document reply, then the health plan refusal.

> When it can't do the job it says so. It doesn't invent a document to talk about.
>
> This used to say "this document does not state it." A test document proved that can be false, a fact split across two lines is in the document and on no single line of it.
>
> So now it says what it actually knows: no single line states it. That's weaker than what I shipped, and it's the version that's true.
>
> Here's the one that's still open. An answer can out-run the line it cites: the quote is really in your document, and the line it points at can still fail to state the answer by itself. It's the highest thing on my list and it isn't fixed.
>
> Everything currently wrong with this is in the repo, scored, with the fixed ones still on the page so nobody rediscovers them.

## E — the stack

**On screen:** the reply. Not a logo.

> Convex is the whole backend. One deployment: the schema, the documents and findings, the daily cron, the reactive queries behind that page, the workpool that retries a failed re-check, the HTTP action the mail webhook hits, and the site itself. No server. No separate host. No queue.
>
> AgentMail is the inbox. Firecrawl parses the PDFs.
>
> There's no app. The interface is your mail client. One question, forwarded once, answered with receipts, and watched until it stops being true.

---

## Delivery notes

- Flat, factual read, no lift at the end of sentences.
- The numbers do the work.
- Silence between segments is a cut in the timeline, not a breath — do not try to make the audio produce it.

## Words that don't appear in this script

`just` · `simple` · `only` · `a little` · `kind of` · `sort of` · `hopefully` · `I'm still learning` · `two years in`

If one shows up in a rewrite at 1am, it's the undersell talking — cut it and re-render that segment.
