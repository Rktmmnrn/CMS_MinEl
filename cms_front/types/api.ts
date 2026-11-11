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
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Media {
  id: string;
  file: string;
  filename: string;
  mime_type: string;
  size: number;
  alt_text: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface Article {
  id: string;
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
  category_id: string | null;
  cover_image_id?: string | null;
  tag_ids: string[];
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: PageStatus;
  show_in_menu: boolean;
  parent_id: string | null;
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
  parent_id: string | null;
}

export interface CategoryInput {
  name: string;
  description: string;
}

export interface TagInput {
  name: string;
}

export interface User {
  id: string;
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
  id: string;
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
