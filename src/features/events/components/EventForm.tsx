import { useState } from "react";
import { Button, Input } from "@/shared/components/ui";
import { cn } from "@/shared/lib/cn";
import type {
  CreateEventRequest,
  Event,
  EventVisibility,
} from "@/features/events/types/event.types";

type Props = {
  initial?: Partial<Event>;
  onSubmit: (data: CreateEventRequest) => void;
  loading?: boolean;
  submitLabel?: string;
};

/** Reusable event form used by both create and edit pages. */
export default function EventForm({ initial, onSubmit, loading, submitLabel = "Save" }: Props) {
  const [form, setForm] = useState<CreateEventRequest>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    location: initial?.location ?? "",
    start_date: initial?.start_date ? toDateTimeLocal(initial.start_date) : "",
    end_date: initial?.end_date ? toDateTimeLocal(initial.end_date) : "",
    capacity: initial?.capacity ?? 100,
    visibility: initial?.visibility ?? "public",
    is_free: initial?.is_free ?? true,
    price: initial?.price ?? "0.00",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateEventRequest, string>>>({});

  function set<K extends keyof CreateEventRequest>(key: K, value: CreateEventRequest[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = "Title is required.";
    if (!form.description.trim()) next.description = "Description is required.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (!form.start_date) next.start_date = "Start date is required.";
    if (!form.end_date) next.end_date = "End date is required.";
    if (form.start_date && form.end_date && form.end_date <= form.start_date)
      next.end_date = "End date must be after start date.";
    if (form.capacity < 1) next.capacity = "Capacity must be at least 1.";
    if (!form.is_free && parseFloat(form.price) <= 0) next.price = "Enter a price greater than 0.";
    setErrors(next);
    return !Object.keys(next).length;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Event title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        error={errors.title}
        placeholder="e.g. Kathmandu Dev Summit 2026"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-[#19191e] font-['Manrope']">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={4}
          placeholder="Tell attendees what this event is about…"
          className={cn(
            "w-full rounded-xl border px-4 py-3 text-sm font-['Manrope'] text-[#19191e] placeholder-[#9b9ca4] outline-none transition-colors resize-none",
            errors.description
              ? "border-[#e83151] focus:border-[#e83151] focus:ring-1 focus:ring-[#e83151]/30"
              : "border-[#e0dfd8] focus:border-[#dba13d] focus:ring-1 focus:ring-[#dba13d]/30"
          )}
        />
        {errors.description && (
          <p className="text-xs text-[#e83151] font-['Manrope']">{errors.description}</p>
        )}
      </div>

      <Input
        label="Location"
        value={form.location}
        onChange={(e) => set("location", e.target.value)}
        error={errors.location}
        placeholder="e.g. Kathmandu, Nepal"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start date & time"
          type="datetime-local"
          value={form.start_date}
          onChange={(e) => set("start_date", e.target.value)}
          error={errors.start_date}
        />
        <Input
          label="End date & time"
          type="datetime-local"
          value={form.end_date}
          onChange={(e) => set("end_date", e.target.value)}
          error={errors.end_date}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Capacity"
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => set("capacity", parseInt(e.target.value) || 1)}
          error={errors.capacity}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#19191e] font-['Manrope']">
            Visibility
          </label>
          <select
            value={form.visibility}
            onChange={(e) => set("visibility", e.target.value as EventVisibility)}
            className="h-11 rounded-xl border border-[#e0dfd8] px-4 text-sm font-['Manrope'] text-[#19191e] outline-none focus:border-[#dba13d] focus:ring-1 focus:ring-[#dba13d]/30 bg-white"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>
      </div>

      {/* pricing */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-[#19191e] font-['Manrope']">Pricing</label>
        <div className="flex gap-4">
          {[true, false].map((isFree) => (
            <button
              key={String(isFree)}
              type="button"
              onClick={() => set("is_free", isFree)}
              className={cn(
                "flex-1 h-10 rounded-xl border text-sm font-semibold font-['Manrope'] transition-colors",
                form.is_free === isFree
                  ? "bg-[#121d3f] text-white border-[#121d3f]"
                  : "bg-white text-[#6b6c75] border-[#e0dfd8] hover:border-[#dba13d]"
              )}
            >
              {isFree ? "Free" : "Paid"}
            </button>
          ))}
        </div>
        {!form.is_free && (
          <Input
            label="Price (NPR)"
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            error={errors.price}
            placeholder="0.00"
          />
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function toDateTimeLocal(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16);
}
