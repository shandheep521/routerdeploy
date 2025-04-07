import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { BidForm } from "@/components/auctions/bid-form";
import { BidHistory } from "@/components/auctions/bid-history";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Clock, 
  Tag, 
  User, 
  ChevronLeft, 
  ImageIcon, 
  AlertCircle,
  Loader2 
} from "lucide-react";

export default function AuctionPage() {
  const [match, params] = useRoute("/auctions/:id");
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const auctionId = match ? parseInt(params.id) : null;
  
  // Fetch auction details
  const { 
    data: auction, 
    isLoading: isLoadingAuction,
    error: auctionError
  } = useQuery({
    queryKey: [`/api/auctions/${auctionId}`],
    enabled: !!auctionId,
  });
  
  // Fetch product details once auction is loaded
  const { 
    data: product, 
    isLoading: isLoadingProduct
  } = useQuery({
    queryKey: [`/api/products/${auction?.productId}`],
    enabled: !!auction?.productId,
  });
  
  // Fetch seller details once product is loaded
  const { 
    data: seller, 
    isLoading: isLoadingSeller 
  } = useQuery({
    queryKey: [`/api/users/${product?.sellerId}`],
    enabled: !!product?.sellerId,
  });
  
  // Fetch bid history
  const { 
    data: bids, 
    isLoading: isLoadingBids,
    refetch: refetchBids
  } = useQuery({
    queryKey: [`/api/auctions/${auctionId}/bids`],
    enabled: !!auctionId,
  });
  
  const isLoading = isLoadingAuction || isLoadingProduct || isLoadingSeller || isLoadingBids;
  
  // Redirect if auction not found
  useEffect(() => {
    if (auctionError) {
      toast({
        title: "Error",
        description: "Auction not found",
        variant: "destructive",
      });
      navigate("/auctions");
    }
  }, [auctionError, navigate, toast]);
  
  // Calculate time left
  const getTimeLeft = () => {
    if (!auction) return null;
    
    const endDate = new Date(auction.endDate);
    const now = new Date();
    
    if (now > endDate) {
      return "Auction ended";
    }
    
    return formatDistanceToNow(endDate, { addSuffix: true });
  };
  
  // Check if current user is the seller
  const isUserSeller = user && product && user.id === product.sellerId;
  
  // Check if auction is active
  const isAuctionActive = auction && auction.isActive && new Date() < new Date(auction.endDate);
  
  // Handle bid submission
  const placeBidMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      return apiRequest("POST", "/api/bids", {
        auctionId,
        amount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Bid placed successfully",
        description: "You are now the highest bidder!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auctionId}/bids`] });
      refetchBids();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
              <Skeleton className="h-96 w-full rounded-lg" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="w-full md:w-1/3">
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!auction || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center flex-col text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
                <p className="text-gray-600 mb-4">This auction may have been removed or doesn't exist.</p>
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
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product Information */}
          <div className="w-full lg:w-2/3">
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="bg-gray-200 h-64 md:h-96 flex items-center justify-center rounded-t-lg">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.title} 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ImageIcon className="h-16 w-16 mb-2" />
                      <span>No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
                    <Badge>{product.condition}</Badge>
                  </div>
                  <div className="flex items-center text-gray-600 text-sm mb-4">
                    <User className="h-4 w-4 mr-1" />
                    <span>Listed by {seller?.username || "Unknown Seller"}</span>
                  </div>
                  <Separator className="my-4" />
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line mb-4">{product.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="text-sm text-gray-500">Starting Price</p>
                        <p className="font-semibold">${auction.startingPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <p className="text-sm text-gray-500">Time Left</p>
                        <p className="font-semibold">{getTimeLeft()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{format(new Date(auction.startDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{format(new Date(auction.endDate), 'PPP')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle>Bid History</CardTitle>
                <CardDescription>
                  {bids && bids.length > 0 
                    ? `${bids.length} bid${bids.length === 1 ? '' : 's'} placed on this auction`
                    : "No bids placed yet. Be the first to bid!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BidHistory bids={bids || []} />
              </CardContent>
            </Card>
          </div>
          
          {/* Auction Information and Bid Form */}
          <div className="w-full lg:w-1/3">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Auction Information</CardTitle>
                <CardDescription>
                  {isAuctionActive 
                    ? "This auction is currently active" 
                    : "This auction has ended"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-md">
                  <div className="text-sm text-gray-500 mb-1">Current Bid</div>
                  <div className="text-3xl font-bold text-primary">
                    ${auction.currentPrice.toFixed(2)}
                  </div>
                  {bids && bids[0] && (
                    <div className="text-xs text-gray-500 mt-1">
                      by {bids[0].username || `User #${bids[0].userId}`}
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Auction Type</span>
                    <Badge variant="outline">{auction.auctionType}</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Status</span>
                    <Badge 
                      variant={isAuctionActive ? "default" : "secondary"}
                    >
                      {isAuctionActive ? "Active" : "Ended"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time Left</span>
                    <span className="text-sm font-semibold">{getTimeLeft()}</span>
                  </div>
                </div>
                
                <Separator />
                
                {!user && (
                  <div className="p-4 bg-gray-100 rounded-md text-center">
                    <p className="mb-3 text-gray-700">
                      Sign in to place a bid on this auction
                    </p>
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="w-full"
                    >
                      Sign In to Bid
                    </Button>
                  </div>
                )}
                
                {user && isUserSeller && (
                  <div className="p-4 bg-gray-100 rounded-md text-center">
                    <p className="text-gray-700">
                      You can't bid on your own auction
                    </p>
                  </div>
                )}
                
                {user && !isUserSeller && !isAuctionActive && (
                  <div className="p-4 bg-gray-100 rounded-md text-center">
                    <p className="text-gray-700">
                      This auction has ended and is no longer accepting bids
                    </p>
                  </div>
                )}
                
                {user && !isUserSeller && isAuctionActive && (
                  <BidForm 
                    currentPrice={auction.currentPrice}
                    onSubmit={(amount) => placeBidMutation.mutate({ amount })}
                    isSubmitting={placeBidMutation.isPending}
                  />
                )}
              </CardContent>
              
              {user && !isUserSeller && isAuctionActive && (
                <CardFooter className="bg-gray-50 border-t p-4">
                  <p className="text-xs text-gray-500 w-full text-center">
                    By placing a bid, you agree to the BidWise Terms of Service and 
                    commit to purchase the item if you are the winning bidder.
                  </p>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
