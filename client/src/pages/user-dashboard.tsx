import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Package, Heart, Clock, Gavel, AlertTriangle } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AuctionTimer } from "@/components/auctions/timer";

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bids");
  
  // Fetch user's bids
  const {
    data: bids,
    isLoading: bidsLoading,
    error: bidsError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/bids`],
    enabled: !!user,
  });
  
  // Fetch user's watchlist
  const {
    data: watchlist,
    isLoading: watchlistLoading,
    error: watchlistError,
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/watchlist`],
    enabled: !!user,
  });

  if (!user) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-lg text-gray-600">
              Welcome back, {user.fullName || user.username}
            </p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {bidsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : bidsError ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    bids?.length || 0
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Watchlist Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {watchlistLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : watchlistError ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    watchlist?.length || 0
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Won Auctions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$0.00</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Dashboard Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bids" className="flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                My Bids
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="purchases" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Purchases
              </TabsTrigger>
            </TabsList>
            
            {/* Bids Tab */}
            <TabsContent value="bids">
              <Card>
                <CardHeader>
                  <CardTitle>Your Bids</CardTitle>
                  <CardDescription>
                    Track all your active and past bids
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bidsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : bidsError ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                      <h3 className="text-lg font-medium">Failed to Load Bids</h3>
                      <p className="text-gray-500 mb-4">There was an error loading your bid history</p>
                      <Button>Retry</Button>
                    </div>
                  ) : !bids || bids.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Gavel className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">No Bids Yet</h3>
                      <p className="text-gray-500 mb-4">You haven't placed any bids yet. Start bidding on items you like!</p>
                      <Button asChild>
                        <Link href="/auctions">Browse Auctions</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Bid Amount</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bids.map((bid) => (
                          <TableRow key={bid.id}>
                            <TableCell className="font-medium">
                              <Link href={`/auctions/${bid.productId}`} className="hover:text-primary hover:underline">
                                Item #{bid.productId}
                              </Link>
                            </TableCell>
                            <TableCell>${bid.amount.toFixed(2)}</TableCell>
                            <TableCell>$--</TableCell>
                            <TableCell>
                              {bid.amount === bid.productId + 100 ? (
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                  Highest
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Outbid
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(bid.createdAt).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/auctions/${bid.productId}`}>View</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Watchlist Tab */}
            <TabsContent value="watchlist">
              <Card>
                <CardHeader>
                  <CardTitle>Your Watchlist</CardTitle>
                  <CardDescription>
                    Items you're keeping an eye on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {watchlistLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : watchlistError ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                      <h3 className="text-lg font-medium">Failed to Load Watchlist</h3>
                      <p className="text-gray-500 mb-4">There was an error loading your watchlist</p>
                      <Button>Retry</Button>
                    </div>
                  ) : !watchlist || watchlist.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Heart className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">Your Watchlist is Empty</h3>
                      <p className="text-gray-500 mb-4">Add items to your watchlist to keep track of auctions you're interested in</p>
                      <Button asChild>
                        <Link href="/auctions">Browse Auctions</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {watchlist.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <img 
                              src={item.product?.imageUrl || 'https://placehold.co/400x300?text=No+Image'} 
                              alt={item.product?.title || 'Watched item'} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2">
                              <div className="bg-black/75 text-white px-2 py-1 rounded text-xs flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {item.product ? (
                                  <AuctionTimer startDate={item.product.startDate} endDate={item.product.endDate} />
                                ) : (
                                  "Unknown"
                                )}
                              </div>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold truncate">
                              {item.product?.title || `Product #${item.productId}`}
                            </h3>
                            <div className="flex justify-between mt-2 text-sm">
                              <span className="text-gray-500">Current Bid</span>
                              <span className="font-medium">${item.product?.currentPrice.toFixed(2) || '0.00'}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="p-4 pt-0 flex justify-between">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/auctions/${item.productId}`}>View Details</Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-500">
                              <Heart className="h-4 w-4 fill-current" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Purchases Tab */}
            <TabsContent value="purchases">
              <Card>
                <CardHeader>
                  <CardTitle>Your Purchases</CardTitle>
                  <CardDescription>
                    Auctions you've won and items you've purchased
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center py-12 text-center">
                    <Package className="h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">No Purchases Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      You haven't won any auctions or made any purchases yet. Keep bidding to win items!
                    </p>
                    <Button asChild>
                      <Link href="/auctions">Browse Auctions</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
