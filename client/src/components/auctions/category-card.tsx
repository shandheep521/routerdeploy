import { Link } from "wouter";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/auctions?category=${category.id}`} className="group">
      <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden">
        <img 
          src={category.imageUrl} 
          alt={category.name} 
          className="w-full h-48 object-cover object-center group-hover:opacity-75"
        />
      </div>
      <h3 className="mt-4 text-sm text-gray-700">{category.name}</h3>
      <p className="mt-1 text-lg font-medium text-gray-900">{category.itemCount} items</p>
    </Link>
  );
}
