"use client";

import { Tags } from "lucide-react";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from "@/lib/hooks/use-taxonomy";
import { tagSchema } from "@/lib/schemas/taxonomy";

export function TagsManager() {
    const query = useTags();
    const create = useCreateTag();
    const update = useUpdateTag();
    const remove = useDeleteTag();

    return (
        <TaxonomyManager
            icon={Tags}
            labels={{
                title: "Étiquettes",
                newButton: "Nouvelle étiquette",
                createTitle: "Nouvelle étiquette",
                editTitle: "Modifier l’étiquette",
                empty: "Aucune étiquette pour le moment.",
                created: "Étiquette créée.",
                updated: "Étiquette modifiée.",
                deleted: "Étiquette supprimée.",
                deleteTitle: "Supprimer cette étiquette ?",
                deleteHint: "Elle sera retirée des articles qui l’utilisent.",
            }}
            items={query.data}
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            schema={tagSchema}
            onRetry={() => query.refetch()}
            onSave={(slug, v) =>
                slug ? update.mutateAsync({ slug, data: { name: v.name } }) : create.mutateAsync({ name: v.name })
            }
            onDelete={(slug) => remove.mutateAsync(slug)}
        />
    );
}
