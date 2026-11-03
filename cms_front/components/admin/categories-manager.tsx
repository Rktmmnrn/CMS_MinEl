"use client";

import { FolderTree } from "lucide-react";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "@/lib/hooks/use-taxonomy";

export function CategoriesManager() {
    const query = useCategories();
    const create = useCreateCategory();
    const update = useUpdateCategory();
    const remove = useDeleteCategory();

    return (
        <TaxonomyManager
            icon={FolderTree}
            withDescription
            labels={{
                title: "Catégories",
                newButton: "Nouvelle catégorie",
                createTitle: "Nouvelle catégorie",
                editTitle: "Modifier la catégorie",
                empty: "Aucune catégorie pour le moment.",
                created: "Catégorie créée.",
                updated: "Catégorie modifiée.",
                deleted: "Catégorie supprimée.",
                deleteTitle: "Supprimer cette catégorie ?",
                deleteHint: "Cette action est irréversible.",
            }}
            items={query.data}
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => query.refetch()}
            onSave={(slug, v) =>
                slug
                    ? update.mutateAsync({ slug, data: { name: v.name, description: v.description } })
                    : create.mutateAsync({ name: v.name, description: v.description })
            }
            onDelete={(slug) => remove.mutateAsync(slug)}
        />
    );
}
