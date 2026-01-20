/** Organisation-related TypeScript types matching the management-service API contract. */

import type { ApiResponse } from "@/features/auth/types/auth.types";

// * Status lifecycle: pending_review → active (approved) or suspended (rejected)
export type OrgStatus = "pending_review" | "approved" | "active" | "suspended";

export type OrgPlan = "free" | "starter" | "pro" | "ngo" | "enterprise";

export type OrgMemberRole = "owner" | "admin" | "manager" | "member";

export type OrgType = "company" | "ngo" | "community" | "educational" | "government" | "individual";

export type OrgDocType = "registration_cert" | "pan_card" | "tax_clearance" | "logo" | "other";

/** Matches OrgResponseSerializer from management-service. */
export type Organisation = {
  id: string;
  created_by: string;
  name: string;
  slug: string;
  contact_email: string;
  description: string;
  website: string;
  logo_url: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  org_type: OrgType;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  linkedin_url: string;
  status: OrgStatus;
  is_verified: boolean;
  plan: OrgPlan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Matches OrgMemberResponseSerializer. */
export type OrgMember = {
  id: string;
  organisation_id: string;
  user_id: string;
  role: OrgMemberRole;
  is_active: boolean;
  joined_at: string;
};

/** Matches OrgDocumentResponseSerializer. */
export type OrgDocument = {
  id: string;
  organisation_id: string;
  doc_type: OrgDocType;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
};

/** POST /organisations/ — create request body. */
export type CreateOrgRequest = {
  name: string;
  slug: string;
  contact_email: string;
  description?: string;
  website?: string;
  logo_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  org_type?: OrgType;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
};

/** POST /{org_id}/documents/ — upload document request body. */
export type UploadDocRequest = {
  doc_type: OrgDocType;
  file_url: string;
  file_name: string;
  file_size?: number;
};

/** POST /{org_id}/members/ — add member request body. */
export type AddMemberRequest = {
  user_id: string;
  role: OrgMemberRole;
};

// ! Response wrappers — backend wraps everything in { data, error, meta }
export type OrgResponse = ApiResponse<Organisation>;
export type OrgListResponse = ApiResponse<Organisation[]>;
export type OrgMemberResponse = ApiResponse<OrgMember>;
