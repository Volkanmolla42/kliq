import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Her gün saat 03:00'da eski rate limit kayıtlarını temizle
crons.interval(
  "cleanup-rate-limits",
  { hours: 24 }, // Her 24 saatte bir
  internal.rateLimit.cleanupOldRecords,
  {}
);

export default crons;

