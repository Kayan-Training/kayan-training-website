"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlignLeft,
  ArrowLeft,
  FileText,
  Info,
  Loader2,
  Search,
  Tag,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadProgress } from "@/components/ui/upload-progress";
import { uploadMediaFile } from "@/lib/client/media-upload";
import { cn } from "@/lib/utils";

// ─── Schema ────────────────────────────────────────────────────────────────────

const postSchema = z.object({
  categories: z.array(z.string()),
  contentAr: z.string(),
  contentEn: z.string(),
  excerptAr: z.string().max(300),
  excerptEn: z.string().max(300),
  featuredImageId: z.string(),
  publishedAt: z.string(),
  seoDescriptionAr: z.string(),
  seoDescriptionEn: z.string(),
  seoTitleAr: z.string(),
  seoTitleEn: z.string(),
  slug: z.string().min(1),
  status: z.enum(["draft", "published", "archived"]),
  titleAr: z.string().min(1),
  titleEn: z.string().min(1),
});

export type PostFormValues = z.infer<typeof postSchema>;

// ─── Style constants ────────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-xs " +
  "placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none focus:ring-2 " +
  "focus:ring-teal-500/10 transition-colors";

const labelCls = "text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400";

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({
  description,
  icon: Icon,
  number,
  title,
}: {
  description: string;
  icon: React.ElementType;
  number: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[11px] font-medium text-zinc-300">{number}</span>
        <Icon className="size-4 text-teal-600" />
        <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
        <span className="ml-auto text-[11px] text-zinc-400">{description}</span>
      </div>
      <div className="mt-3 h-px bg-zinc-100" />
    </div>
  );
}

function FL({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <Label className={labelCls}>{children}</Label>
      {hint ? <span className="text-[11px] text-zinc-400">{hint}</span> : null}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-teal-100 bg-teal-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-teal-700">
      <Info className="mt-0.5 size-3.5 shrink-0 text-teal-500" />
      <span>{children}</span>
    </div>
  );
}

