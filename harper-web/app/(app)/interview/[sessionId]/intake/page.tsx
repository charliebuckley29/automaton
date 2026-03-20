"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBrowserClient } from "@/lib/supabase/client";

const intakeSchema = z.object({
  // Section 1: Business Basics
  business_name: z.string().min(1, "Business name is required"),
  trading_as: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  sub_industry: z.string().optional(),
  years_operating: z.coerce.number().min(0).max(200),
  company_number: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal("")),

  // Section 2: Team & Scale
  employee_count: z.coerce.number().min(0),
  annual_revenue_band: z.string().min(1, "Revenue band is required"),
  primary_market: z.enum(["local", "regional", "national", "international"]),
  locations_count: z.coerce.number().min(1),

  // Section 3: Goals & Challenges
  primary_goal: z.string().min(10, "Please describe your primary goal"),
  biggest_challenge: z.string().min(10, "Please describe your biggest challenge"),
  attempted_solutions: z.string().optional(),

  // Section 4: Digital Presence
  has_google_business: z.boolean(),
  social_platforms: z.string().optional(),
  uses_crm: z.boolean(),
  crm_name: z.string().optional(),
  uses_automation: z.boolean(),
  automation_tools: z.string().optional(),
});

type IntakeFormData = z.infer<typeof intakeSchema>;

const revenueBands = [
  "Pre-revenue",
  "Under £50k",
  "£50k - £150k",
  "£150k - £500k",
  "£500k - £1m",
  "£1m - £5m",
  "£5m+",
];

