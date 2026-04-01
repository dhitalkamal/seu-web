import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/shared/layouts/AppLayout";
import { MS } from "@/shared/components/v8";
import { cn } from "@/shared/lib/cn";
import { useEventCategories, useEventMutations } from "@/features/events/hooks/useEvents";
import { getApiError } from "@/features/auth/hooks/useAuth";
import intelligenceApi from "@/features/intelligence/api/intelligence.api";
import eventsApi from "@/features/events/api/events.api";
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
  { icon: "checklist", label: "Review" },
] as const;

// * --- Form State ------------------------------------------------------------

type FormState = {
  title: string;
  description: string;
  category_id: string;
  tag_ids: string[];
  cover_image: string;
  start_date: string;
  end_date: string;
  location: string;
  is_online: boolean;
  online_url: string;
  capacity: number;
  visibility: EventVisibility;
  is_free: boolean;
  price: string;
  allowed_domains: string[];
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
  is_online: false,
  online_url: "",
  capacity: 100,
  visibility: "public",
  is_free: true,
  price: "0.00",
  allowed_domains: [],
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

  // * auto-save interval - fires every 30 seconds when form has unsaved changes
  useEffect(() => {
    const id = setInterval(async () => {
      if (!isDirty) return;
      const current = formRef.current;
      // only auto-save if there is at least a title to avoid persisting empty records
      if (!current.title.trim()) return;
      try {
        await eventsApi.createEvent({
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
        });
        setIsDirty(false);
        setAutoSaved(true);
        // hide the "Auto-saved" indicator after 4 seconds
        setTimeout(() => setAutoSaved(false), 4000);
      } catch {
        // auto-save failure is non-critical - user can still submit manually
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
    };
    createMutation.mutate(payload, {
      onSuccess: (res) => navigate(`/org/events/${res.data.id}`),
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
          {step === 1 && <StepSchedule form={form} set={set} errors={errors} />}
          {step === 2 && (
            <StepTickets
              form={form}
              set={set}
              errors={errors}
              domainInput={domainInput}
              setDomainInput={setDomainInput}
              addDomain={addDomain}
              removeDomain={removeDomain}
            />
          )}
          {step === 3 && <StepReview form={form} categoryLabel={selectedCategoryLabel} />}

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
function StepSchedule({ form, set, errors }: StepProps) {
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

        <Field label="Physical Location" error={errors.location}>
          <input
            className={inputCls}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Hotel Yak & Yeti, Kathmandu"
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
      </div>
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
  domainInput,
  setDomainInput,
  addDomain,
  removeDomain,
}: StepTicketsProps) {
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
          <Field label="Ticket Price (NPR)" error={errors.price}>
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
        )}

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
    </>
  );
}

// * --- Step 4: Review --------------------------------------------------------

/** Step 4  - read-only summary of all fields before submission. */
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
