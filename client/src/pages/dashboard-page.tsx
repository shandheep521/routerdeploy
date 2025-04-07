import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowUpRight, 
  Gavel, 
  MoreHorizontal, 
  Bell,
  Eye,
  Clock,
  CheckCircle2,
  BadgeCheck,
  DollarSign,
  Package,
  History,
  ChevronRight
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });
  
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
  });
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
  
  // Handle mark notification as read
  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  const activeAuctions = dashboardData?.auctions?.filter(a => a.auction.status === "active") || [];
  const wonAuctions = dashboardData?.auctions?.filter(a => 
    a.auction.status === "ended" && a.isHighestBidder
  ) || [];
  const lostAuctions = dashboardData?.auctions?.filter(a => 
    a.auction.status === "ended" && !a.isHighestBidder
  ) || [];
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">My Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.firstName}! Manage your bids and auctions.
            </p>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bids Placed</p>
                    <p className="text-3xl font-bold">{dashboardData?.bidCount || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <Gavel className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Auctions</p>
                    <p className="text-3xl font-bold">{activeAuctions.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Won Auctions</p>
                    <p className="text-3xl font-bold">{wonAuctions.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-500 bg-opacity-10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">Active Bids</TabsTrigger>
              <TabsTrigger value="won">Won Auctions</TabsTrigger>
              <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            {/* Active Bids Tab */}
            <TabsContent value="active">
              {activeAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeAuctions.map(({ auction, product, isHighestBidder, userHighestBid }) => (
                    <Card key={auction.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-bold mb-1">{product.title}</CardTitle>
                            <CardDescription>
                              Current Bid: <span className="font-medium text-primary">${auction.currentPrice.toLocaleString()}</span>
                            </CardDescription>
                          </div>
                          <Badge className={isHighestBidder ? "bg-green-500" : "bg-amber-500"}>
                            {isHighestBidder ? "Highest Bidder" : "Outbid"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            Ends {new Date(auction.endDate).toLocaleDateString()} at {" "}
                            {new Date(auction.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-md mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Your highest bid:</span>
                            <span className="font-semibold">${userHighestBid?.amount.toLocaleString() || "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-600 text-sm">Current highest bid:</span>
                            <span className="font-semibold">${auction.currentPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center">
                            <Gavel className="h-4 w-4 mr-1" />
                            <span>{auction.bidCount} bids</span>
                          </div>
                          <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            <span>{Math.floor(Math.random() * 300) + 50} views</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/auctions/${auction.id}`}>
                            {isHighestBidder ? "View Auction" : "Place Higher Bid"}
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Gavel className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Bids</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't placed any bids on active auctions yet.
                    </p>
                    <Button asChild>
                      <Link href="/auctions">Browse Auctions</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Won Auctions Tab */}
            <TabsContent value="won">
              {wonAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {wonAuctions.map(({ auction, product, userHighestBid }) => (
                    <Card key={auction.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-bold mb-1">{product.title}</CardTitle>
                            <CardDescription>
                              Final Price: <span className="font-medium text-primary">${auction.currentPrice.toLocaleString()}</span>
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-500">Won</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <span>
                            Ended {new Date(auction.endDate).toLocaleDateString()} at {" "}
                            {new Date(auction.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded-md mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Your winning bid:</span>
                            <span className="font-semibold">${userHighestBid?.amount.toLocaleString() || auction.currentPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-600 text-sm">Total bids:</span>
                            <span className="font-semibold">{auction.bidCount}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/auctions/${auction.id}`}>
                            View Auction Details
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <BadgeCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Won Auctions</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't won any auctions yet. Keep bidding!
                    </p>
                    <Button asChild>
                      <Link href="/auctions">Browse Auctions</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Lost Auctions Tab */}
            <TabsContent value="lost">
              {lostAuctions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lostAuctions.map(({ auction, product, userHighestBid }) => (
                    <Card key={auction.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-bold mb-1">{product.title}</CardTitle>
                            <CardDescription>
                              Final Price: <span className="font-medium text-primary">${auction.currentPrice.toLocaleString()}</span>
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Lost</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            Ended {new Date(auction.endDate).toLocaleDateString()} at {" "}
                            {new Date(auction.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="p-3 bg-gray-50 rounded-md mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Your highest bid:</span>
                            <span className="font-semibold">${userHighestBid?.amount.toLocaleString() || "N/A"}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-600 text-sm">Winning bid:</span>
                            <span className="font-semibold">${auction.currentPrice.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-600 text-sm">Difference:</span>
                            <span className="font-semibold text-red-500">
                              ${(auction.currentPrice - (userHighestBid?.amount || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button asChild variant="outline" className="w-full">
                          <Link href={`/auctions/${auction.id}`}>
                            View Auction Details
                            <ArrowUpRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Lost Auctions</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't lost any auctions yet. Keep it up!
                    </p>
                    <Button asChild>
                      <Link href="/auctions">Browse Auctions</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications">
              {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card key={notification.id} className={notification.isRead ? "opacity-70" : ""}>
                      <CardHeader className="py-4 px-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${notification.type.includes('outbid') ? 'bg-red-100' : notification.type.includes('bid_placed') ? 'bg-green-100' : 'bg-blue-100'}`}>
                              {notification.type.includes('outbid') ? (
                                <Bell className="h-5 w-5 text-red-500" />
                              ) : notification.type.includes('bid_placed') ? (
                                <DollarSign className="h-5 w-5 text-green-500" />
                              ) : (
                                <Package className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-base font-medium">
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1).replace('_', ' ')}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {notification.message}
                              </CardDescription>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()} at {" "}
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                disabled={notification.isRead}
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                Mark as read
                              </DropdownMenuItem>
                              {notification.metadata?.auctionId && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/auctions/${notification.metadata.auctionId}`}>
                                    View auction
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                    <p className="text-gray-600 mb-6">
                      You don't have any notifications yet.
                    </p>
                    <Button asChild>
                      <Link href="/auctions">Browse Auctions</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          
          {user?.isSeller && (
            <div className="mt-8">
              <Card className="bg-gradient-to-r from-primary to-indigo-600 text-white">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">You're a seller!</h3>
                      <p className="text-blue-100 mb-4">
                        Visit your seller dashboard to manage products and auctions.
                      </p>
                    </div>
                    <Button 
                      asChild 
                      variant="secondary" 
                      className="mt-4 md:mt-0 bg-white text-primary hover:bg-blue-50"
                    >
                      <Link href="/seller-dashboard">
                        Seller Dashboard
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
