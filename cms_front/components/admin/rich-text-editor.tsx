"use client";

import { useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    Bold, Code, Heading2, Heading3, Heading4, Italic, Link2, List, ListOrdered,
    Minus, Quote, Redo2, Strikethrough, Underline, Undo2, Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function ToolButton({
    label, active = false, disabled = false, onClick, children,
}: {
    label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(active && "bg-primary/15 text-primary")}
        >
            {children}
        </Button>
    );
}

const FORBIDDEN_SCHEME = /^(javascript|data|vbscript|file|tel):/i;

function LinkDialog({ editor, open, onClose }: { editor: Editor; open: boolean; onClose: () => void }) {
    const [url, setUrl] = useState(() => (editor.getAttributes("link").href as string | undefined) ?? "");
    const [error, setError] = useState<string | null>(null);

    function apply() {
        const raw = url.trim();
        if (!raw) {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            onClose();
            return;
        }
        if (FORBIDDEN_SCHEME.test(raw)) {
            setError("Seuls les liens http, https et mailto sont acceptés.");
            return;
        }
        let href = raw;
        if (!/^(https?:|mailto:)/i.test(raw)) {
            href = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? `mailto:${raw}` : `https://${raw}`;
        }
        if (editor.state.selection.empty && !editor.isActive("link")) {
            editor.chain().focus()
                .insertContent({ type: "text", text: raw, marks: [{ type: "link", attrs: { href } }] })
                .run();
        } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un lien</DialogTitle>
                    <DialogDescription>
                        Sélectionnez d’abord le texte à transformer en lien. Laissez vide pour retirer le lien.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="link-url">Adresse du lien</Label>
                    <Input
                        id="link-url"
                        autoFocus
                        value={url}
                        placeholder="https://exemple.mg ou adresse e-mail"
                        aria-invalid={!!error}
                        aria-describedby={error ? "link-url-error" : undefined}
                        onChange={(e) => { setUrl(e.target.value); setError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
                    />
                    {error && <p id="link-url-error" className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                    <Button type="button" onClick={apply}>Valider</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Toolbar({ editor }: { editor: Editor | null }) {
    const [linkOpen, setLinkOpen] = useState(false);
    const s = useEditorState({
        editor,
        selector: ({ editor }) => ({
            bold: editor?.isActive("bold") ?? false,
            italic: editor?.isActive("italic") ?? false,
            underline: editor?.isActive("underline") ?? false,
            strike: editor?.isActive("strike") ?? false,
            h2: editor?.isActive("heading", { level: 2 }) ?? false,
            h3: editor?.isActive("heading", { level: 3 }) ?? false,
            h4: editor?.isActive("heading", { level: 4 }) ?? false,
            bullet: editor?.isActive("bulletList") ?? false,
            ordered: editor?.isActive("orderedList") ?? false,
            quote: editor?.isActive("blockquote") ?? false,
            code: editor?.isActive("code") ?? false,
            link: editor?.isActive("link") ?? false,
            canUndo: editor?.can().undo() ?? false,
            canRedo: editor?.can().redo() ?? false,
        }),
    });
    if (!editor || !s) return null;
    const run = () => editor.chain().focus();

    return (
        <div role="toolbar" aria-label="Mise en forme du texte" className="flex flex-wrap gap-0.5 border-b bg-muted/50 p-1.5">
            <ToolButton label="Gras" active={s.bold} onClick={() => run().toggleBold().run()}><Bold className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Italique" active={s.italic} onClick={() => run().toggleItalic().run()}><Italic className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Souligné" active={s.underline} onClick={() => run().toggleUnderline().run()}><Underline className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Barré" active={s.strike} onClick={() => run().toggleStrike().run()}><Strikethrough className="size-4" aria-hidden /></ToolButton>
            <span className="mx-1 w-px bg-border" aria-hidden />
            <ToolButton label="Titre de section" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Sous-titre" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Petit titre" active={s.h4} onClick={() => run().toggleHeading({ level: 4 }).run()}><Heading4 className="size-4" aria-hidden /></ToolButton>
            <span className="mx-1 w-px bg-border" aria-hidden />
            <ToolButton label="Liste à puces" active={s.bullet} onClick={() => run().toggleBulletList().run()}><List className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Liste numérotée" active={s.ordered} onClick={() => run().toggleOrderedList().run()}><ListOrdered className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Citation" active={s.quote} onClick={() => run().toggleBlockquote().run()}><Quote className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Code" active={s.code} onClick={() => run().toggleCode().run()}><Code className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Ligne de séparation" onClick={() => run().setHorizontalRule().run()}><Minus className="size-4" aria-hidden /></ToolButton>
            <span className="mx-1 w-px bg-border" aria-hidden />
            <ToolButton label="Ajouter ou modifier un lien" active={s.link} onClick={() => setLinkOpen(true)}><Link2 className="size-4" aria-hidden /></ToolButton>
            {s.link && (
                <ToolButton label="Retirer le lien" onClick={() => run().extendMarkRange("link").unsetLink().run()}><Unlink className="size-4" aria-hidden /></ToolButton>
            )}
            <span className="mx-1 w-px bg-border" aria-hidden />
            <ToolButton label="Annuler" disabled={!s.canUndo} onClick={() => run().undo().run()}><Undo2 className="size-4" aria-hidden /></ToolButton>
            <ToolButton label="Rétablir" disabled={!s.canRedo} onClick={() => run().redo().run()}><Redo2 className="size-4" aria-hidden /></ToolButton>
            {linkOpen && <LinkDialog editor={editor} open onClose={() => setLinkOpen(false)} />}
        </div>
    );
}

export function RichTextEditor({
    value, onChange, onBlur, invalid = false,
}: {
    value: string; onChange: (html: string) => void; onBlur?: () => void; invalid?: boolean;
}) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3, 4] }, // le serveur n'acceptera que h2 à h4
                link: { openOnClick: false, autolink: false, HTMLAttributes: { target: null, rel: "noopener noreferrer" } },
            }),
        ],
        content: value,
        editorProps: {
            attributes: {
                role: "textbox",
                "aria-multiline": "true",
                "aria-label": "Contenu de l’article",
                class: "rich-content min-h-72 px-4 py-3 focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        onBlur: () => onBlur?.(),
    });

    return (
        <div
            className={cn(
                "overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring/50",
                invalid ? "border-destructive" : "border-input",
            )}
        >
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
