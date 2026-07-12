import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  numeric,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Better Auth tables (camelCase columns match Better Auth defaults — do not rename)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
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
