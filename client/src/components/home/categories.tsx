import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Category } from "@shared/schema";
import { 
  FaCar, 
  FaLaptop, 
  FaGem, 
  FaCouch,
  FaPaintBrush,
  FaBook,
  FaGuitar,
  FaTshirt
} from "react-icons/fa";

// Icon mapping based on the category icon field
const iconMapping: { [key: string]: React.ReactNode } = {
  "fa-car": <FaCar className="text-xl text-primary" />,
  "fa-laptop": <FaLaptop className="text-xl text-primary" />,
  "fa-gem": <FaGem className="text-xl text-primary" />,
  "fa-couch": <FaCouch className="text-xl text-primary" />,
  "fa-paint-brush": <FaPaintBrush className="text-xl text-primary" />,
  "fa-book": <FaBook className="text-xl text-primary" />,
  "fa-guitar": <FaGuitar className="text-xl text-primary" />,
  "fa-tshirt": <FaTshirt className="text-xl text-primary" />
};

// Default categories to show if the API call fails or is loading
const defaultCategories = [
  { id: 1, name: "Vehicles", icon: "fa-car", auctionCount: 420 },
  { id: 2, name: "Electronics", icon: "fa-laptop", auctionCount: 853 },
  { id: 3, name: "Jewelry", icon: "fa-gem", auctionCount: 237 },
  { id: 4, name: "Furniture", icon: "fa-couch", auctionCount: 189 }
];

export default function Categories() {
  const { data: categories, isLoading, error } = useQuery<
    (Category & { auctionCount?: number })[]
  >({
    queryKey: ["/api/categories"],
  });

  // Combine API categories with auction count dummy data for now
  // In a real app, this would come from the API
  const categoriesWithCounts = categories?.map(category => ({
    ...category,
    auctionCount: Math.floor(Math.random() * 900) + 100
  })) || defaultCategories;

  return (
    <section id="categories" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Popular Categories</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoriesWithCounts.map((category) => (
            <Link 
              key={category.id} 
              href={`/auctions?category=${category.id}`}
              className="block"
            >
              <div className="bg-gray-100 rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="bg-primary bg-opacity-10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  {iconMapping[category.icon] || <FaCar className="text-xl text-primary" />}
                </div>
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.auctionCount} auctions</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