const sections = [
  { id: 1, title: "Business Basics", description: "Tell us about your company" },
  { id: 2, title: "Team & Scale", description: "How big is your operation" },
  { id: 3, title: "Goals & Challenges", description: "What you want to achieve" },
  { id: 4, title: "Digital Presence", description: "Your current tech stack" },
];

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [activeSection, setActiveSection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      has_google_business: false,
      uses_crm: false,
      uses_automation: false,
      locations_count: 1,
      employee_count: 1,
      years_operating: 0,
    },
  });

  const watchUsesCrm = watch("uses_crm");
  const watchUsesAutomation = watch("uses_automation");

  const autoSave = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const values = getValues();
      await supabase
        .from("intake_forms")
        .upsert(
          { session_id: sessionId, form_data: values, updated_at: new Date().toISOString() },
          { onConflict: "session_id" }
        );
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [sessionId, getValues]);

  const onSubmit = async (data: IntakeFormData) => {
    setSubmitting(true);
    try {
      const supabase = createBrowserClient();
      await supabase
        .from("intake_forms")
        .upsert(
          {
            session_id: sessionId,
            form_data: data,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "session_id" }
        );
      router.push(`/interview/${sessionId}/research`);
    } catch (err) {
      console.error("Submit failed:", err);
      setSubmitting(false);
    }
  };

  const inputClasses =
    "w-full rounded-lg border border-chalk/10 bg-chalk/[0.03] px-4 py-3 text-chalk placeholder-chalk/30 outline-none transition-colors focus:border-harper-gold/40 focus:bg-chalk/[0.05]";
  const labelClasses = "mb-1.5 block text-sm font-medium text-chalk/70";
  const errorClasses = "mt-1 text-xs text-score-red";

  return (
    <main className="min-h-screen bg-midnight px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-harper-gold">
            Intake Form
          </p>
          <h1 className="font-display text-3xl font-bold text-chalk">
            Tell us about your business
          </h1>
          <p className="mt-2 text-sm text-chalk/50">
            This information helps our AI prepare a more accurate diagnostic.
          </p>
        </div>

        {/* Section tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                autoSave();
                setActiveSection(section.id);
              }}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeSection === section.id
                  ? "bg-harper-gold text-midnight"
                  : "border border-chalk/10 text-chalk/50 hover:border-chalk/20 hover:text-chalk/70"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="mb-4 text-xs text-harper-gold/60">Saving...</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Business Basics */}
          {activeSection === 1 && (
            <div className="space-y-6 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
              <div>
                <label className={labelClasses}>Business Name *</label>
                <input
                  {...register("business_name")}
                  className={inputClasses}
                  placeholder="Acme Widgets Ltd"
                />
                {errors.business_name && (
                  <p className={errorClasses}>{errors.business_name.message}</p>
                )}
              </div>
              <div>
                <label className={labelClasses}>Trading As</label>
                <input
                  {...register("trading_as")}
                  className={inputClasses}
                  placeholder="Acme Widgets"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Industry *</label>
                  <input
                    {...register("industry")}
                    className={inputClasses}
                    placeholder="e.g. Retail, Construction, SaaS"
                  />
                  {errors.industry && (
                    <p className={errorClasses}>{errors.industry.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Sub-industry</label>
                  <input
                    {...register("sub_industry")}
                    className={inputClasses}
                    placeholder="e.g. E-commerce, Residential"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Years Operating</label>
                  <input
                    {...register("years_operating")}
                    type="number"
                    className={inputClasses}
                    placeholder="3"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Company Number</label>
                  <input
                    {...register("company_number")}
                    className={inputClasses}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Website URL</label>
                <input
                  {...register("website_url")}
                  className={inputClasses}
                  placeholder="https://example.com"
                />
                {errors.website_url && (
                  <p className={errorClasses}>{errors.website_url.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Team & Scale */}
          {activeSection === 2 && (
            <div className="space-y-6 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>Number of Employees</label>
                  <input
                    {...register("employee_count")}
                    type="number"
                    className={inputClasses}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Number of Locations</label>
                  <input
                    {...register("locations_count")}
                    type="number"
                    className={inputClasses}
                    placeholder="1"
                  />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Annual Revenue Band *</label>
                <select {...register("annual_revenue_band")} className={inputClasses}>
                  <option value="">Select revenue band</option>
                  {revenueBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
                {errors.annual_revenue_band && (
                  <p className={errorClasses}>{errors.annual_revenue_band.message}</p>
                )}
              </div>
              <div>
                <label className={labelClasses}>Primary Market *</label>
                <select {...register("primary_market")} className={inputClasses}>
                  <option value="local">Local</option>
                  <option value="regional">Regional</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 3: Goals & Challenges */}
          {activeSection === 3 && (
            <div className="space-y-6 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
              <div>
                <label className={labelClasses}>
                  What is your primary business goal for the next 12 months? *
                </label>
                <textarea
                  {...register("primary_goal")}
                  className={`${inputClasses} min-h-[100px] resize-y`}
                  placeholder="e.g. Increase online sales by 40%, expand to a second location..."
                />
                {errors.primary_goal && (
                  <p className={errorClasses}>{errors.primary_goal.message}</p>
                )}
              </div>
              <div>
                <label className={labelClasses}>
                  What is the single biggest challenge holding you back? *
                </label>
                <textarea
                  {...register("biggest_challenge")}
                  className={`${inputClasses} min-h-[100px] resize-y`}
                  placeholder="e.g. We can't get enough leads, our operations are too manual..."
                />
                {errors.biggest_challenge && (
                  <p className={errorClasses}>{errors.biggest_challenge.message}</p>
                )}
              </div>
              <div>
                <label className={labelClasses}>
                  What solutions have you already tried?
                </label>
                <textarea
                  {...register("attempted_solutions")}
                  className={`${inputClasses} min-h-[80px] resize-y`}
                  placeholder="e.g. Hired an SEO agency, tried Facebook ads..."
                />
              </div>
            </div>
          )}

          {/* Section 4: Digital Presence */}
          {activeSection === 4 && (
            <div className="space-y-6 rounded-2xl border border-chalk/10 bg-chalk/[0.02] p-8">
              <div className="flex items-center gap-3">
                <input
                  {...register("has_google_business")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-chalk/20 bg-chalk/[0.03] accent-harper-gold"
                />
                <label className="text-sm text-chalk/70">
                  I have a Google Business Profile
                </label>
              </div>
              <div>
                <label className={labelClasses}>Social Media Platforms</label>
                <input
                  {...register("social_platforms")}
                  className={inputClasses}
                  placeholder="e.g. Instagram, LinkedIn, Facebook"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  {...register("uses_crm")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-chalk/20 bg-chalk/[0.03] accent-harper-gold"
                />
                <label className="text-sm text-chalk/70">I use a CRM</label>
              </div>
              {watchUsesCrm && (
                <div>
                  <label className={labelClasses}>Which CRM?</label>
                  <input
                    {...register("crm_name")}
                    className={inputClasses}
                    placeholder="e.g. HubSpot, Salesforce, Pipedrive"
                  />
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  {...register("uses_automation")}
                  type="checkbox"
                  className="h-4 w-4 rounded border-chalk/20 bg-chalk/[0.03] accent-harper-gold"
                />
                <label className="text-sm text-chalk/70">
                  I use automation tools
                </label>
              </div>
              {watchUsesAutomation && (
                <div>
                  <label className={labelClasses}>Which tools?</label>
                  <input
                    {...register("automation_tools")}
                    className={inputClasses}
                    placeholder="e.g. Zapier, Make, custom scripts"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                autoSave();
                setActiveSection(Math.max(1, activeSection - 1));
              }}
              className={`rounded-full border border-chalk/20 px-6 py-3 text-sm font-medium text-chalk transition-all hover:border-chalk/40 ${
                activeSection === 1 ? "invisible" : ""
              }`}
            >
              Previous
            </button>

            {activeSection < 4 ? (
              <button
                type="button"
                onClick={() => {
                  autoSave();
                  setActiveSection(activeSection + 1);
                }}
                className="rounded-full bg-harper-gold px-6 py-3 text-sm font-semibold text-midnight transition-all hover:bg-harper-gold/90"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-harper-gold px-8 py-3 text-sm font-semibold text-midnight transition-all hover:bg-harper-gold/90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit & Start Research"}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
