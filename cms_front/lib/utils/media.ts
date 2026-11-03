export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

export function validateImage(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return "format non accepté (JPEG, PNG, GIF ou WebP uniquement).";
    }
    if (file.size > MAX_IMAGE_SIZE) {
        return "fichier trop lourd (5 Mo maximum).";
    }
    return null;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
