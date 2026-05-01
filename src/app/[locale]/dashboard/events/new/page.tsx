import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isSupportedLocale } from "@/lib/i18n/config";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = isSupportedLocale(locale) ? locale : "ar";

  async function createEvent(formData: FormData) {
    "use server";

    const slug = String(formData.get("slug") ?? "").trim();
    const titleEn = String(formData.get("titleEn") ?? "").trim();
    const titleAr = String(formData.get("titleAr") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "");
    const endDate = String(formData.get("endDate") ?? "");

    if (!slug || !titleEn || !titleAr || !startDate || !endDate) return;

    const created = await db.event.create({
      data: {
        coverImage: String(formData.get("coverImage") ?? "") || null,
        endDate: new Date(endDate),
        isFeatured: formData.get("isFeatured") === "on",
        isFree: Number(formData.get("price") ?? 0) <= 0,
        location: String(formData.get("location") ?? "") || null,
        paymentMethods: "both",
        price: String(formData.get("price") ?? "0"),
        slug,
        startDate: new Date(startDate),
        status: String(formData.get("status") ?? "draft"),
        type: String(formData.get("type") ?? "onsite"),
        translations: {
          create: [
            { locale: "en", title: titleEn, shortDescription: String(formData.get("shortEn") ?? "") || null },
            { locale: "ar", title: titleAr, shortDescription: String(formData.get("shortAr") ?? "") || null },
          ],
        },
      },
    });

    revalidatePath(`/${activeLocale}/dashboard/events`);
    redirect(`/${activeLocale}/dashboard/events/${created.id}`);
  }

  return (
    <form action={createEvent} className="event-form-page">
      <aside className="nav-rail">
        <div className="nav-rail-title">Event Sections</div>
        {["Identity", "Schedule", "Location", "Pricing", "Content", "Settings"].map((label) => (
          <a className="nav-section" href={`#${label.toLowerCase()}`} key={label}>
            <span className="nav-dot" />
            <span className="nav-label">{label}</span>
          </a>
        ))}
        <div className="rail-save">
          <button className="rail-btn-save" type="submit">Create Event</button>
          <a className="rail-btn-discard" href={`/${activeLocale}/dashboard/events`}>Discard</a>
        </div>
      </aside>

      <main className="main">
        <header className="page-head">
          <a className="page-back" href={`/${activeLocale}/dashboard/events`}>Back to Events</a>
          <div className="page-title-row">
            <div>
              <div className="page-kicker">Event editor</div>
              <h1 className="page-title"><strong>Create</strong> event</h1>
            </div>
          </div>
        </header>

        <section className="form-section" id="identity">
          <h2>Identity</h2>
          <div className="field-grid cols-2">
            <label className="field-block full">
              <span>Cover Image</span>
              <input className="field-input" name="coverImage" placeholder="Image URL" />
            </label>
            <label className="field-block">
              <span>Title (EN)</span>
              <input className="field-input" name="titleEn" required />
            </label>
            <label className="field-block">
              <span>Title (AR)</span>
              <input className="field-input" name="titleAr" required />
            </label>
            <label className="field-block full">
              <span>Slug</span>
              <input className="field-input" name="slug" required />
            </label>
            <label className="field-block">
              <span>Event Type</span>
              <select className="field-input" defaultValue="onsite" name="type">
                <option value="onsite">On-site</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-section" id="schedule">
          <h2>Schedule</h2>
          <div className="field-grid cols-2">
            <label className="field-block">
              <span>Start Date</span>
              <input className="field-input" name="startDate" type="date" required />
            </label>
            <label className="field-block">
              <span>End Date</span>
              <input className="field-input" name="endDate" type="date" required />
            </label>
          </div>
        </section>

        <section className="form-section" id="location">
          <h2>Location</h2>
          <label className="field-block">
            <span>Venue Name / Address</span>
            <input className="field-input" name="location" />
          </label>
        </section>

        <section className="form-section" id="pricing">
          <h2>Pricing</h2>
          <div className="field-grid cols-2">
            <label className="field-block">
              <span>Price (OMR)</span>
              <input className="field-input" min="0" name="price" step="0.01" type="number" />
            </label>
          </div>
        </section>

        <section className="form-section" id="content">
          <h2>Content</h2>
          <div className="field-grid cols-2">
            <label className="field-block">
              <span>Short Description (EN)</span>
              <textarea className="field-input" maxLength={160} name="shortEn" rows={4} />
            </label>
            <label className="field-block">
              <span>Short Description (AR)</span>
              <textarea className="field-input" maxLength={160} name="shortAr" rows={4} />
            </label>
          </div>
        </section>
      </main>

      <aside className="settings-rail">
        <div className="settings-rail-head">
          <span className="settings-kicker">Right Rail</span>
          <h2>Settings</h2>
          <p>Controls that affect public visibility, registration behavior, and metadata.</p>
        </div>
        <div className="settings-stack">
          <label className="toggle-row featured-row compact">
            <span className="toggle-icon amber">Feat</span>
            <span className="toggle-content">
              <span className="toggle-title">Feature this event</span>
              <span className="toggle-desc">Shows the featured event layout and cards.</span>
            </span>
            <input name="isFeatured" type="checkbox" />
          </label>
          <label className="field-block">
            <span>Publication Status</span>
            <select className="field-input" defaultValue="draft" name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </aside>
      <div className="action-bar">
        <span className="action-meta">Event editor</span>
        <div className="action-btns">
          <a className="btn-secondary" href={`/${activeLocale}/dashboard/events`}>Discard changes</a>
          <button className="btn-primary px-4 py-2" type="submit">Create Event</button>
        </div>
      </div>
    </form>
  );
}
