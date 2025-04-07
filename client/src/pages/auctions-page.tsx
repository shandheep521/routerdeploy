import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearch, useLocation } from "wouter";
import { Product, Category } from "@shared/schema";
import { Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AuctionCard from "@/components/auctions/auction-card";

export default function AuctionsPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const queryParams = new URLSearchParams(search);
  const categoryId = queryParams.get("category");
  const status = queryParams.get("status");
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>(status || "all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch all categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch products based on filters
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ["/api/products", { 
      categoryId: selectedCategory === "all" ? undefined : selectedCategory, 
      status: selectedStatus === "all" ? undefined : selectedStatus 
    }],
  });

  // Apply filters
  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") newParams.set("category", selectedCategory);
    if (selectedStatus && selectedStatus !== "all") newParams.set("status", selectedStatus);
    
    setLocation(`/auctions?${newParams.toString()}`);
    setFilterOpen(false);
    refetch();
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedStatus("all");
    setPriceRange([0, 5000]);
    setSearchTerm("");
    setLocation("/auctions");
    setFilterOpen(false);
    refetch();
  };

  // Filter products by search term and price range
  const filteredProducts = products?.filter(product => {
    const matchesSearch = searchTerm === "" || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrice = product.currentPrice >= priceRange[0] && 
      product.currentPrice <= priceRange[1];
    
    return matchesSearch && matchesPrice;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Browse Auctions</h1>
            <p className="mt-2 text-lg text-gray-600">Discover unique items from sellers around the world</p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="relative w-full sm:w-96">
              <Input
                type="text"
                placeholder="Search auctions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Auctions</SheetTitle>
                    <SheetDescription>
                      Narrow down results to find exactly what you're looking for
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={selectedCategory} 
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {!categoriesLoading && !categoriesError && categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Auction Status</Label>
                      <Select 
                        value={selectedStatus} 
                        onValueChange={setSelectedStatus}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="ended">Ended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Price Range</Label>
                        <div className="text-sm">
                          ${priceRange[0]} - ${priceRange[1]}
                        </div>
                      </div>
                      <Slider
                        defaultValue={[0, 5000]}
                        max={5000}
                        step={50}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                      />
                    </div>
                  </div>
                  
                  <SheetFooter className="sm:justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                    <Button 
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  const newParams = new URLSearchParams(search);
                  if (value && value !== "all") {
                    newParams.set("category", value);
                  } else {
                    newParams.delete("category");
                  }
                  setLocation(`/auctions?${newParams.toString()}`);
                  refetch();
                }}
              >
                <SelectTrigger id="category-quick" className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {!categoriesLoading && !categoriesError && categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  const newParams = new URLSearchParams(search);
                  if (value && value !== "all") {
                    newParams.set("status", value);
                  } else {
                    newParams.delete("status");
                  }
                  setLocation(`/auctions?${newParams.toString()}`);
                  refetch();
                }}
              >
                <SelectTrigger id="status-quick" className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Products Grid */}
          {productsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productsError ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Auctions</h3>
              <p className="text-gray-500 mb-4">We couldn't load the auction listings. Please try again later.</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Auctions Found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any auctions matching your criteria. Try broadening your filters.
              </p>
              <Button onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts?.map((product) => (
                <AuctionCard key={product.id} product={product} />
              ))}
            </div>
          )}
          
          {/* Pagination (simplified version) */}
          {filteredProducts && filteredProducts.length > 0 && (
            <div className="mt-12 flex justify-center">
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <a
                  href="#"
                  className="inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  1
                </a>
                <a
                  href="#"
                  className="inline-flex items-center border border-primary bg-primary px-4 py-2 text-sm font-medium text-white"
                >
                  2
                </a>
                <a
                  href="#"
                  className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  3
                </a>
                <span className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700">
                  ...
                </span>
                <a
                  href="#"
                  className="inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  8
                </a>
                <a
                  href="#"
                  className="inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </a>
              </nav>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
