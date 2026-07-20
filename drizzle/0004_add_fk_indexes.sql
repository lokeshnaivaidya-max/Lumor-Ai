-- Performance indexes for frequently queried foreign-key / lookup columns.
-- Idempotent so it is safe to re-run; these are not represented as schema
-- objects (kept out of schema.ts to avoid drizzle-kit generate churn).
CREATE INDEX IF NOT EXISTS "portfolio_holding_userId_idx" ON "portfolio_holding" ("userId");
CREATE INDEX IF NOT EXISTS "watchlist_item_userId_idx" ON "watchlist_item" ("userId");
CREATE INDEX IF NOT EXISTS "notification_userId_idx" ON "notification" ("userId");
CREATE INDEX IF NOT EXISTS "saved_analysis_userId_idx" ON "saved_analysis" ("userId");
CREATE INDEX IF NOT EXISTS "chat_conversation_userId_idx" ON "chat_conversation" ("userId");
CREATE INDEX IF NOT EXISTS "chat_message_conversation_id_idx" ON "chat_message" ("conversation_id");
