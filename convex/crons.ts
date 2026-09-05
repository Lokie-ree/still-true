import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

// Once a day. Consumer agreements and leases change on the scale of quarters,
// not minutes, and every check that finds nothing still costs a Firecrawl
// scrape. Daily is the slowest cadence that still lets a person say "it told me
// the day after it happened," which is the promise; anything faster spends
// money to shorten a sentence nobody reads.
//
// The built-in scheduler rather than @convex-dev/crons, deliberately: that
// component exists to register and delete schedules at RUNTIME, and this
// schedule is one line that never changes. Installing it would have been
// complexity bought for the look of it.
//
// :17 rather than :00 because the top of the hour is the busiest minute on the
// clock and this job is in no hurry whatsoever.
const crons = cronJobs();

crons.daily(
  "re-check every watched document",
  { hourUTC: 11, minuteUTC: 17 },
  internal.watch.sweep,
  {},
);

export default crons;
