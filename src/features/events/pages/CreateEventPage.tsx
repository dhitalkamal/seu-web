import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import { cn } from "@/shared/lib/cn";
import { useEventCategories, useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import eventsApi from "@/features/events/api/events.api";
import EventMap from "@/shared/components/EventMap";
import apiClient from "@/shared/api/client";
import { useOrgStore } from "@/shared/store/org.store";
import type {
  Category,
  CreateEventRequest,
  EventVisibility,
} from "@/features/events/types/event.types";

// * --- Step Definitions ------------------------------------------------------

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { icon: "edit_note", label: "Basics" },
  { icon: "calendar_month", label: "Schedule & Location" },
  { icon: "confirmation_number", label: "Tickets & Access" },
  { icon: "photo_library", label: "Media & Review" },
] as const;

// * --- Form State ------------------------------------------------------------

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  speaker: string;
};

type TicketTier = {
  id: string;
  name: string;
  price: string;
  capacity: number;
  description: string;
};

type FormState = {
  title: string;
  description: string;
  category_id: string;
  tag_ids: string[];
  cover_image: string;
  start_date: string;
  end_date: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  is_online: boolean;
  online_url: string;
  capacity: number;
  visibility: EventVisibility;
  is_free: boolean;
  price: string;
  allowed_domains: string[];
  schedule: ScheduleItem[];
  ticket_tiers: TicketTier[];
  volunteers_enabled: boolean;
  volunteer_roles: { name: string; description: string; capacity: number }[];
  networking_enabled: boolean;
  auto_community: boolean;
  sponsor_ids: string[];
};

const INITIAL: FormState = {
  title: "",
  description: "",
  category_id: "",
  tag_ids: [],
  cover_image: "",
  start_date: "",
  end_date: "",
  location: "",
  latitude: null,
  longitude: null,
  is_online: false,
  online_url: "",
  capacity: 100,
  visibility: "public",
  is_free: true,
  price: "0.00",
  allowed_domains: [],
  schedule: [],
  ticket_tiers: [],
  volunteers_enabled: false,
  volunteer_roles: [],
  networking_enabled: false,
  auto_community: true,
  sponsor_ids: [],
};

// * --- Shared Styles ---------------------------------------------------------

const labelCls =
  "block text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--on-mut)] mb-1.5 font-['JetBrains_Mono']";

const inputCls =
  "w-full rounded-[10px] border border-[var(--mid)] bg-[var(--low)] px-3.5 py-2.5 text-sm text-[var(--on-bg)] outline-none font-['Manrope'] placeholder:text-[var(--on-mut)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors";

const selectCls =
  "w-full rounded-[10px] border border-[var(--mid)] bg-[var(--low)] px-3.5 py-2.5 text-sm text-[var(--on-bg)] outline-none font-['Manrope'] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-colors";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns true when the value is a strict UUID string. */
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// * --- Main Component --------------------------------------------------------

