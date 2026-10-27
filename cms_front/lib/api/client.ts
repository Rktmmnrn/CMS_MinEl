import type { ApiFieldErrors } from "@/types/api";

const API_BASE = "/api/v1";

/* ---------- Access token : en mémoire uniquement ---------- */

let accessToken: string | null = null;

export function getAccessToken() {
    return accessToken;
}

export function setAccessToken(token: string | null) {
    accessToken = token;
}

/* ---------- Session expirée : l'AuthProvider s'abonne ici ---------- */

let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
    sessionExpiredHandler = handler;
}

/* ---------- Erreurs ---------- */

const DEFAULT_MESSAGES: Record<number, string> = {
    0: "Impossible de joindre le serveur. Vérifiez votre connexion.",
    400: "Certaines informations sont invalides.",
    401: "Identifiants invalides ou session expirée.",
    403: "Vous n’avez pas les droits nécessaires pour cette action.",
    404: "Élément introuvable.",
    409: "Cette action n’est pas possible dans l’état actuel.",
    429: "Trop de tentatives. Réessayez dans une minute.",
};

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(status: number, data: unknown) {
        super(
            DEFAULT_MESSAGES[status] ??
            (status >= 500
                ? "Erreur du serveur. Réessayez plus tard."
                : "Une erreur est survenue."),
        );
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }

    get fieldErrors(): ApiFieldErrors {
        if (this.status !== 400 || typeof this.data !== "object" || !this.data) {
            return {};
        }
        const out: ApiFieldErrors = {};
        for (const [key, value] of Object.entries(this.data)) {
            if (Array.isArray(value)) out[key] = value.map(String);
            else if (typeof value === "string") out[key] = [value];
        }
        return out;
    }
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Une erreur est survenue.";
}

/* ---------- Refresh : une seule requête à la fois ---------- */

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
    try {
        const res = await fetch(`${API_BASE}/auth/refresh/`, {
            method: "POST",
            credentials: "include",
        });
        if (!res.ok) {
            accessToken = null;
            return null;
        }
        const data = (await res.json()) as { access: string };
        accessToken = data.access;
        return data.access;
    } catch {
        return null;
    }
}

/**
 * Le cookie est renouvelé par rotation : deux refresh simultanés
 * invalideraient la session.
 */
export function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

/* ---------- apiFetch ---------- */

type QueryValue = string | number | boolean | null | undefined;

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    auth?: boolean;
    query?: Record<string, QueryValue>;
}

function buildQuery(query?: Record<string, QueryValue>) {
    if (!query) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    }
    const str = params.toString();
    return str ? `?${str}` : "";
}

async function toApiError(res: Response) {
    let data: unknown = null;
    try {
        data = await res.json();
    } catch {
    }
    return new ApiError(res.status, data);
}

export async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
): Promise<T> {
    const { auth = true, query, body, headers, ...init } = options;
    const url = `${API_BASE}${path}${buildQuery(query)}`;

    const send = async () => {
        const h = new Headers(headers);
        h.set("Accept", "application/json");

        let payload: BodyInit | undefined;
        if (body instanceof FormData) {
            payload = body;
        } else if (body !== undefined) {
            h.set("Content-Type", "application/json");
            payload = JSON.stringify(body);
        }
        if (auth && accessToken) h.set("Authorization", `Bearer ${accessToken}`);

        try {
            return await fetch(url, {
                ...init,
                headers: h,
                body: payload,
                credentials: "include",
            });
        } catch {
            throw new ApiError(0, null);
        }
    };

    let res = await send();

    if (res.status === 401 && auth) {
        const token = await refreshAccessToken();
        if (!token) {
            sessionExpiredHandler?.();
            throw await toApiError(res);
        }
        res = await send();
        if (res.status === 401) sessionExpiredHandler?.();
    }

    if (!res.ok) throw await toApiError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
