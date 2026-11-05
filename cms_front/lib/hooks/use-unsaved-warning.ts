import { useEffect } from "react";

const MESSAGE = "Vous avez des modifications non enregistrées. Quitter cette page ?";

export function useUnsavedWarning(active: boolean) {
    useEffect(() => {
        if (!active) return;

        // Fermeture de l'onglet, rechargement, lien externe
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        // Liens internes
        const onClick = (e: MouseEvent) => {
            const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
            if (!link || link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
            const url = new URL(link.href);
            if (url.origin !== window.location.origin) return;
            if (url.pathname === window.location.pathname) return;
            if (!window.confirm(MESSAGE)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        document.addEventListener("click", onClick, true);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            document.removeEventListener("click", onClick, true);
        };
    }, [active]);
}
