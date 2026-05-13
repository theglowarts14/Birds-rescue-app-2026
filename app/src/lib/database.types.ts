// Generated stub. Run `npm run db:types` against your local Supabase project
// to regenerate this file from the live schema. Keep in sync with
// supabase/migrations/0001_init.sql.

export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type CaseStatus = 'critical' | 'in-rescue' | 'recovering' | 'released' | 'closed-unrescued';
export type CaseUrgency = 'critical' | 'moderate' | 'low';
export type CaseKind = 'bird' | 'animal' | 'wildlife';
export type CaseProblem = 'injured' | 'stuck' | 'orphaned' | 'cruelty';
export type OrgRole = 'owner' | 'coordinator' | 'vet' | 'field' | 'foster' | 'awareness';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  public_name: string | null;
  tagline: string | null;
  helpline_e164: string | null;
  city: string | null;
  founded_year: number | null;
  pan: string | null;
  brand_primary: string | null;
  brand_logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  phone_e164: string | null;
  email: string | null;
  pan: string | null;
  preferred_lang: 'en' | 'te' | 'hi';
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  on_shift: boolean;
  current_status: 'on-duty' | 'in-field' | 'on-call' | 'off-duty';
  joined_at: string;
}

export interface Case {
  id: string;
  org_id: string;
  short_id: string;
  kind: CaseKind;
  problem: CaseProblem;
  status: CaseStatus;
  urgency: CaseUrgency;
  species_id: string | null;
  species_freetext: string | null;
  threat_summary: string | null;
  notes: string | null;
  location_text: string | null;
  area: string | null;
  lat: number | null;
  lng: number | null;
  reporter_id: string | null;
  reporter_anon: boolean;
  assigned_to: string | null;
  sponsor_id: string | null;
  cost_inr: number;
  received_at: string;
  rescued_at: string | null;
  released_at: string | null;
  closed_reason: string | null;
}

export interface CaseWithSpecies extends Case {
  species_name: string | null;
  species_emoji: string | null;
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      profiles:      { Row: Profile;      Insert: Partial<Profile>;      Update: Partial<Profile> };
      org_members:   { Row: OrgMember;    Insert: Partial<OrgMember>;    Update: Partial<OrgMember> };
      cases:         { Row: Case;         Insert: Partial<Case>;         Update: Partial<Case> };
    };
    Views: { cases_with_species: { Row: CaseWithSpecies } };
    Functions: { my_org_ids: { Args: Record<string, never>; Returns: string[] } };
    Enums: {
      case_status: CaseStatus;
      case_urgency: CaseUrgency;
      case_kind: CaseKind;
      case_problem: CaseProblem;
      org_role: OrgRole;
    };
  };
}
