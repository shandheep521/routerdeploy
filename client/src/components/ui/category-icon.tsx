import React from "react";
import { 
  Star,
  Home,
  ShoppingBag,
  Settings,
  Music,
  Book,
  User,
  Activity,
  Map,
  Coffee,
  Camera,
  Clock,
  Smartphone,
  LucideIcon
} from "lucide-react";

interface CategoryIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className, ...props }: CategoryIconProps) {
  // Map of category icon names to their corresponding Lucide components
  const iconMap: Record<string, LucideIcon> = {
    car: ShoppingBag,
    gem: Star,
    laptop: Settings,
    "paint-brush": Settings,
    couch: Home,
    tshirt: ShoppingBag,
    tools: Settings,
    music: Music,
    books: Book,
    baby: User,
    sports: Activity,
    travel: Map,
    kitchen: Coffee,
    wine: Coffee,
    camera: Camera,
    watch: Clock,
    phone: Smartphone,
  };

  // Get the icon component based on the name
  const IconComponent = iconMap[name] || Star; // Default to Star if not found
  
  return <IconComponent className={className} {...props} />;
}
