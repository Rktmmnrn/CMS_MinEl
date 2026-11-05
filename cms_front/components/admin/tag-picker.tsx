"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { frenchFieldError } from "@/lib/i18n/errors";
import { useCreateTag, useTags } from "@/lib/hooks/use-taxonomy";
import { cn } from "@/lib/utils";
import type { Tag } from "@/types/api";

const TAG_MAX = 50;

const normalize = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

type Option = { kind: "tag"; tag: Tag } | { kind: "create"; name: string };

export function TagPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
    const { data: tags = [], isPending } = useTags();
    const create = useCreateTag();
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const listId = useId();

    const selected = tags.filter((t) => value.includes(t.id));
    const q = normalize(query);
    const exact = tags.find((t) => normalize(t.name) === q);
    const alreadyAdded = !!exact && value.includes(exact.id);

    const options: Option[] = tags
        .filter((t) => !value.includes(t.id) && (!q || normalize(t.name).includes(q)))
        .slice(0, 8)
        .map((tag) => ({ kind: "tag", tag }));
    if (q && !exact) options.push({ kind: "create", name: query.trim() });

    const tooLong = query.trim().length > TAG_MAX;

    function addTag(tag: Tag) {
        onChange([...value, tag.id]);
        setQuery("");
        setActive(0);
    }

    async function createTag(name: string) {
        if (name.length > TAG_MAX) return;
        try {
            const tag = await create.mutateAsync({ name });
            addTag(tag);
            toast.success(`Étiquette « ${tag.name} » créée.`);
        } catch (e) {
            toast.error(
                e instanceof ApiError && e.status === 400
                    ? frenchFieldError("name", e.fieldErrors.name ?? [])
                    : getErrorMessage(e),
            );
        }
    }

    function choose(option: Option | undefined) {
        if (!option) return;
        if (option.kind === "tag") addTag(option.tag);
        else void createTag(option.name);
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, options.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (open) choose(options[active]);
        } else if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "Backspace" && !query && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    }

    const showList = open && !isPending && (options.length > 0 || alreadyAdded || tooLong);

    return (
        <div className="space-y-2">
            {selected.length > 0 && (
                <ul aria-label="Étiquettes choisies" className="flex flex-wrap gap-1.5">
                    {selected.map((tag) => (
                        <li key={tag.id} className="inline-flex items-center gap-1 rounded-full bg-accent py-0.5 pl-2.5 pr-1 text-sm text-accent-foreground">
                            {tag.name}
                            <button
                                type="button"
                                aria-label={`Retirer l’étiquette ${tag.name}`}
                                onClick={() => onChange(value.filter((id) => id !== tag.id))}
                                className="flex size-5 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-ring"
                            >
                                <X className="size-3.5" aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="relative">
                <Input
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={showList && options[active] ? `${listId}-${active}` : undefined}
                    aria-label="Ajouter une étiquette"
                    placeholder={isPending ? "Chargement…" : "Rechercher ou créer une étiquette…"}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onKeyDown}
                />
                {showList && (
                    <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-md">
                        {options.map((option, i) => (
                            <li
                                key={option.kind === "tag" ? option.tag.id : "create"}
                                id={`${listId}-${i}`}
                                role="option"
                                aria-selected={i === active}
                                onMouseDown={(e) => { e.preventDefault(); choose(option); }}
                                className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm", i === active && "bg-muted")}
                            >
                                {option.kind === "tag" ? (
                                    option.tag.name
                                ) : (
                                    <>
                                        <Plus className="size-4 text-primary" aria-hidden />
                                        Créer « {option.name} »
                                    </>
                                )}
                            </li>
                        ))}
                        {alreadyAdded && <li className="px-2.5 py-2 text-sm text-muted-foreground">Cette étiquette est déjà ajoutée.</li>}
                        {tooLong && <li className="px-2.5 py-2 text-sm text-destructive">{TAG_MAX} caractères maximum.</li>}
                    </ul>
                )}
            </div>
        </div>
    );
}
