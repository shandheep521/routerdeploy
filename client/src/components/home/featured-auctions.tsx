import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import AuctionCard from "@/components/auctions/auction-card";
import { 
  Filter, 
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function FeaturedAuctions() {
  const [sortBy, setSortBy] = useState("recent");
  
  const { data: auctions, isLoading, error } = useQuery({
    queryKey: ["/api/auctions", { status: "active" }],
  });
  
  // Sort auctions based on the selected option
  const sortedAuctions = auctions ? [...auctions].sort((a, b) => {
    switch (sortBy) {
      case "ending-soon":
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case "price-low":
        return a.currentPrice - b.currentPrice;
      case "price-high":
        return b.currentPrice - a.currentPrice;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  }) : [];
  
  // Take 4 auctions for the featured section
  const featuredAuctions = sortedAuctions.slice(0, 4);

  return (
    <section id="featured" className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h2 className="text-2xl font-bold mb-4 sm:mb-0">Featured Auctions</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button variant="outline" className="whitespace-nowrap">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-10 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading auctions. Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
              
              {featuredAuctions.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No active auctions found.</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 text-center">
              <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary hover:text-white px-6 py-6">
                <Link href="/auctions">View All Auctions</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
