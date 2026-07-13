import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  numeric,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables (camelCase columns match Better Auth defaults — do not rename)
// ---------------------------------------------------------------------------

export const themeEnum = pgEnum("theme", ["light", "dark", "system"])

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // Profile & preferences (persisted, never hardcoded)
  timezone: text("timezone"),
  country: text("country"),
  theme: themeEnum("theme").notNull().default("system"),
  bio: text("bio"),
  notificationPrefs: jsonb("notification_prefs"),
  // Legal consent
  acceptedTerms: boolean("accepted_terms").notNull().default(false),
  acceptedPrivacyPolicy: boolean("accepted_privacy_policy").notNull().default(false),
  acceptedLegalVersion: text("accepted_legal_version").notNull().default("1.0"),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// ---------------------------------------------------------------------------
// App tables — scoped per user via the userId column (no FK by design)
// ---------------------------------------------------------------------------

export const portfolioHolding = pgTable("portfolio_holding", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  assetType: text("assetType"),
  quantity: numeric("quantity").notNull().default("0"),
  avgPrice: numeric("avgPrice").notNull().default("0"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const watchlistItem = pgTable("watchlist_item", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  assetType: text("assetType"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const notification = pgTable("notification", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull().default("general"),
  title: text("title").notNull(),
  body: text("body"),
  symbol: text("symbol"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const savedAnalysis = pgTable("saved_analysis", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  symbol: text("symbol").notNull(),
  name: text("name"),
  kind: text("kind").notNull().default("analysis"),
  summary: text("summary"),
  confidence: integer("confidence"),
  direction: text("direction").notNull().default("neutral"),
  data: jsonb("data"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const chatConversation = pgTable("chat_conversation", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull().default("New chat"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const chatMessage = pgTable("chat_message", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => chatConversation.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  tokens: integer("tokens").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const userAgreement = pgTable("user_agreement", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  agreedToPrivacy: boolean("agreed_to_privacy").notNull().default(false),
  agreedAt: timestamp("agreed_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
})
