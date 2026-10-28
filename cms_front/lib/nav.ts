import {
  FileText,
  Files,
  FolderTree,
  Images,
  LayoutDashboard,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Articles", href: "/dashboard/articles", icon: FileText },
  { label: "Pages", href: "/dashboard/pages", icon: Files },
  { label: "Catégories", href: "/dashboard/categories", icon: FolderTree },
  { label: "Étiquettes", href: "/dashboard/tags", icon: Tags },
  { label: "Médiathèque", href: "/dashboard/medias", icon: Images },
  { label: "Utilisateurs", href: "/dashboard/utilisateurs", icon: Users, adminOnly: true },
];

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
} as const;
