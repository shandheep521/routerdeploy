import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuctionCard } from "@/components/auctions/auction-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryIcon } from "@/components/ui/category-icon";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default function CategoryPage() {
  const [match, params] = useRoute("/categories/:id");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  const categoryId = match ? parseInt(params.id) : null;
  
  // Fetch category details
  const { 
    data: category, 
    isLoading: isLoadingCategory,
    error: categoryError
  } = useQuery({
    queryKey: [`/api/categories/${categoryId}`],
    enabled: !!categoryId,
  });
  
  // Fetch auctions in this category
  const { 
    data: auctions = [], 
    isLoading: isLoadingAuctions
  } = useQuery({
    queryKey: [`/api/categories/${categoryId}/auctions`],
    enabled: !!categoryId,
  });
  
  const isLoading = isLoadingCategory || isLoadingAuctions;
  
  // Redirect if category not found
  useEffect(() => {
    if (categoryError) {
      toast({
        title: "Error",
        description: "Category not found",
        variant: "destructive",
      });
      navigate("/auctions");
    }
  }, [categoryError, navigate, toast]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-20 w-1/3 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center flex-col text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
                <p className="text-gray-600 mb-4">This category may have been removed or doesn't exist.</p>
                <Button onClick={() => navigate("/auctions")}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Auctions
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/auctions")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Auctions
          </Button>
        </div>
        
        <div className="mb-8 flex items-center">
          <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mr-4">
            <CategoryIcon name={category.icon} className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <p className="text-gray-600">
              {auctions.length} item{auctions.length !== 1 ? 's' : ''} available for auction
            </p>
          </div>
        </div>
        
        {auctions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <CategoryIcon name={category.icon} className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No auctions available</h2>
              <p className="text-gray-600 mb-4">There are currently no active auctions in this category.</p>
              <Button onClick={() => navigate("/auctions")}>
                Browse Other Categories
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((auction: any) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