/** Multi-step event creation wizard  - 4 steps covering every backend field. */
export default function CreateEventPage() {
  const navigate = useNavigate();
  const org = useOrgStore((s) => s.org);
  const { createMutation } = useEventMutations();
  const {
    data: categoriesResponse,
    isLoading: categoriesLoading,
    isError: categoriesLoadFailed,
  } = useEventCategories();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [domainInput, setDomainInput] = useState("");
  // Tracks whether the description was flagged by the moderation API.
  // We warn but still allow submission so organizers aren't hard-blocked.
  const [descriptionFlagged, setDescriptionFlagged] = useState(false);
  // Human-readable list of violated categories returned by the moderation API
  const [flaggedCategories, setFlaggedCategories] = useState<string[]>([]);

  // * auto-save tracking
  // latest form state stored in ref so the interval can read it without causing re-renders
  const formRef = useRef<FormState>(INITIAL);
  const [autoSaved, setAutoSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const categories = categoriesResponse?.data ?? [];
  const selectedCategoryLabel =
    categories.find((category) => category.id === form.category_id)?.name ||
    form.category_id ||
    null;

  /** Type-safe field setter - marks the form dirty and updates the ref for auto-save. */
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => {
      const next = { ...p, [key]: value };
      formRef.current = next;
      return next;
    });
    setIsDirty(true);
    setAutoSaved(false);
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  }

  // track saved draft ID so auto-save updates instead of creating duplicates
  const savedIdRef = useRef<string | null>(null);

  // auto-save interval - creates draft on first save, updates on subsequent saves
  useEffect(() => {
    const id = setInterval(async () => {
      if (!isDirty) return;
      const current = formRef.current;
      if (!current.title.trim()) return;

      const payload = {
        title: current.title,
        description: current.description,
        location: current.location,
        start_date: current.start_date
          ? new Date(current.start_date).toISOString()
          : new Date().toISOString(),
        end_date: current.end_date
          ? new Date(current.end_date).toISOString()
          : new Date().toISOString(),
        capacity: current.capacity,
        visibility: current.visibility,
        is_free: current.is_free,
        price: current.is_free ? "0.00" : current.price,
        cover_image: current.cover_image || null,
        is_online: current.is_online,
        online_url: current.online_url || null,
        category_id: null,
        organization_id: org?.id ?? null,
      };

      try {
        if (savedIdRef.current) {
          await eventsApi.updateEvent(savedIdRef.current, payload);
        } else {
          const res = await eventsApi.createEvent(payload);
          savedIdRef.current = res.data.id;
        }
        setIsDirty(false);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 4000);
      } catch {
        // auto-save failure is non-critical
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [isDirty]);

  // * --- Per-step validation -----------------------------------------------

  function validateStep(s: Step): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.title.trim()) e.title = "Title is required.";
      if (!form.description.trim()) e.description = "Description is required.";
    }
    if (s === 1) {
      if (!form.start_date) e.start_date = "Start date is required.";
      if (!form.end_date) e.end_date = "End date is required.";
      if (form.start_date && form.end_date && form.end_date <= form.start_date)
        e.end_date = "End must be after start.";
      if (!form.location.trim() && !form.is_online)
        e.location = "Location is required for in-person events.";
      if (form.is_online && !form.online_url.trim())
        e.online_url = "Meeting link is required for online events.";
    }
    if (s === 2) {
      if (form.capacity < 1) e.capacity = "Capacity must be at least 1.";
      if (!form.is_free && parseFloat(form.price) <= 0) e.price = "Price must be greater than 0.";
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  function goNext() {
    if (validateStep(step)) setStep(Math.min(step + 1, 3) as Step);
  }
  function goBack() {
    setStep(Math.max(step - 1, 0) as Step);
  }

  // * --- Submit ------------------------------------------------------------

  /**
   * Run NLP moderation on the event description before submitting.
   * Unlike the community post flow, a flagged description only shows a
   * warning  - the organizer can still proceed if they choose to.
   */
  async function handleSubmit() {
    // Only run the moderation check when the description is non-empty.
    if (form.description.trim()) {
      try {
        const result = await intelligenceApi.moderateContent(form.description);
        if (result.flagged) {
          // Store the flag so the warning banner renders below the step card.
          setDescriptionFlagged(true);
          setFlaggedCategories(result.categories);
          // We deliberately do NOT return here  - the organizer sees the banner
          // and the submit still fires so they aren't hard-blocked.
        } else {
          // Clear any previous flag in case they edited and re-submitted.
          setDescriptionFlagged(false);
          setFlaggedCategories([]);
        }
      } catch {
        // moderation service unavailable - proceed silently
      }
    }

    const selectedCategoryId =
      isUuid(form.category_id) && categories.some((category) => category.id === form.category_id)
        ? form.category_id
        : null;

    const payload: CreateEventRequest = {
      title: form.title,
      description: form.description,
      location: form.location,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      capacity: form.capacity,
      visibility: form.visibility,
      is_free: form.is_free,
      price: form.is_free ? "0.00" : form.price,
      cover_image: form.cover_image || null,
      is_online: form.is_online,
      online_url: form.online_url || null,
      category_id: selectedCategoryId,
      tag_ids: form.tag_ids.length ? form.tag_ids : undefined,
      allowed_domains: form.allowed_domains.length ? form.allowed_domains : undefined,
      organization_id: org?.id ?? null,
    };

    async function createAndNavigate(eventId: string) {
      // create ticket tiers if any
      if (!form.is_free && form.ticket_tiers.length > 0) {
        for (const tier of form.ticket_tiers) {
          if (!tier.name.trim()) continue;
          try {
            await apiClient.post(`/participation/api/v1/events/${eventId}/ticket-tiers/`, {
              name: tier.name,
              price: tier.price,
              capacity: tier.capacity,
              description: tier.description,
            });
          } catch {
            /* non-fatal */
          }
        }
      }

      // create volunteer roles if enabled
      if (form.volunteers_enabled && form.volunteer_roles.length > 0) {
        for (const role of form.volunteer_roles) {
          if (!role.name.trim()) continue;
          try {
            await apiClient.post("/org/api/v1/volunteers/roles/", {
              event_id: eventId,
              organization_id: org?.id,
              name: role.name,
              description: role.description,
              capacity: role.capacity,
            });
          } catch {
            /* non-fatal */
          }
        }
      }

      navigate(`/org/events/${eventId}`);
    }

    if (savedIdRef.current) {
      try {
        await eventsApi.updateEvent(savedIdRef.current, payload);
        await createAndNavigate(savedIdRef.current);
      } catch {
        // draft update failed - try creating fresh instead
        try {
          const res = await eventsApi.createEvent(payload);
          savedIdRef.current = res.data.id;
          await createAndNavigate(res.data.id);
        } catch {
          // both paths failed
        }
      }
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (res) => createAndNavigate(res.data.id),
    });
  }

  // * --- Domain chip helpers -----------------------------------------------

  function addDomain() {
    const d = domainInput.trim().toLowerCase();
    if (d && !form.allowed_domains.includes(d)) {
      set("allowed_domains", [...form.allowed_domains, d]);
    }
    setDomainInput("");
  }

  function removeDomain(d: string) {
    set(
      "allowed_domains",
      form.allowed_domains.filter((x) => x !== d)
    );
  }

  return (
    <AppLayout variant="org">
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "8px 0 60px" }}>
        {/* step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div
                  onClick={() => {
                    if (i < step) setStep(i as Step);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: i < step ? "pointer" : "default",
                    opacity: active || done ? 1 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: done ? "#16a34a" : active ? "#050a26" : "var(--mid)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <MS n="check" size={16} style={{ color: "white" }} />
                    ) : (
                      <MS
                        n={s.icon}
                        size={16}
                        style={{ color: active ? "white" : "var(--on-mut)" }}
                      />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--on-bg)" : "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: done ? "#16a34a" : "var(--mid)",
                      margin: "0 12px",
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* error banner  - API submission failure */}
        {createMutation.isError && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(232,49,81,0.08)",
              border: "1px solid rgba(232,49,81,0.2)",
              color: "var(--secondary)",
              fontSize: 13,
              fontFamily: "Manrope, sans-serif",
            }}
          >
            {getApiError(createMutation.error)}
          </div>
        )}

        {/* moderation warning banner  - shown when the description triggers a policy flag.
            We warn but never block so the organizer retains full control. */}
        {descriptionFlagged && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.3)",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <MS n="warning" size={18} style={{ color: "#ca8a04", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#92400e",
                  fontFamily: "Manrope, sans-serif",
                  marginBottom: 2,
                }}
              >
                Content advisory
              </p>
              <p
                style={{
                  fontSize: 12.5,
                  color: "#92400e",
                  fontFamily: "Manrope, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                Your event description was flagged for{" "}
                <strong>
                  {flaggedCategories.length ? flaggedCategories.join(", ") : "policy concerns"}
                </strong>
                . Your event has still been submitted - consider reviewing the description before
                publishing.
              </p>
            </div>
          </div>
        )}

        {/* step content card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--mid)",
            borderRadius: 18,
            padding: "32px 32px 24px",
          }}
        >
          {step === 0 && (
            <StepBasics
              form={form}
              set={set}
              errors={errors}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesLoadFailed={categoriesLoadFailed}
            />
          )}
          {step === 1 && (
            <StepSchedule form={form} set={set} errors={errors} orgId={org?.id ?? ""} />
          )}
          {step === 2 && (
            <StepTickets
              form={form}
              set={set}
              errors={errors}
              orgId={org?.id ?? ""}
              domainInput={domainInput}
              setDomainInput={setDomainInput}
              addDomain={addDomain}
              removeDomain={removeDomain}
            />
          )}
          {step === 3 && (
            <>
              <StepGallery eventId={savedIdRef.current} />
              <StepReview form={form} categoryLabel={selectedCategoryLabel} />
            </>
          )}

          {/* navigation bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 24,
              marginTop: 28,
              borderTop: "1px solid var(--outline)",
            }}
          >
            {/* auto-saved indicator */}
            {autoSaved && (
              <span
                style={{
                  position: "absolute",
                  right: 140,
                  fontSize: 11.5,
                  color: "#16a34a",
                  fontFamily: "Manrope, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MS n="cloud_done" size={14} style={{ color: "#16a34a" }} />
                Auto-saved
              </span>
            )}
            {step > 0 ? (
              <button
                onClick={goBack}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "transparent",
                  color: "var(--on-var)",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                }}
              >
                <MS n="arrow_back" size={15} />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={goNext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: "#050a26",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                }}
              >
                Next
                <MS n="arrow_forward" size={15} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 28px",
                  borderRadius: 10,
                  border: "none",
                  background: "#16a34a",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: createMutation.isPending ? "not-allowed" : "pointer",
                  opacity: createMutation.isPending ? 0.6 : 1,
                }}
              >
                <MS n="rocket_launch" size={15} />
                {createMutation.isPending ? "Creating..." : "Create Event"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// * --- Step 1: Basics --------------------------------------------------------

type StepProps = {
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: Partial<Record<string, string>>;
  orgId?: string;
};

type StepBasicsProps = StepProps & {
  categories: Category[];
  categoriesLoading: boolean;
  categoriesLoadFailed: boolean;
};

/** Step 1  - title, description, category, tags, cover image. */
function StepBasics({
  form,
  set,
  errors,
  categories,
  categoriesLoading,
  categoriesLoadFailed,
}: StepBasicsProps) {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const slug = newCatName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const createCatMutation = useMutation({
    mutationFn: () => eventsApi.createCategory(newCatName.trim(), slug),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["events", "categories"] });
      set("category_id", res.data.id);
      setShowCreate(false);
      setNewCatName("");
    },
  });

  return (
    <>
      <StepHeader
        icon="edit_note"
        title="Event Basics"
        desc="Give your event a name, description, and cover image."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Event Title" error={errors.title}>
          <input
            className={inputCls}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Kathmandu Dev Summit 2026"
          />
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea
            className={cn(inputCls, "min-h-[120px] resize-y")}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Tell attendees what this event is about, the agenda, speakers, etc."
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Category">
            <select
              className={selectCls}
              value={form.category_id}
              onChange={(e) => set("category_id", e.target.value)}
              disabled={categoriesLoading}
            >
              <option value="">{categoriesLoading ? "Loading categories..." : "None"}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {`${" - ".repeat(category.depth)}${category.name}`}
                </option>
              ))}
            </select>
            {categoriesLoadFailed && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--secondary)",
                  marginTop: 4,
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Categories could not be loaded. Event will be created without a category.
              </p>
            )}

            {/* inline category creation */}
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                style={{
                  marginTop: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--primary)",
                  fontFamily: "Manrope, sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <MS n="add" size={13} />
                Create new category
              </button>
            ) : (
              <div
                style={{
                  marginTop: 8,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--mid)",
                  background: "var(--low)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <input
                  autoFocus
                  className={inputCls}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCatName.trim()) {
                      e.preventDefault();
                      createCatMutation.mutate();
                    }
                    if (e.key === "Escape") {
                      setShowCreate(false);
                      setNewCatName("");
                    }
                  }}
                />
                {slug && (
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "var(--on-mut)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    slug: {slug}
                  </p>
                )}
                {createCatMutation.isError && (
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--secondary)",
                      fontFamily: "Manrope, sans-serif",
                    }}
                  >
                    {getApiError(createCatMutation.error)}
                  </p>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => createCatMutation.mutate()}
                    disabled={!newCatName.trim() || createCatMutation.isPending}
                    style={{
                      flex: 1,
                      padding: "7px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "#050a26",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "Manrope, sans-serif",
                      cursor:
                        !newCatName.trim() || createCatMutation.isPending
                          ? "not-allowed"
                          : "pointer",
                      opacity: !newCatName.trim() || createCatMutation.isPending ? 0.5 : 1,
                    }}
                  >
                    {createCatMutation.isPending ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setNewCatName("");
                    }}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--mid)",
                      background: "transparent",
                      color: "var(--on-var)",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "Manrope, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="Cover Image URL">
            <input
              className={inputCls}
              value={form.cover_image}
              onChange={(e) => set("cover_image", e.target.value)}
              placeholder="https://..."
            />
          </Field>
        </div>

        {/* cover preview */}
        {form.cover_image && (
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--mid)",
              height: 180,
            }}
          >
            <img
              src={form.cover_image}
              alt="Cover preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

