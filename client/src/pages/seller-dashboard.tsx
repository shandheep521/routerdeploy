import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Loader2, Package, BarChart, History, Plus, 
  DollarSign, Users, ShoppingBag, AlertTriangle,
  Edit, Trash2
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { AuctionTimer } from "@/components/auctions/timer";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("listings");
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // Fetch seller's products
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery<Product[]>({
    queryKey: ["/api/products", { sellerId: user?.id }],
    enabled: !!user && user.isSeller,
  });

  // Get active auctions
  const activeAuctions = products?.filter(product => product.status === 'active');
  
  // Get ended auctions
  const endedAuctions = products?.filter(product => product.status === 'ended' || product.status === 'sold');
  
  // Get upcoming auctions
  const upcomingAuctions = products?.filter(product => product.status === 'upcoming');

  // Calculate total revenue
  const totalRevenue = endedAuctions?.reduce((sum, product) => {
    return product.isSold ? sum + product.currentPrice : sum;
  }, 0) || 0;

  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    
    try {
      await apiRequest("DELETE", `/api/products/${deleteProductId}`);
      
      toast({
        title: "Product deleted",
        description: "Your product has been successfully deleted",
      });
      
      // Refresh products list
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      setDeleteProductId(null);
      setShowDeleteAlert(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!user || !user.isSeller) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
              <CardDescription>
                You need to be registered as a seller to access this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Please update your profile to become a seller before accessing the seller dashboard.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard">Go to User Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (productsLoading) {
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="mt-2 text-lg text-gray-600">Manage your auctions and track your sales</p>
            </div>
            <Button asChild className="flex items-center gap-2">
              <Link href="/create-auction">
                <Plus className="h-4 w-4" />
                Create Auction
              </Link>
            </Button>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-primary" />
                  Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeAuctions?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2 text-primary" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{endedAuctions?.filter(p => p.isSold).length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Total Bidders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {products?.reduce((sum, product) => sum + product.bidCount, 0) || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Dashboard Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="listings" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                My Listings
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Sales History
              </TabsTrigger>
            </TabsList>
            
            {/* Listings Tab */}
            <TabsContent value="listings">
              <Card>
                <CardHeader>
                  <CardTitle>Your Auction Listings</CardTitle>
                  <CardDescription>
                    Manage your current and upcoming auctions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {productsError ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <AlertTriangle className="h-10 w-10 text-red-500 mb-2" />
                      <h3 className="text-lg font-medium">Failed to Load Listings</h3>
                      <p className="text-gray-500 mb-4">There was an error loading your auction listings</p>
                      <Button onClick={() => refetchProducts()}>Retry</Button>
                    </div>
                  ) : !products || products.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <Package className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">No Auctions Yet</h3>
                      <p className="text-gray-500 mb-4">You haven't created any auctions yet. Get started by creating your first auction!</p>
                      <Button asChild>
                        <Link href="/create-auction">Create Your First Auction</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Bids</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <Link href={`/auctions/${product.id}`} className="hover:text-primary hover:underline">
                                {product.title}
                              </Link>
                            </TableCell>
                            <TableCell>${product.currentPrice.toFixed(2)}</TableCell>
                            <TableCell>{product.bidCount}</TableCell>
                            <TableCell>
                              {product.status === 'active' && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Active
                                </Badge>
                              )}
                              {product.status === 'upcoming' && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Upcoming
                                </Badge>
                              )}
                              {product.status === 'ended' && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  Ended
                                </Badge>
                              )}
                              {product.status === 'sold' && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  Sold
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(product.endDate)}
                              <div className="text-xs text-gray-500">
                                <AuctionTimer startDate={product.startDate} endDate={product.endDate} />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Manage Auction</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/auctions/${product.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  {product.status === 'upcoming' && (
                                    <DropdownMenuItem asChild>
                                      <Link href={`/create-auction?edit=${product.id}`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setDeleteProductId(product.id);
                                      setShowDeleteAlert(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Auction Analytics</CardTitle>
                  <CardDescription>
                    Key metrics and insights for your auctions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">
                            Average Number of Bids
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {products && products.length > 0
                              ? (products.reduce((sum, product) => sum + product.bidCount, 0) / products.length).toFixed(1)
                              : 0}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">
                            Average Price Increase
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {products && products.length > 0
                              ? `${((products.reduce((sum, product) => sum + (product.currentPrice - product.initialPrice), 0) / products.length) * 100 / products.reduce((sum, product) => sum + product.initialPrice, 0) / products.length).toFixed(1)}%`
                              : '0%'}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-500">
                            Sales Conversion Rate
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {endedAuctions && endedAuctions.length > 0
                              ? `${((endedAuctions.filter(p => p.isSold).length / endedAuctions.length) * 100).toFixed(1)}%`
                              : '0%'}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Placeholder for charts */}
                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Auctions Performance</h3>
                        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Analytics charts will appear here</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium mb-4">Revenue Trends</h3>
                        <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
                          <div className="text-center">
                            <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Analytics charts will appear here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">Pro Tip</h3>
                      <p className="text-blue-700">
                        Items with high-quality images and detailed descriptions tend to receive more bids and sell at higher prices.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Sales History Tab */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History</CardTitle>
                  <CardDescription>
                    View your past auction results and completed sales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!endedAuctions || endedAuctions.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <History className="h-10 w-10 text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">No Sales History</h3>
                      <p className="text-gray-500 mb-4">You don't have any completed auctions or sales yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Final Price</TableHead>
                          <TableHead>Initial Price</TableHead>
                          <TableHead>Bids</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>End Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {endedAuctions.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <Link href={`/auctions/${product.id}`} className="hover:text-primary hover:underline">
                                {product.title}
                              </Link>
                            </TableCell>
                            <TableCell>${product.currentPrice.toFixed(2)}</TableCell>
                            <TableCell>${product.initialPrice.toFixed(2)}</TableCell>
                            <TableCell>{product.bidCount}</TableCell>
                            <TableCell>
                              {product.isSold ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                  Sold
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  Ended (Not Sold)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(product.endDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this auction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProductId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
}
