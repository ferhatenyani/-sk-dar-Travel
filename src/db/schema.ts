import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/* ——— Better Auth (tables requises par l'adaptateur Drizzle) ——— */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ——— CMS : services ——— */

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  /** Prix affiché tel quel (ex. « À partir de 45 000 DA ») — optionnel. */
  price: text("price"),
  imageUrl: text("image_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ——— CMS : galerie (sections N-N cartes globales) ——— */

export const gallerySections = pgTable("gallery_sections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const galleryCards = pgTable("gallery_cards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull().default(""),
  alt: text("alt").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sectionCards = pgTable(
  "section_cards",
  {
    sectionId: integer("section_id")
      .notNull()
      .references(() => gallerySections.id, { onDelete: "cascade" }),
    cardId: integer("card_id")
      .notNull()
      .references(() => galleryCards.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.sectionId, t.cardId] })],
);

export const gallerySectionsRelations = relations(gallerySections, ({ many }) => ({
  sectionCards: many(sectionCards),
}));

export const galleryCardsRelations = relations(galleryCards, ({ many }) => ({
  sectionCards: many(sectionCards),
}));

export const sectionCardsRelations = relations(sectionCards, ({ one }) => ({
  section: one(gallerySections, {
    fields: [sectionCards.sectionId],
    references: [gallerySections.id],
  }),
  card: one(galleryCards, {
    fields: [sectionCards.cardId],
    references: [galleryCards.id],
  }),
}));

/* ——— CMS : réglages du site (ligne unique id = 1) ——— */

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  heroTitle: text("hero_title").notNull().default(""),
  heroText: text("hero_text").notNull().default(""),
  /** Bannière hero de l'accueil (uploadable, nullable). */
  heroImageUrl: text("hero_image_url"),
  aboutText: text("about_text").notNull().default(""),
  phone: text("phone").notNull().default(""),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  logoUrl: text("logo_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/* ——— Types ——— */

export type Service = typeof services.$inferSelect;
export type GallerySection = typeof gallerySections.$inferSelect;
export type GalleryCard = typeof galleryCards.$inferSelect;
export type SectionCard = typeof sectionCards.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