// * --- Step 2: Schedule & Location -------------------------------------------

/** Step 2  - dates, location, online toggle, meeting URL. */
function StepSchedule({ form, set, errors, orgId }: StepProps) {
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionDraft, setSessionDraft] = useState({ title: "", time: "10:00", speaker: "" });
  return (
    <>
      <StepHeader
        icon="calendar_month"
        title="Schedule & Location"
        desc="When and where is your event happening?"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Start Date & Time" error={errors.start_date}>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
            />
          </Field>
          <Field label="End Date & Time" error={errors.end_date}>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
            />
          </Field>
        </div>

        {/* online toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
            background: "var(--low)",
            borderRadius: 12,
            border: "1px solid var(--mid)",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Online Event
            </p>
            <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
              Toggle on for virtual or hybrid events
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("is_online", !form.is_online)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: form.is_online ? "#4338ca" : "var(--mid)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
              transition: "background 200ms",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: "white",
                position: "absolute",
                top: 3,
                left: form.is_online ? 23 : 3,
                transition: "left 200ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>

        {form.is_online && (
          <Field label="Meeting / Stream URL" error={errors.online_url}>
            <input
              className={inputCls}
              value={form.online_url}
              onChange={(e) => set("online_url", e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
          </Field>
        )}

        <Field label="Venue / Location" error={errors.location}>
          <VenueSelector
            value={form.location}
            orgId={orgId ?? ""}
            onChange={(loc: string, lat: number | null, lng: number | null) => {
              set("location", loc);
              if (lat != null) set("latitude", lat);
              if (lng != null) set("longitude", lng);
            }}
          />
          {form.is_online && (
            <p
              style={{
                fontSize: 11,
                color: "var(--on-mut)",
                marginTop: 4,
                fontFamily: "Manrope, sans-serif",
              }}
            >
              Optional for online-only events.
            </p>
          )}
        </Field>

        {/* map venue picker */}
        {!form.is_online && (
          <div>
            <label className={labelCls}>Pin location on map</label>
            <div
              style={{
                height: 280,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--mid)",
              }}
            >
              <EventMap
                latitude={form.latitude ?? 27.7172}
                longitude={form.longitude ?? 85.324}
                onClick={(lat: number, lng: number) => {
                  set("latitude", lat);
                  set("longitude", lng);
                }}
              />
            </div>
            {form.latitude && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--on-mut)",
                  marginTop: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
              </p>
            )}
          </div>
        )}

        {/* event agenda */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <label className={labelCls} style={{ marginBottom: 0 }}>
              Event Agenda
            </label>
            <button
              type="button"
              className="btn-sm primary"
              style={{ fontSize: 11, padding: "5px 12px" }}
              onClick={() => {
                setSessionDraft({ title: "", time: "10:00", speaker: "" });
                setSessionModal(true);
              }}
            >
              <MS n="add" size={13} /> Add session
            </button>
          </div>
          {form.schedule.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: "var(--on-mut)",
                fontFamily: "Manrope, sans-serif",
                padding: "12px 0",
              }}
            >
              No agenda items. Add sessions to create the event schedule.
            </p>
          )}
          {form.schedule.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {form.schedule
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom:
                        idx < form.schedule.length - 1 ? "1px solid var(--mid)" : "none",
                    }}
                  >
                    <div style={{ width: 60, flexShrink: 0, textAlign: "center" }}>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--primary)",
                        }}
                      >
                        {item.time || "--:--"}
                      </p>
                    </div>
                    <div
                      style={{
                        width: 2,
                        background: "linear-gradient(to bottom, var(--primary), var(--mid))",
                        borderRadius: 1,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontFamily: "'Space Grotesk',sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          letterSpacing: "-0.02em",
                          marginBottom: 2,
                        }}
                      >
                        {item.title}
                      </p>
                      {item.speaker && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "var(--on-mut)",
                            fontFamily: "Manrope, sans-serif",
                          }}
                        >
                          <MS
                            n="person"
                            size={12}
                            style={{ verticalAlign: "middle", marginRight: 3 }}
                          />
                          {item.speaker}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "schedule",
                          form.schedule.filter((_, i) => i !== idx)
                        )
                      }
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        border: "1px solid var(--mid)",
                        background: "transparent",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        alignSelf: "center",
                      }}
                    >
                      <MS n="close" size={12} style={{ color: "var(--on-mut)" }} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {sessionModal && (
        <_FormModal
          title="Add agenda session"
          onClose={() => setSessionModal(false)}
          onSubmit={() => {
            if (!sessionDraft.title.trim()) return;
            set("schedule", [
              ...form.schedule,
              {
                id: `s-${Date.now()}`,
                time: sessionDraft.time,
                title: sessionDraft.title.trim(),
                description: "",
                speaker: sessionDraft.speaker,
              },
            ]);
            setSessionModal(false);
          }}
        >
          <_ModalField
            label="Session title"
            value={sessionDraft.title}
            onChange={(v: string) => setSessionDraft((d) => ({ ...d, title: v }))}
            placeholder="e.g. Keynote Speech"
            autoFocus
          />
          <_ModalField
            label="Time (HH:MM)"
            value={sessionDraft.time}
            onChange={(v: string) => setSessionDraft((d) => ({ ...d, time: v }))}
            placeholder="10:00"
          />
          <_ModalField
            label="Speaker (optional)"
            value={sessionDraft.speaker}
            onChange={(v: string) => setSessionDraft((d) => ({ ...d, speaker: v }))}
            placeholder="Speaker name"
          />
        </_FormModal>
      )}
    </>
  );
}

