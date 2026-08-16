import {
  pgTable,
  text,
  varchar,
  char,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const genreEnum = pgEnum("genre", ["M", "F"]);
export const roleEnum = pgEnum("role_recruteur", ["joueur", "spectateur"]);
export const statutPromesseEnum = pgEnum("statut_promesse", [
  "en_attente",
  "presente",
  "en_litige",
]);

// ─── Bénévoles ─────────────────────────────────────────────────────────────────
export const benevoles = pgTable("benevoles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  prenom: varchar("prenom", { length: 100 }).notNull(),
  pin: char("pin", { length: 6 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("benevole"), // 'benevole' | 'organisateur'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Configuration du Match ─────────────────────────────────────────────────
export const matchConfig = pgTable("match_config", {
  id: integer("id").primaryKey().default(1),
  scoreBonusGarcons: integer("score_bonus_garcons").notNull().default(0),
  scoreBonusFilles: integer("score_bonus_filles").notNull().default(0),
  objectifGlobal: integer("objectif_global").notNull().default(50),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Participants (Recruteurs) ──────────────────────────────────────────────
export const participants = pgTable("participants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull(),
  telephone: varchar("telephone", { length: 20 }).notNull().unique(),
  genre: genreEnum("genre").notNull(),
  roleParticipant: roleEnum("role_participant").notNull(),
  saisiParBenevoleId: varchar("saisi_par_benevole_id", { length: 36 }),
  pointeParBenevoleId: varchar("pointe_par_benevole_id", { length: 36 }),
  timestampPointage: timestamp("timestamp_pointage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Promesses de Don ──────────────────────────────────────────────────────
export const promesses = pgTable("promesses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recruteurId: varchar("recruteur_id", { length: 36 })
    .notNull()
    .references(() => participants.id),
  nomPersonnePromise: varchar("nom_personne_promise", { length: 200 }).notNull(),
  telephonePersonnePromise: varchar("telephone_personne_promise", {
    length: 20,
  })
    .notNull()
    .unique(),
  statut: statutPromesseEnum("statut").notNull().default("en_attente"),
  saisiParBenevoleId: varchar("saisi_par_benevole_id", { length: 36 }),
  pointeParBenevoleId: varchar("pointe_par_benevole_id", { length: 36 }),
  timestampEnregistrement: timestamp("timestamp_enregistrement")
    .defaultNow()
    .notNull(),
  timestampPointage: timestamp("timestamp_pointage"),
});

// ─── Donneurs Spontanés ────────────────────────────────────────────────────
export const donneursSpontanes = pgTable("donneurs_spontanes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  nom: varchar("nom", { length: 200 }).notNull(),
  telephone: varchar("telephone", { length: 20 }).notNull().unique(),
  pointeParBenevoleId: varchar("pointe_par_benevole_id", { length: 36 }),
  timestampPointage: timestamp("timestamp_pointage").defaultNow().notNull(),
});

// ─── Journal d'audit ───────────────────────────────────────────────────────
export const auditLog = pgTable("audit_log", {
  id: varchar("id", { length: 36 }).primaryKey(),
  benevoleId: varchar("benevole_id", { length: 36 }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: varchar("entity_id", { length: 36 }),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ─────────────────────────────────────────────────────────────
export const participantsRelations = relations(participants, ({ many }) => ({
  promesses: many(promesses),
}));

export const promessesRelations = relations(promesses, ({ one }) => ({
  recruteur: one(participants, {
    fields: [promesses.recruteurId],
    references: [participants.id],
  }),
}));

// ─── Types inférés ──────────────────────────────────────────────────────────
export type Benevole = typeof benevoles.$inferSelect;
export type InsertBenevole = typeof benevoles.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;
export type Promesse = typeof promesses.$inferSelect;
export type InsertPromesse = typeof promesses.$inferInsert;
export type DonneurSpontane = typeof donneursSpontanes.$inferSelect;
export type InsertDonneurSpontane = typeof donneursSpontanes.$inferInsert;
export type MatchConfig = typeof matchConfig.$inferSelect;