function toSlug(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[؀-ۿ\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Sections ──────────────────────────────────────────────────────────────────

type SectionId = "identity" | "content" | "seo" | "categories";

const sectionNav: Array<{ id: SectionId; label: string; icon: React.ElementType }> = [
  { id: "identity", label: "Identity", icon: FileText },
  { id: "content", label: "Content", icon: AlignLeft },
  { id: "seo", label: "SEO", icon: Search },
  { id: "categories", label: "Categories", icon: Tag },
];

// ─── PostForm ─────────────────────────────────────────────────────────────────

export function PostForm({
  categoryOptions,
  defaultValues,
  fetchMedia,
  featuredImageUrl,
  locale,
  onSubmit,
  postId,
  submitLabel,
}: {
  categoryOptions: Array<{ label: string; value: string }>;
  defaultValues?: Partial<PostFormValues>;
  fetchMedia: () => Promise<{ id: string; originalName: string; url: string; mimeType: string }[]>;
  featuredImageUrl?: string;
  locale: string;
  onSubmit: (values: PostFormValues) => Promise<{ error?: string }>;
  postId?: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [activeLocale, setActiveLocale] = useState<"en" | "ar">("en");
  const [activeSection, setActiveSection] = useState<SectionId>("identity");
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadStatus, setCoverUploadStatus] = useState("");
  const [coverPreview, setCoverPreview] = useState<string>(featuredImageUrl ?? "");
  const [coverLibraryOpen, setCoverLibraryOpen] = useState(false);
  const [coverLibraryLoading, setCoverLibraryLoading] = useState(false);
  const [coverLibraryItems, setCoverLibraryItems] = useState<{ id: string; originalName: string; url: string; mimeType: string }[]>([]);

  const form = useForm<PostFormValues>({
    defaultValues: {
      categories: [],
      contentAr: "",
      contentEn: "",
      excerptAr: "",
      excerptEn: "",
      featuredImageId: "",
      publishedAt: "",
      seoDescriptionAr: "",
      seoDescriptionEn: "",
      seoTitleAr: "",
      seoTitleEn: "",
      slug: "",
      status: "draft",
      titleAr: "",
      titleEn: "",
      ...defaultValues,
    },
    resolver: zodResolver(postSchema),
  });

  const { watch, setValue } = form;
  const status = watch("status");
  const slug = watch("slug");
  const selectedCategories = watch("categories");

  function handleSubmit(values: PostFormValues) {
    startTransition(async () => {
      const result = await onSubmit(values);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Post saved");
        router.refresh();
      }
    });
  }

  async function handleCoverUpload(file: File) {
    setIsCoverUploading(true);
    setCoverUploadProgress(0);
    setCoverUploadStatus("");
    try {
      const media = await uploadMediaFile(file, {
        onProgress: (percent) => setCoverUploadProgress(percent),
        onStatus: (status) => setCoverUploadStatus(status),
      });
      setValue("featuredImageId", media.id);
      setCoverPreview(media.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsCoverUploading(false);
    }
  }

  async function openCoverLibrary() {
    setCoverLibraryLoading(true);
    try {
      const items = await fetchMedia();
      setCoverLibraryItems(items);
      setCoverLibraryOpen(true);
    } finally {
      setCoverLibraryLoading(false);
    }
  }

  return (
    <div className="event-editor">
      {/* ── Left nav rail ──────────────────────────────────────────────────── */}
      <nav className="event-editor__rail">
        <div className="px-4 py-5">
          <Button
            className="mb-6 h-8 w-full justify-start gap-2 border-zinc-200 bg-zinc-50 text-xs text-zinc-600 hover:bg-zinc-100"
            render={<Link href={`/${locale}/dashboard/posts`} />}
            size="sm"
            type="button"
            variant="outline"
          >
            <ArrowLeft className="size-3.5" />
            All Posts
          </Button>

          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-zinc-300">
            Sections
          </p>
          <div className="space-y-0.5">
            {sectionNav.map(({ id, label, icon: Icon }) => (
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12.5px] font-medium transition-colors",
                  activeSection === id
                    ? "bg-teal-50 text-teal-700"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
                )}
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-auto border-t border-zinc-100 px-4 py-4">
          <p className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            status === "published" ? "bg-teal-50 text-teal-700" : "bg-zinc-100 text-zinc-500",
          )}>
            <span className={cn("size-1.5 rounded-full", status === "published" ? "bg-teal-500" : "bg-zinc-400")} />
            {status === "published" ? "Published" : status === "archived" ? "Archived" : "Draft"}
          </p>
        </div>
      </nav>

      {/* ── Main panel ─────────────────────────────────────────────────────── */}
      <Form {...form}>
        <form
          className="flex min-h-0 flex-col"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-white/80 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-zinc-800">
                {postId ? "Edit Post" : "New Post"}
              </span>
              {slug ? (
                <span className="font-mono text-[11px] text-zinc-400">/{slug}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {/* Locale toggle */}
              <div className="flex rounded-md border border-zinc-200">
                {(["en", "ar"] as const).map((loc) => (
                  <button
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                      activeLocale === loc
                        ? "bg-teal-600 text-white"
                        : "text-zinc-500 hover:bg-zinc-50",
                    )}
                    key={loc}
                    type="button"
                    onClick={() => setActiveLocale(loc)}
                  >
                    {loc === "en" ? "EN" : "AR"}
                  </button>
                ))}
              </div>
              <Button
                className="h-8 bg-teal-600 px-4 text-xs text-white hover:bg-teal-700"
                disabled={isPending}
                size="sm"
                type="submit"
              >
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {submitLabel}
              </Button>
            </div>
          </div>

          {/* Section content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* ── Identity ─────────────────────────────────────────────── */}
            {activeSection === "identity" && (
              <div className="mx-auto max-w-2xl space-y-5">
                <SectionHeader
                  description="Core post fields"
                  icon={FileText}
                  number="01"
                  title="Identity"
                />

                {activeLocale === "en" ? (
                  <>
                    <div>
                      <FL>Title (English)</FL>
                      <FormField
                        control={form.control}
                        name="titleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                className={inputCls}
                                placeholder="Post title in English"
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (!form.getValues("slug")) {
                                    setValue("slug", toSlug(e.target.value));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FL hint="Used in URL">Slug</FL>
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                className={inputCls}
                                placeholder="post-url-slug"
                                onBlur={(e) => {
                                  field.onChange(toSlug(e.target.value));
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FL hint="Max 300 chars">Excerpt (English)</FL>
                      <FormField
                        control={form.control}
                        name="excerptEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-20 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                                placeholder="Brief summary shown in listing..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FL>Title (Arabic)</FL>
                      <FormField
                        control={form.control}
                        name="titleAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                {...field}
                                className={cn(inputCls, "text-right")}
                                dir="rtl"
                                placeholder="عنوان المقال بالعربية"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FL hint="Max 300 chars">Excerpt (Arabic)</FL>
                      <FormField
                        control={form.control}
                        name="excerptAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-20 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 text-right"
                                dir="rtl"
                                placeholder="ملخص قصير يظهر في قائمة المقالات..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Status & publish date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FL>Status</FL>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                              <SelectTrigger className={cn(inputCls, "cursor-pointer pr-8")}>
                                <span className="truncate">
                                  {field.value === "published" ? "Published" : field.value === "archived" ? "Archived" : "Draft"}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <FL>Publish Date</FL>
                    <FormField
                      control={form.control}
                      name="publishedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <input {...field} className={inputCls} type="datetime-local" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Featured image */}
                <div>
                  <FL>Featured Image</FL>
                  <input
                    accept="image/*"
                    aria-label="Featured image upload"
                    className="hidden"
                    ref={coverInputRef}
                    title="Featured image"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                    }}
                  />
                  {coverPreview ? (
                    <div className="relative mb-2 h-40 overflow-hidden rounded-md border border-zinc-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className="h-full w-full object-cover" src={coverPreview} />
                      <button
                        className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium text-zinc-600 shadow-sm hover:bg-white"
                        type="button"
                        onClick={() => {
                          setCoverPreview("");
                          setValue("featuredImageId", "");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                  <button
                    className="flex h-9 items-center gap-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-4 text-[12.5px] text-zinc-500 transition-colors hover:border-teal-400 hover:bg-teal-50/60 hover:text-teal-700"
                    disabled={isCoverUploading}
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {isCoverUploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {isCoverUploading ? `Uploading… ${coverUploadProgress}%` : coverPreview ? "Replace image" : "Upload image"}
                  </button>
                  <button
                    className="ml-2 inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-[12.5px] text-zinc-600 transition-colors hover:border-teal-400 hover:text-teal-700 disabled:opacity-50"
                    disabled={coverLibraryLoading || isCoverUploading}
                    type="button"
                    onClick={() => void openCoverLibrary()}
                  >
                    {coverLibraryLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                    Browse library
                  </button>
                  <UploadProgress
                    className="mt-2"
                    isActive={isCoverUploading}
                    percent={coverUploadProgress}
                    status={coverUploadStatus}
                  />
                </div>
              </div>
            )}

            {/* ── Content ──────────────────────────────────────────────── */}
            {activeSection === "content" && (
              <div className="mx-auto max-w-3xl space-y-5">
                <SectionHeader
                  description={`Writing in ${activeLocale === "en" ? "English" : "Arabic"}`}
                  icon={AlignLeft}
                  number="02"
                  title="Content"
                />
                <Note>
                  {activeLocale === "en"
                    ? "Write the full article body here. Use the toolbar for headings, lists, bold, links, and images."
                    : "اكتب محتوى المقال الكامل هنا. استخدم شريط الأدوات للعناوين والقوائم والروابط والصور."}
                </Note>
                {activeLocale === "en" ? (
                  <FormField
                    control={form.control}
                    name="contentEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor
                            key="content-en"
                            placeholder="Start writing..."
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="contentAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor
                            key="content-ar"
                            dir="rtl"
                            placeholder="ابدأ الكتابة..."
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* ── SEO ──────────────────────────────────────────────────── */}
            {activeSection === "seo" && (
              <div className="mx-auto max-w-2xl space-y-5">
                <SectionHeader
                  description="Search engine optimisation"
                  icon={Search}
                  number="03"
                  title="SEO"
                />
                {activeLocale === "en" ? (
                  <>
                    <div>
                      <FL hint="Max 60 chars">SEO Title (English)</FL>
                      <FormField
                        control={form.control}
                        name="seoTitleEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input {...field} className={inputCls} maxLength={60} placeholder="Overrides page <title>" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FL hint="Max 160 chars">Meta Description (English)</FL>
                      <FormField
                        control={form.control}
                        name="seoDescriptionEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-20 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none"
                                maxLength={160}
                                placeholder="Shown in Google search results..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FL hint="Max 60 chars">SEO Title (Arabic)</FL>
                      <FormField
                        control={form.control}
                        name="seoTitleAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input {...field} className={cn(inputCls, "text-right")} dir="rtl" maxLength={60} placeholder="يستبدل عنوان الصفحة" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FL hint="Max 160 chars">Meta Description (Arabic)</FL>
                      <FormField
                        control={form.control}
                        name="seoDescriptionAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-20 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-300 focus:border-teal-500 focus:outline-none text-right"
                                dir="rtl"
                                maxLength={160}
                                placeholder="يظهر في نتائج جوجل..."
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <Note>
                  Leave blank to auto-generate from the post title and excerpt.
                </Note>
              </div>
            )}

            {/* ── Categories ───────────────────────────────────────────── */}
            {activeSection === "categories" && (
              <div className="mx-auto max-w-2xl space-y-5">
                <SectionHeader
                  description="Taxonomy"
                  icon={Tag}
                  number="04"
                  title="Categories"
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categoryOptions.map((cat) => {
                    const selected = selectedCategories.includes(cat.value);
                    return (
                      <button
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors",
                          selected
                            ? "border-teal-300 bg-teal-50 text-teal-800"
                            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
                        )}
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          const current = form.getValues("categories");
                          setValue(
                            "categories",
                            selected ? current.filter((id) => id !== cat.value) : [...current, cat.value],
                          );
                        }}
                      >
                        <span className={cn("size-2 rounded-full shrink-0", selected ? "bg-teal-500" : "bg-zinc-300")} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                {categoryOptions.length === 0 && (
                  <p className="text-sm text-zinc-400">No categories yet. Create them in the Categories section.</p>
                )}
              </div>
            )}
          </div>
        </form>
      </Form>

      <Dialog onOpenChange={setCoverLibraryOpen} open={coverLibraryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          {coverLibraryItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No images uploaded yet.</p>
          ) : (
            <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
              {coverLibraryItems.map((item) => (
                <button
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/50 hover:border-primary"
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setValue("featuredImageId", item.id);
                    setCoverPreview(item.url);
                    setCoverLibraryOpen(false);
                  }}
                >
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={item.originalName} className="h-full w-full object-cover transition-transform group-hover:scale-105" src={item.url} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Video className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {item.mimeType.startsWith("image/") ? "image" : "video"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