// * --- Step 3: Tickets & Access ----------------------------------------------

type StepTicketsProps = StepProps & {
  domainInput: string;
  setDomainInput: (v: string) => void;
  addDomain: () => void;
  removeDomain: (d: string) => void;
};

/** Step 3  - capacity, visibility, pricing, domain restrictions. */
function StepTickets({
  form,
  set,
  errors,
  orgId,
  domainInput,
  setDomainInput,
  addDomain,
  removeDomain,
}: StepTicketsProps) {
  const [tierModal, setTierModal] = useState(false);
  const [tierDraft, setTierDraft] = useState({
    name: "",
    price: "0.00",
    capacity: "50",
    description: "",
  });
  const [roleModal, setRoleModal] = useState(false);
  const [roleDraft, setRoleDraft] = useState({ name: "", description: "", capacity: "5" });
  return (
    <>
      <StepHeader
        icon="confirmation_number"
        title="Tickets & Access"
        desc="Set capacity, pricing, and who can see or register."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Capacity" error={errors.capacity}>
            <input
              type="number"
              min={1}
              className={inputCls}
              value={form.capacity}
              onChange={(e) => set("capacity", parseInt(e.target.value) || 1)}
            />
          </Field>
          <Field label="Visibility">
            <select
              className={selectCls}
              value={form.visibility}
              onChange={(e) => set("visibility", e.target.value as EventVisibility)}
            >
              <option value="public">Public - visible to everyone</option>
              <option value="private">Private - invite only</option>
              <option value="unlisted">Unlisted - link only</option>
            </select>
          </Field>
        </div>

        {/* pricing toggle */}
        <div>
          <label className={labelCls}>Pricing</label>
          <div style={{ display: "flex", gap: 8 }}>
            {([true, false] as const).map((isFree) => (
              <button
                key={String(isFree)}
                type="button"
                onClick={() => set("is_free", isFree)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: form.is_free === isFree ? "2px solid #050a26" : "1px solid var(--mid)",
                  background: form.is_free === isFree ? "#050a26" : "var(--surface)",
                  color: form.is_free === isFree ? "white" : "var(--on-var)",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 120ms",
                }}
              >
                <MS n={isFree ? "money_off" : "payments"} size={16} />
                {isFree ? "Free" : "Paid"}
              </button>
            ))}
          </div>
        </div>

        {!form.is_free && (
          <>
            <Field label="Default Ticket Price (NPR)" error={errors.price}>
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputCls}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0.00"
              />
            </Field>

            {/* ticket tiers - premium cards + modal */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <label className={labelCls} style={{ marginBottom: 0 }}>
                  Ticket Tiers
                </label>
                <button
                  type="button"
                  className="btn-sm primary"
                  style={{ fontSize: 11, padding: "5px 12px" }}
                  onClick={() => {
                    setTierDraft({ name: "", price: "0.00", capacity: "50", description: "" });
                    setTierModal(true);
                  }}
                >
                  <MS n="add" size={13} /> Add tier
                </button>
              </div>
              {form.ticket_tiers.length === 0 && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--on-mut)",
                    fontFamily: "Manrope, sans-serif",
                    padding: "12px 0",
                  }}
                >
                  No tiers added. A single default ticket will be used.
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 10,
                }}
              >
                {form.ticket_tiers.map((tier, idx) => (
                  <div
                    key={tier.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--mid)",
                      borderRadius: 14,
                      padding: "16px 18px",
                      position: "relative",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "ticket_tiers",
                          form.ticket_tiers.filter((_, i) => i !== idx)
                        )
                      }
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: "1px solid var(--mid)",
                        background: "transparent",
                        cursor: "pointer",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <MS n="close" size={11} style={{ color: "var(--on-mut)" }} />
                    </button>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "linear-gradient(135deg,#050a26,#3b3a72)",
                        display: "grid",
                        placeItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <MS n="confirmation_number" size={18} style={{ color: "white" }} />
                    </div>
                    <p
                      style={{
                        fontFamily: "'Space Grotesk',sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: "-0.02em",
                        marginBottom: 4,
                      }}
                    >
                      {tier.name || "Untitled"}
                    </p>
                    <p
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--primary)",
                        marginBottom: 6,
                      }}
                    >
                      NPR {parseFloat(tier.price).toLocaleString()}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        fontSize: 11,
                        color: "var(--on-mut)",
                        fontFamily: "Manrope, sans-serif",
                      }}
                    >
                      <span>
                        <MS
                          n="group"
                          size={12}
                          style={{ verticalAlign: "middle", marginRight: 3 }}
                        />
                        {tier.capacity} spots
                      </span>
                    </div>
                    {tier.description && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--on-var)",
                          marginTop: 6,
                          lineHeight: 1.4,
                        }}
                      >
                        {tier.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* volunteer toggle */}
        <div
          style={{
            padding: "14px 16px",
            background: "var(--low)",
            borderRadius: 12,
            border: "1px solid var(--mid)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "Manrope, sans-serif",
                  color: "var(--on-bg)",
                  marginBottom: 2,
                }}
              >
                Enable Volunteering
              </p>
              <p
                style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}
              >
                Allow people to apply as volunteers for this event
              </p>
            </div>
            <button
              type="button"
              onClick={() => set("volunteers_enabled", !form.volunteers_enabled)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                background: form.volunteers_enabled ? "#4338ca" : "var(--mid)",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: "white",
                  position: "absolute",
                  top: 3,
                  left: form.volunteers_enabled ? 23 : 3,
                  transition: "left 200ms",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>
        </div>

        {form.volunteers_enabled && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <label className={labelCls} style={{ marginBottom: 0 }}>
                Volunteer Roles
              </label>
              <button
                type="button"
                className="btn-sm primary"
                style={{ fontSize: 11, padding: "5px 12px" }}
                onClick={() => {
                  setRoleDraft({ name: "", description: "", capacity: "5" });
                  setRoleModal(true);
                }}
              >
                <MS n="add" size={13} /> Add role
              </button>
            </div>
            {form.volunteer_roles.length === 0 && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                  padding: "12px 0",
                }}
              >
                No roles added yet. Add volunteer roles for this event.
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
              {form.volunteer_roles.map((role, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--mid)",
                    borderRadius: 14,
                    padding: "16px 18px",
                    position: "relative",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "volunteer_roles",
                        form.volunteer_roles.filter((_, i) => i !== idx)
                      )
                    }
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: "1px solid var(--mid)",
                      background: "transparent",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <MS n="close" size={11} style={{ color: "var(--on-mut)" }} />
                  </button>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "linear-gradient(135deg,#16a34a,#22c55e)",
                      display: "grid",
                      placeItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <MS n="volunteer_activism" size={18} style={{ color: "white" }} />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Space Grotesk',sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: "-0.02em",
                      marginBottom: 4,
                    }}
                  >
                    {role.name || "Untitled"}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      fontSize: 11,
                      color: "var(--on-mut)",
                      fontFamily: "Manrope, sans-serif",
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      <MS n="group" size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />
                      {role.capacity} slots
                    </span>
                  </div>
                  {role.description && (
                    <p style={{ fontSize: 11, color: "var(--on-var)", lineHeight: 1.4 }}>
                      {role.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* sponsor selector */}
        <div>
          <label className={labelCls}>Event Sponsors</label>
          <SponsorSelector
            orgId={orgId ?? ""}
            selected={form.sponsor_ids}
            onChange={(ids: string[]) => set("sponsor_ids", ids)}
          />
        </div>

        {/* networking toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
            background: "var(--low)",
            borderRadius: 12,
            border: "1px solid var(--mid)",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Enable Networking
            </p>
            <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
              Allow attendees to connect and network with each other
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("networking_enabled", !form.networking_enabled)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: form.networking_enabled ? "#4338ca" : "var(--mid)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: "white",
                position: "absolute",
                top: 3,
                left: form.networking_enabled ? 23 : 3,
                transition: "left 200ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>

        {/* auto community toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 16px",
            background: "var(--low)",
            borderRadius: 12,
            border: "1px solid var(--mid)",
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: "Manrope, sans-serif",
                color: "var(--on-bg)",
                marginBottom: 2,
              }}
            >
              Auto-create Community
            </p>
            <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
              Automatically create a discussion community for this event
            </p>
          </div>
          <button
            type="button"
            onClick={() => set("auto_community", !form.auto_community)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: form.auto_community ? "#4338ca" : "var(--mid)",
              cursor: "pointer",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                background: "white",
                position: "absolute",
                top: 3,
                left: form.auto_community ? 23 : 3,
                transition: "left 200ms",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>

        {/* allowed domains  - the platform USP */}
        <div
          style={{
            padding: "16px 18px",
            background: "var(--low)",
            borderRadius: 14,
            border: "1px solid var(--mid)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <MS n="domain_verification" size={18} style={{ color: "var(--primary)" }} />
            <div>
              <p
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  fontFamily: "Manrope, sans-serif",
                  color: "var(--on-bg)",
                }}
              >
                Domain Restrictions
              </p>
              <p
                style={{
                  fontSize: 11.5,
                  color: "var(--on-mut)",
                  fontFamily: "Manrope, sans-serif",
                }}
              >
                Only users with emails from these domains can see and register. Leave empty for no
                restriction.
              </p>
            </div>
          </div>

          <div
            style={{ display: "flex", gap: 8, marginBottom: form.allowed_domains.length ? 10 : 0 }}
          >
            <input
              className={inputCls}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDomain();
                }
              }}
              placeholder="e.g. ku.edu.np"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={addDomain}
              style={{
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "#050a26",
                color: "white",
                fontSize: 12.5,
                fontWeight: 700,
                fontFamily: "Manrope, sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MS n="add" size={14} />
              Add
            </button>
          </div>

          {form.allowed_domains.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {form.allowed_domains.map((d) => (
                <span
                  key={d}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 7,
                    background: "rgba(99,102,241,0.1)",
                    color: "#4338ca",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  @{d}
                  <button
                    type="button"
                    onClick={() => removeDomain(d)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <MS n="close" size={13} style={{ color: "#4338ca" }} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {tierModal && (
        <_FormModal
          title="Add ticket tier"
          onClose={() => setTierModal(false)}
          onSubmit={() => {
            if (!tierDraft.name.trim()) return;
            set("ticket_tiers", [
              ...form.ticket_tiers,
              {
                id: `t-${Date.now()}`,
                name: tierDraft.name.trim(),
                price: tierDraft.price,
                capacity: parseInt(tierDraft.capacity) || 50,
                description: tierDraft.description,
              },
            ]);
            setTierModal(false);
          }}
        >
          <_ModalField
            label="Tier name"
            value={tierDraft.name}
            onChange={(v: string) => setTierDraft((d) => ({ ...d, name: v }))}
            placeholder="e.g. VIP, General"
            autoFocus
          />
          <_ModalField
            label="Price (NPR)"
            value={tierDraft.price}
            onChange={(v: string) => setTierDraft((d) => ({ ...d, price: v }))}
            placeholder="0.00"
            type="number"
          />
          <_ModalField
            label="Capacity"
            value={tierDraft.capacity}
            onChange={(v: string) => setTierDraft((d) => ({ ...d, capacity: v }))}
            placeholder="50"
            type="number"
          />
          <_ModalField
            label="Description (optional)"
            value={tierDraft.description}
            onChange={(v: string) => setTierDraft((d) => ({ ...d, description: v }))}
            placeholder="What's included"
          />
        </_FormModal>
      )}
      {roleModal && (
        <_FormModal
          title="Add volunteer role"
          onClose={() => setRoleModal(false)}
          onSubmit={() => {
            if (!roleDraft.name.trim()) return;
            set("volunteer_roles", [
              ...form.volunteer_roles,
              {
                name: roleDraft.name.trim(),
                description: roleDraft.description,
                capacity: parseInt(roleDraft.capacity) || 5,
              },
            ]);
            setRoleModal(false);
          }}
        >
          <_ModalField
            label="Role name"
            value={roleDraft.name}
            onChange={(v: string) => setRoleDraft((d) => ({ ...d, name: v }))}
            placeholder="e.g. Stage Crew"
            autoFocus
          />
          <_ModalField
            label="Description"
            value={roleDraft.description}
            onChange={(v: string) => setRoleDraft((d) => ({ ...d, description: v }))}
            placeholder="What the volunteer will do"
          />
          <_ModalField
            label="Slots"
            value={roleDraft.capacity}
            onChange={(v: string) => setRoleDraft((d) => ({ ...d, capacity: v }))}
            placeholder="5"
            type="number"
          />
        </_FormModal>
      )}
    </>
  );
}

// * --- Step 4: Gallery + Review -----------------------------------------------

/** Gallery upload section - only available after auto-save creates a draft. */
function StepGallery({ eventId }: { eventId: string | null }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: media = [] } = useQuery<
    { id: string; url: string; caption: string; position: number }[]
  >({
    queryKey: ["event-media", eventId],
    queryFn: () => eventsApi.listMedia(eventId!),
    enabled: !!eventId,
  });

  async function handleUpload(files: FileList | null) {
    if (!files || !eventId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const url = await eventsApi.uploadCover(file);
        await eventsApi.addMedia(eventId, { url, position: media.length });
      } catch {
        /* non-fatal */
      }
    }
    qc.invalidateQueries({ queryKey: ["event-media", eventId] });
    setUploading(false);
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <StepHeader
        icon="photo_library"
        title="Media Gallery"
        desc="Upload photos for your event gallery. You can also add more later from the edit page."
      />
      {!eventId ? (
        <div
          style={{
            padding: "20px 16px",
            borderRadius: 12,
            background: "var(--low)",
            border: "1px solid var(--mid)",
            textAlign: "center",
          }}
        >
          <MS
            n="cloud_upload"
            size={28}
            style={{ display: "block", margin: "0 auto 8px", color: "var(--on-mut)", opacity: 0.5 }}
          />
          <p style={{ fontSize: 13, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
            Gallery upload will be available after auto-save creates a draft (fill in title and wait
            ~30s), or you can add media after creation.
          </p>
        </div>
      ) : (
        <div>
          {media.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              {media.map((m) => (
                <div
                  key={m.id}
                  style={{
                    width: 140,
                    height: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    position: "relative",
                    border: "1px solid var(--mid)",
                  }}
                >
                  <img
                    src={m.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    onClick={async () => {
                      await eventsApi.deleteMedia(eventId, m.id);
                      qc.invalidateQueries({ queryKey: ["event-media", eventId] });
                    }}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.5)",
                      border: "none",
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <MS n="close" size={12} style={{ color: "white" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 10,
              border: "1px dashed var(--mid)",
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--on-var)",
            }}
          >
            <MS n="add_photo_alternate" size={15} />
            {uploading ? "Uploading..." : "Add media"}
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/** Read-only summary of all fields before submission. */
function StepReview({ form, categoryLabel }: { form: FormState; categoryLabel: string | null }) {
  const priceDisplay = form.is_free ? "Free" : `NPR ${parseFloat(form.price).toLocaleString()}`;

  return (
    <>
      <StepHeader
        icon="checklist"
        title="Review & Create"
        desc="Double-check everything before creating your event as a draft."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ReviewSection title="Basics">
          <ReviewRow label="Title" value={form.title} />
          <ReviewRow
            label="Description"
            value={
              form.description.length > 120
                ? form.description.slice(0, 120) + "..."
                : form.description
            }
          />
          {categoryLabel && <ReviewRow label="Category" value={categoryLabel} />}
          {form.cover_image && <ReviewRow label="Cover Image" value="Provided" />}
        </ReviewSection>

        <ReviewSection title="Schedule & Location">
          <ReviewRow
            label="Start"
            value={form.start_date ? new Date(form.start_date).toLocaleString() : " -"}
          />
          <ReviewRow
            label="End"
            value={form.end_date ? new Date(form.end_date).toLocaleString() : " -"}
          />
          <ReviewRow label="Location" value={form.location || " -"} />
          <ReviewRow label="Online" value={form.is_online ? "Yes" : "No"} />
          {form.is_online && form.online_url && (
            <ReviewRow label="Meeting URL" value={form.online_url} />
          )}
        </ReviewSection>

        <ReviewSection title="Tickets & Access">
          <ReviewRow label="Capacity" value={form.capacity.toLocaleString()} />
          <ReviewRow
            label="Visibility"
            value={form.visibility.charAt(0).toUpperCase() + form.visibility.slice(1)}
          />
          <ReviewRow label="Price" value={priceDisplay} />
          {form.ticket_tiers.length > 0 && (
            <ReviewRow
              label="Ticket Tiers"
              value={form.ticket_tiers.map((t) => `${t.name} (NPR ${t.price})`).join(", ")}
            />
          )}
          <ReviewRow
            label="Volunteering"
            value={form.volunteers_enabled ? `Yes (${form.volunteer_roles.length} roles)` : "No"}
          />
          <ReviewRow label="Networking" value={form.networking_enabled ? "Enabled" : "Disabled"} />
          <ReviewRow label="Auto Community" value={form.auto_community ? "Yes" : "No"} />
          {form.sponsor_ids.length > 0 && (
            <ReviewRow label="Sponsors" value={`${form.sponsor_ids.length} linked`} />
          )}
          {form.volunteer_roles.length > 0 && (
            <ReviewRow
              label="Volunteer Roles"
              value={form.volunteer_roles.map((r) => `${r.name} (${r.capacity} slots)`).join(", ")}
            />
          )}
          <ReviewRow
            label="Domain Restrictions"
            value={
              form.allowed_domains.length
                ? form.allowed_domains.map((d) => `@${d}`).join(", ")
                : "None (open to all)"
            }
          />
        </ReviewSection>

        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <MS n="info" size={18} style={{ color: "#16a34a", flexShrink: 0 }} />
          <p
            style={{
              fontSize: 12.5,
              color: "#16a34a",
              fontFamily: "Manrope, sans-serif",
              lineHeight: 1.45,
            }}
          >
            Your event will be created as a <strong>draft</strong>. You can publish it from the
            event detail page once you're ready.
          </p>
        </div>
      </div>
    </>
  );
}

// * --- Shared UI Helpers -----------------------------------------------------

/** Section header shown at the top of each step. */
function StepHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <MS n={icon} size={20} style={{ color: "var(--primary)" }} />
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "-0.03em",
            color: "var(--on-bg)",
          }}
        >
          {title}
        </h2>
      </div>
      <p
        style={{
          fontSize: 13,
          color: "var(--on-var)",
          fontFamily: "Manrope, sans-serif",
          paddingLeft: 30,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

/** Labelled field wrapper with optional error message. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && (
        <p
          style={{
            fontSize: 11,
            color: "var(--secondary)",
            marginTop: 4,
            fontFamily: "Manrope, sans-serif",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Review section with a title and key-value rows. */
function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--low)",
        borderRadius: 12,
        padding: "14px 18px",
        border: "1px solid var(--mid)",
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--on-mut)",
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: 10,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

/** Single key-value row inside a review section. */
// select existing venue or type a new location
function VenueSelector({
  value,
  orgId,
  onChange,
}: {
  value: string;
  orgId: string;
  onChange: (loc: string, lat: number | null, lng: number | null) => void;
}) {
  const [mode, setMode] = useState<"select" | "custom">(value ? "custom" : "select");
  const { data: venues = [] } = useQuery({
    queryKey: ["venues-for-event", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const r = await apiClient.get(`/org/api/v1/venues/?organization_id=${orgId}`);
      return (r.data?.data ?? []) as {
        id: string;
        name: string;
        address: string;
        city: string;
        latitude?: number;
        longitude?: number;
      }[];
    },
    enabled: !!orgId,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => setMode("select")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: mode === "select" ? "2px solid #050a26" : "1px solid var(--mid)",
            background: mode === "select" ? "#050a26" : "var(--surface)",
            color: mode === "select" ? "white" : "var(--on-var)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Select venue
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: mode === "custom" ? "2px solid #050a26" : "1px solid var(--mid)",
            background: mode === "custom" ? "#050a26" : "var(--surface)",
            color: mode === "custom" ? "white" : "var(--on-var)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Custom location
        </button>
      </div>
      {mode === "select" ? (
        <select
          className={inputCls}
          value=""
          onChange={(e) => {
            const found = venues.find((item: { id: string }) => item.id === e.target.value);
            if (found)
              onChange(
                `${found.name}, ${found.address}, ${found.city}`,
                found.latitude ?? null,
                found.longitude ?? null
              );
          }}
        >
          <option value="">Choose a venue...</option>
          {venues.map((item: { id: string; name: string; city: string }) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.city}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value, null, null)}
          placeholder="e.g. Hotel Yak & Yeti, Kathmandu"
        />
      )}
    </div>
  );
}

// select existing sponsors for the event
function SponsorSelector({
  orgId,
  selected,
  onChange,
}: {
  orgId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors-for-event", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const r = await apiClient.get(`/org/api/v1/campaigns/sponsors/?organization_id=${orgId}`);
      return (r.data?.data ?? []) as { id: string; name: string; tier: string; logo_url: string }[];
    },
    enabled: !!orgId,
  });

  if (sponsors.length === 0) {
    return (
      <p style={{ fontSize: 12, color: "var(--on-mut)", fontFamily: "Manrope, sans-serif" }}>
        No sponsors created yet. Add sponsors from the Sponsors page first.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {sponsors.map((s: { id: string; name: string; tier: string }) => {
        const active = selected.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              onChange(active ? selected.filter((id) => id !== s.id) : [...selected, s.id])
            }
            style={{
              padding: "6px 14px",
              borderRadius: 10,
              border: active ? "2px solid #050a26" : "1px solid var(--mid)",
              background: active ? "#050a26" : "var(--surface)",
              color: active ? "white" : "var(--on-var)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MS n="handshake" size={13} />
            {s.name}
            <span style={{ fontSize: 10, opacity: 0.7, textTransform: "capitalize" }}>
              ({s.tier})
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: "var(--on-mut)",
          fontFamily: "Manrope, sans-serif",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "var(--on-bg)",
          fontFamily: "Manrope, sans-serif",
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// reusable form modal shell for add-session, add-tier, add-role
function _FormModal({
  title,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          borderRadius: 20,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 16px 48px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--outline)",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--mid)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <MS n="close" size={14} />
          </button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--outline)",
          }}
        >
          <button
            className="btn-sm"
            onClick={onClose}
            style={{ border: "1px solid var(--mid)", background: "transparent" }}
          >
            Cancel
          </button>
          <button
            className="btn-sm"
            onClick={onSubmit}
            style={{ background: "#050a26", color: "white", border: "none" }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function _ModalField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "var(--on-mut)",
          marginBottom: 6,
          display: "block",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid var(--mid)",
          background: "var(--low)",
          fontSize: 14,
          fontFamily: "Manrope, sans-serif",
          boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
}
