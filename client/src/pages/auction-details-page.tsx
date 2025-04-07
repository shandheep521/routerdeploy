import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product, Bid, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, ArrowLeft, Eye, Share2, Heart, User as UserIcon, 
  ShieldCheck, Loader2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AuctionTimer } from "@/components/auctions/timer";
import BidModal from "@/components/auctions/bid-modal";

export default function AuctionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [isWatching, setIsWatching] = useState(false);

  // Fetch auction details
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProduct
  } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });

  // Fetch bids for this auction
  const {
    data: bids,
    isLoading: bidsLoading,
    error: bidsError,
    refetch: refetchBids
  } = useQuery<Bid[]>({
    queryKey: [`/api/products/${id}/bids`],
  });

  // Fetch seller information
  const {
    data: seller,
    isLoading: sellerLoading,
  } = useQuery<User>({
    queryKey: [`/api/users/${product?.sellerId}`],
    enabled: !!product?.sellerId,
  });

  // Check if user is watching this auction
  useEffect(() => {
    if (user) {
      const checkWatchlist = async () => {
        try {
          const res = await fetch(`/api/users/${user.id}/watchlist`, {
            credentials: 'include'
          });
          if (res.ok) {
            const watchlist = await res.json();
            const isInWatchlist = watchlist.some((item: any) => item.productId === Number(id));
            setIsWatching(isInWatchlist);
          }
        } catch (error) {
          console.error("Error checking watchlist:", error);
        }
      };
      
      checkWatchlist();
    }
  }, [user, id]);

  // Handle watchlist toggle
  const handleWatchlist = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to add items to your watchlist",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!isWatching) {
        await apiRequest("POST", "/api/watchlist", { productId: Number(id) });
        setIsWatching(true);
        toast({
          title: "Added to watchlist",
          description: `${product?.title} has been added to your watchlist.`,
        });
      } else {
        await apiRequest("DELETE", `/api/watchlist/${id}`);
        setIsWatching(false);
        toast({
          title: "Removed from watchlist",
          description: `${product?.title} has been removed from your watchlist.`,
        });
      }
      
      // Invalidate watchlist cache
      if (user) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/watchlist`] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist.",
        variant: "destructive",
      });
    }
  };

  // Handle place bid button
  const handleBid = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to place a bid",
        variant: "destructive",
      });
      return;
    }
    
    if (product && product.sellerId === user.id) {
      toast({
        title: "Cannot bid on own auction",
        description: "You cannot place a bid on your own auction",
        variant: "destructive",
      });
      return;
    }

    if (product && product.status !== 'active' && product.status !== 'upcoming') {
      toast({
        title: "Auction not available",
        description: "This auction is not currently available for bidding",
        variant: "destructive",
      });
      return;
    }

    setBidModalOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get auction status
  const getAuctionStatus = () => {
    if (!product) return null;
    
    const now = new Date();
    const startDate = new Date(product.startDate);
    const endDate = new Date(product.endDate);
    
    if (now < startDate) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Upcoming
        </Badge>
      );
    } else if (now > endDate) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Ended
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          Active
        </Badge>
      );
    }
  };

  if (productLoading || sellerLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                Auction Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>We couldn't find the auction you're looking for. It may have been removed or expired.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setLocation("/auctions")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Auctions
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => setLocation("/auctions")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Auctions
          </Button>
          
          {/* Product details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image and description */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                <img 
                  src={product.imageUrl} 
                  alt={product.title} 
                  className="w-full h-[400px] object-cover"
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Tabs defaultValue="description">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Description</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="pt-4">
                    <div className="prose prose-blue max-w-none">
                      <p>{product.description}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Auction Type</h4>
                          <p className="mt-1">{product.auctionType.charAt(0).toUpperCase() + product.auctionType.slice(1)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Item Condition</h4>
                          <p className="mt-1">Excellent</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                          <p className="mt-1">{formatDate(product.startDate)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">End Date</h4>
                          <p className="mt-1">{formatDate(product.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="shipping" className="pt-4">
                    <div className="space-y-4">
                      <p>The seller is responsible for shipping this item. Please contact the seller directly after winning the auction to arrange shipping details.</p>
                      <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="font-medium">Buyer Protection Guarantee</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        BidVista's buyer protection ensures that your purchase is covered in case the item is not as described or fails to arrive.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Bid History */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Bid History</h3>
                
                {bidsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : bidsError || !bids ? (
                  <div className="text-center py-4 text-red-500">
                    Failed to load bid history
                  </div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No bids have been placed yet. Be the first to bid!
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bidder</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Auto Bid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.slice(0, 10).map((bid) => (
                        <TableRow key={bid.id}>
                          <TableCell className="font-medium">User {bid.userId}</TableCell>
                          <TableCell>${bid.amount.toFixed(2)}</TableCell>
                          <TableCell>{new Date(bid.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{bid.isAutoBid ? "Yes" : "No"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {bids && bids.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="link">View All Bids</Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Auction sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold">{product.title}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <UserIcon className="h-4 w-4 mr-1" />
                        Listed by {seller?.username || `Seller #${product.sellerId}`}
                      </CardDescription>
                    </div>
                    <div>
                      {getAuctionStatus()}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="text-3xl font-bold text-primary">${product.currentPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bids</p>
                      <p className="text-xl font-semibold">{product.bidCount}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">
                        <AuctionTimer startDate={product.startDate} endDate={product.endDate} />
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span>Starting Price:</span>
                      <span>${product.initialPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Minimum Bid Increment:</span>
                      <span>${product.increment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Minimum Bid:</span>
                      <span className="font-medium">${(product.currentPrice + product.increment).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleBid}
                    disabled={
                      (product.status !== 'active' && product.status !== 'upcoming') || 
                      (user && product.sellerId === user.id)
                    }
                  >
                    Place Bid
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-1"
                      onClick={handleWatchlist}
                    >
                      {isWatching ? (
                        <>
                          <Heart className="h-4 w-4 fill-current" />
                          Watching
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4" />
                          Watch
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-1"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({
                          title: "Link copied",
                          description: "Auction link copied to clipboard",
                        });
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Seller info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seller Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{seller?.fullName || seller?.username || `Seller #${product.sellerId}`}</p>
                      <p className="text-sm text-gray-500">Member since {seller?.createdAt ? 
                        new Date(seller.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long'
                        }) : 'N/A'
                      }</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Auctions</span>
                      <span>27</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Successful Sales</span>
                      <span>24</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Seller Rating</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Similar auctions preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Auctions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* This would normally be populated with real similar auctions */}
                  <div className="text-center py-4 text-gray-500">
                    <Eye className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    Similar auctions will appear here
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      {/* Bid Modal */}
      {product && (
        <BidModal 
          open={bidModalOpen}
          onOpenChange={setBidModalOpen}
          product={product}
        />
      )}
      
      <Footer />
    </div>
  );
}
