export type Role = "ADMIN" | "EDITOR";
export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type PageStatus = "DRAFT" | "PUBLISHED";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Erreurs de validation (400) */
export type ApiFieldErrors = Record<string, string[]>;

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Media {
  id: number;
  file: string;
  filename: string;
  mime_type: string;
  size: number;
  alt_text: string;
  uploaded_at: string;
  uploaded_by: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  status: ArticleStatus;
  author: string;
  category: Category | null;
  cover_image: Media | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ArticleInput {
  title: string;
  body: string;
  excerpt: string;
  category_id: number | null;
  cover_image_id: number | null;
  tag_ids: number[];
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  body: string;
  status: PageStatus;
  show_in_menu: boolean;
  position: number;
  author: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface PageInput {
  title: string;
  body: string;
  show_in_menu: boolean;
  position: number;
}

export interface CategoryInput {
  name: string;
  description: string;
}

export interface TagInput {
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string; // sur /auth/me/ seulement
  role: Role;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface UserCreateInput {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  password: string;
}

export interface UserUpdateInput {
  role?: Role;
  is_active?: boolean;
  password?: string;
}

export interface LoginResponse {
  access: string;
  role: Role;
}

export interface DashboardItem {
  type: "article" | "page";
  id: number;
  title: string;
  slug: string;
  status: ArticleStatus | PageStatus;
  updated_at: string;
}

export interface Dashboard {
  articles: number;
  pages: number;
  latest_contents: DashboardItem[];
  users?: number; // Admin seulement
}
