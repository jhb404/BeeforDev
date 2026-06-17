import type { SVGProps } from 'react';

/**
 * Ícones do app. Reaproveita lucide-react (stroke icons, currentColor → tema).
 * Apelidos mantêm compatibilidade com nomes antigos (Bolt, Refresh, Logout).
 * BrandLogo continua customizado (identidade da marca).
 */

export {
  AlertTriangle,
  Bell,
  Briefcase,
  Brush,
  Cake,
  Calendar,
  Check,
  Clock,
  Coffee,
  Download,
  FileText,
  Flame,
  Globe,
  Heart,
  Layers,
  Lock,
  Mail,
  Map,
  MessageCircle,
  Moon,
  Newspaper,
  Package,
  Paperclip,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Sun,
  Trophy,
  Users,
  Wrench,
  X,
  // Aliases p/ compatibilidade com nomes antigos do projeto
  Zap as Bolt,
  RefreshCw as Refresh,
  LogOut as Logout,
  SquarePen as Edit3,
} from 'lucide-react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Marca custom (não tem equivalente em lucide). */
export const BrandLogo = ({ size = 28, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 100 70" fill="currentColor" {...rest}>
    <ellipse cx="22" cy="30" rx="14" ry="20" fillOpacity="0.85" />
    <ellipse cx="78" cy="30" rx="14" ry="20" fillOpacity="0.85" />
    <circle cx="26" cy="55" r="9" fillOpacity="0.7" />
    <circle cx="74" cy="55" r="9" fillOpacity="0.7" />
    <ellipse cx="50" cy="36" rx="20" ry="28" />
    <rect x="36" y="22" width="28" height="5" rx="2" fill="rgba(255,255,255,0.85)" />
    <rect x="36" y="32" width="28" height="5" rx="2" fill="rgba(255,255,255,0.85)" />
    <rect x="36" y="42" width="28" height="5" rx="2" fill="rgba(255,255,255,0.85)" />
  </svg>
);
