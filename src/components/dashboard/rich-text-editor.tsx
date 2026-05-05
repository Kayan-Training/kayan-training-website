"use client";

/**
 * TipTap editor used by dashboard content forms.
 *
 * The editor stores rich HTML and routes inline image uploads through the media
 * library upload API so inserted assets remain manageable from the dashboard.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Heading02Icon,
  ImageAdd02Icon,
  LeftToRightListBulletIcon,
  Link03Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadProgress } from "@/components/ui/upload-progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { uploadMediaFile } from "@/lib/client/media-upload";

const allowedLinkPattern = /^(https?:\/\/|mailto:|tel:)/i;

export function RichTextEditor({
  dir = "ltr",
  onChange,
  placeholder,
  value,
}: {
  dir?: "ltr" | "rtl";
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [imageUploadStatus, setImageUploadStatus] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit,
      Link.configure({
        autolink: true,
        enableClickSelection: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
        validate: (href) => allowedLinkPattern.test(href),
      }),
      Image.configure({
        HTMLAttributes: {
          loading: "lazy",
        },
        inline: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: value || "",
    editorProps: {
      attributes: {
        class: "rte-content",
        dir,
      },
      handleDOMEvents: {
        click: (_view, event) => {
          const target = event.target;
          const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;

          if (!element?.closest("a")) {
            return false;
          }

          event.preventDefault();
          return true;
        },
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML()),
  });

  const linkBubbleMenuOptions = useMemo(
    () => ({
      placement: "bottom-start" as const,
    }),
    [],
  );

  const shouldShowLinkBubble = useCallback(
    ({ editor: currentEditor }: { editor: NonNullable<typeof editor> }) => currentEditor.isActive("link"),
    [],
  );

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const activeEditor = editor;

  const blockLabel = activeEditor.isActive("heading", { level: 2 })
    ? "Heading 2"
    : activeEditor.isActive("heading", { level: 3 })
      ? "Heading 3"
      : "Paragraph";

  function openLinkDialog() {
    const previous = activeEditor.getAttributes("link").href as string | undefined;
    setLinkUrl(previous ?? "");
    setIsLinkDialogOpen(true);
  }

  function openCurrentLink() {
    const href = activeEditor.getAttributes("link").href as string | undefined;
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  function removeCurrentLink() {
    activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  function preventToolbarMouseDown(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  function handleSetLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedHref = linkUrl.trim();

    if (!normalizedHref) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkDialogOpen(false);
      return;
    }

    if (!allowedLinkPattern.test(normalizedHref)) {
      toast.error("Link must start with https://, http://, mailto:, or tel:.");
      return;
    }

    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
    setIsLinkDialogOpen(false);
  }

  function openImageDialog() {
    setSelectedImage(null);
    setImageAlt("");
    setIsImageDialogOpen(true);
  }

  async function handleImageUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedImage) {
      toast.error("Select an image file first.");
      return;
    }

    if (!selectedImage.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadProgress(0);
    setImageUploadStatus("");

    try {
      const media = await uploadMediaFile(selectedImage, {
        onProgress: (percent) => setImageUploadProgress(percent),
        onStatus: (status) => setImageUploadStatus(status),
      });
      activeEditor
        .chain()
        .focus()
        .setImage({ alt: imageAlt.trim() || selectedImage.name, src: media.url })
        .run();
      toast.success("Image uploaded and inserted.");
      setIsImageDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div className="rte-box">
      <div className="rte-toolbar">
        <Select
          value={blockLabel}
          onValueChange={(nextValue) => {
            if (nextValue === "Heading 2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            if (nextValue === "Heading 3") editor.chain().focus().toggleHeading({ level: 3 }).run();
            if (nextValue === "Paragraph") editor.chain().focus().setParagraph().run();
          }}
        >
          <SelectTrigger className="tb-select">
            <span>{blockLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Paragraph">Paragraph</SelectItem>
              <SelectItem value="Heading 2">Heading 2</SelectItem>
              <SelectItem value="Heading 3">Heading 3</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="tb-sep" />
        <Button className={`tb-btn ${editor.isActive("bold") ? "on" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()} size="icon" title="Bold" type="button" variant="ghost">
          <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
        </Button>
        <Button className={`tb-btn ${editor.isActive("italic") ? "on" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} size="icon" title="Italic" type="button" variant="ghost">
          <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
        </Button>
        <Button className={`tb-btn ${editor.isActive("strike") ? "on" : ""}`} onClick={() => editor.chain().focus().toggleStrike().run()} size="icon" title="Strikethrough" type="button" variant="ghost">
          <HugeiconsIcon icon={TextStrikethroughIcon} strokeWidth={2} />
        </Button>
        <span className="tb-sep" />
        <Button className={`tb-btn ${editor.isActive("bulletList") ? "on" : ""}`} onClick={() => editor.chain().focus().toggleBulletList().run()} size="icon" title="Bullet list" type="button" variant="ghost">
          <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} />
        </Button>
        <Button className={`tb-btn ${editor.isActive("heading", { level: 2 }) ? "on" : ""}`} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} size="icon" title="Heading" type="button" variant="ghost">
          <HugeiconsIcon icon={Heading02Icon} strokeWidth={2} />
        </Button>
        <span className="tb-sep" />
        <Button className={`tb-wide ${editor.isActive("link") ? "on" : ""}`} onClick={openLinkDialog} type="button" variant="ghost">
          <HugeiconsIcon icon={Link03Icon} strokeWidth={2} />
          Link
        </Button>
        <Button className="tb-wide" onClick={openImageDialog} type="button" variant="ghost">
          <HugeiconsIcon icon={ImageAdd02Icon} strokeWidth={2} />
          Image
        </Button>
      </div>

      <EditorContent editor={editor} />

      <BubbleMenu
        editor={editor}
        options={linkBubbleMenuOptions}
        shouldShow={shouldShowLinkBubble}
        updateDelay={0}
      >
        <div className="rte-link-bubble">
          <span>{String(editor.getAttributes("link").href ?? "")}</span>
          <Button onClick={openCurrentLink} onMouseDown={preventToolbarMouseDown} size="xs" type="button" variant="outline">
            View
          </Button>
          <Button onClick={openLinkDialog} onMouseDown={preventToolbarMouseDown} size="xs" type="button" variant="outline">
            Edit
          </Button>
          <Button onClick={removeCurrentLink} onMouseDown={preventToolbarMouseDown} size="xs" type="button" variant="outline">
            Remove
          </Button>
        </div>
      </BubbleMenu>

      <div className="rte-footer">
        <span className="rte-info">TipTap editor - supports headings, lists, links, and uploaded media</span>
        <span className="rte-mode on">Visual</span>
      </div>

      <Dialog onOpenChange={setIsLinkDialogOpen} open={isLinkDialogOpen}>
        <DialogContent className="bg-white text-[#1a1510] sm:max-w-md">
          <form className="space-y-4" onSubmit={handleSetLink}>
            <DialogHeader>
              <DialogTitle>Insert link</DialogTitle>
              <DialogDescription>Use https://, http://, mailto:, or tel:. Leave empty to remove the selected link.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7a6e60]" htmlFor="dashboard-rte-link-url">
                URL
              </label>
              <Input
                autoFocus
                className="bg-white text-[#1a1510]"
                id="dashboard-rte-link-url"
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com"
                value={linkUrl}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsLinkDialogOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit">{linkUrl.trim() ? "Apply link" : "Remove link"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setIsImageDialogOpen} open={isImageDialogOpen}>
        <DialogContent className="bg-white text-[#1a1510] sm:max-w-md">
          <form className="space-y-4" onSubmit={handleImageUpload}>
            <DialogHeader>
              <DialogTitle>Upload image</DialogTitle>
              <DialogDescription>Choose an image to insert into the editor. The uploaded file will be saved in Media.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7a6e60]" htmlFor="dashboard-rte-image-file">
                Image file
              </label>
              <Input
                accept="image/*"
                className="bg-white text-[#1a1510]"
                id="dashboard-rte-image-file"
                onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                type="file"
              />
              {selectedImage ? <p className="text-xs text-[#7a6e60]">{selectedImage.name}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#7a6e60]" htmlFor="dashboard-rte-image-alt">
                Alt text
              </label>
              <Input
                className="bg-white text-[#1a1510]"
                id="dashboard-rte-image-alt"
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe the image"
                value={imageAlt}
              />
            </div>
            <DialogFooter>
              <Button disabled={isUploadingImage} onClick={() => setIsImageDialogOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={isUploadingImage} type="submit">
                {isUploadingImage ? `Uploading... ${imageUploadProgress}%` : "Upload and insert"}
              </Button>
            </DialogFooter>
            <UploadProgress
              className="border-[#e7ddd1] bg-[#faf6f0]"
              isActive={isUploadingImage}
              percent={imageUploadProgress}
              status={imageUploadStatus}
            />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
