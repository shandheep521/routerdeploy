import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Package2, 
  Gavel, 
  ShoppingBag, 
  Users, 
  BarChart, 
  Plus, 
  Clock,
  ChevronRight, 
  Edit,
  AlertTriangle,
  Trash2,
  ArrowRight,
  ListChecks,
  Eye,
  Calendar
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, insertAuctionSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Extended schema for product form
const productFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.coerce.number(),
  condition: z.string().min(1, "Please select a condition"),
  images: z.array(z.string()).min(1, "Please add at least one image URL"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Extended schema for auction form
const auctionFormSchema = z.object({
  productId: z.coerce.number(),
  startPrice: z.coerce.number().positive("Start price must be positive"),
  auctionType: z.string().min(1, "Please select an auction type"),
  startDate: z.string().min(1, "Please select a start date"),
  endDate: z.string().min(1, "Please select an end date"),
});

type AuctionFormValues = z.infer<typeof auctionFormSchema>;

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  // Fetch seller dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/seller/dashboard"],
  });
  
  // Fetch categories for product form
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Product form
  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
      condition: "",
      images: [],
    },
  });
  
  // Auction form
  const auctionForm = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionFormSchema),
    defaultValues: {
      productId: 0,
      startPrice: 0,
      auctionType: "traditional",
      startDate: "",
      endDate: "",
    },
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const res = await apiRequest("POST", "/api/products", {
        ...data,
        sellerId: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product created successfully",
        description: "Your product has been created and is ready for auction",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/dashboard"] });
      productForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create auction mutation
  const createAuctionMutation = useMutation({
    mutationFn: async (data: AuctionFormValues) => {
      // For the API, we need to set currentPrice equal to startPrice initially
      const res = await apiRequest("POST", "/api/auctions", {
        ...data,
        currentPrice: data.startPrice,
        status: new Date(data.startDate) <= new Date() ? "active" : "upcoming",
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Auction created successfully",
        description: "Your auction has been created and is now visible to buyers",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seller/dashboard"] });
      auctionForm.reset();
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create auction",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle add image to product form
  const handleAddImage = () => {
    if (!imageUrl) return;
    
    // Simple validation to check if it looks like a URL
    if (!imageUrl.startsWith('http')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
      return;
    }
    
    const currentImages = productForm.getValues().images;
    productForm.setValue("images", [...currentImages, imageUrl]);
    setImageUrl("");
  };
  
  // Handle remove image from product form
  const handleRemoveImage = (index: number) => {
    const currentImages = productForm.getValues().images;
    const newImages = currentImages.filter((_, i) => i !== index);
    productForm.setValue("images", newImages);
  };
  
  // Handle product form submission
  const onSubmitProduct = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };
  
  // Handle auction form submission
  const onSubmitAuction = (data: AuctionFormValues) => {
    createAuctionMutation.mutate(data);
  };
  
  // Set productId when selected for auction
  const handleSelectProduct = (productId: number) => {
    setSelectedProduct(productId);
    auctionForm.setValue("productId", productId);
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Get products without auctions for creating new auctions
  const productsWithoutAuctions = dashboardData?.products.filter(product => 
    !dashboardData.auctions.some(auction => auction.productId === product.id)
  ) || [];
  
  // Group auctions by status
  const activeAuctions = dashboardData?.auctions.filter(a => a.status === "active") || [];
  const upcomingAuctions = dashboardData?.auctions.filter(a => a.status === "upcoming") || [];
  const endedAuctions = dashboardData?.auctions.filter(a => a.status === "ended") || [];
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Seller Dashboard</h1>
              <p className="text-gray-600">
                Manage your products, auctions, and track your sales.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                      Create a new product to sell in an auction. You can add details and images here.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...productForm}>
                    <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-6">
                      <FormField
                        control={productForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Vintage Watch" {...field} />
                            </FormControl>
                            <FormDescription>
                              A clear, descriptive title will attract more bidders.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed description of your product..." 
                                className="min-h-32" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include condition, history, dimensions, and any other relevant details.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={productForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={productForm.control}
                          name="condition"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Condition</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="New">New</SelectItem>
                                  <SelectItem value="Like New">Like New</SelectItem>
                                  <SelectItem value="Excellent">Excellent</SelectItem>
                                  <SelectItem value="Good">Good</SelectItem>
                                  <SelectItem value="Fair">Fair</SelectItem>
                                  <SelectItem value="For Parts">For Parts</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={productForm.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Images</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <Input 
                                    placeholder="Image URL" 
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                  />
                                  <Button type="button" onClick={handleAddImage}>
                                    Add
                                  </Button>
                                </div>
                                
                                {field.value.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {field.value.map((url, index) => (
                                      <div key={index} className="relative group">
                                        <img 
                                          src={url}
                                          alt={`Product ${index + 1}`}
                                          className="h-24 w-full object-cover rounded-md border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveImage(index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-sm italic">
                                    No images added yet. Add at least one image URL.
                                  </p>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Add links to your product images. High-quality images increase your chances of selling.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          type="submit" 
                          disabled={createProductMutation.isPending}
                        >
                          {createProductMutation.isPending ? "Creating..." : "Create Product"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Gavel className="h-4 w-4 mr-2" />
                    Create Auction
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Auction</DialogTitle>
                    <DialogDescription>
                      Create an auction for one of your products. Set the starting price, auction type, and duration.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {productsWithoutAuctions.length === 0 ? (
                    <div className="text-center py-6">
                      <Package2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Products Available</h3>
                      <p className="text-gray-600 mb-6">
                        You need to add products before you can create auctions.
                      </p>
                      <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                      </DialogClose>
                    </div>
                  ) : selectedProduct ? (
                    <Form {...auctionForm}>
                      <form onSubmit={auctionForm.handleSubmit(onSubmitAuction)} className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Selected Product</h3>
                          <div className="flex items-center p-3 border rounded-md">
                            <img 
                              src={productsWithoutAuctions.find(p => p.id === selectedProduct)?.images[0] || ""}
                              alt="Product"
                              className="h-16 w-16 object-cover rounded mr-4"
                            />
                            <div>
                              <p className="font-medium">
                                {productsWithoutAuctions.find(p => p.id === selectedProduct)?.title}
                              </p>
                              <p className="text-sm text-gray-500">
                                {productsWithoutAuctions.find(p => p.id === selectedProduct)?.condition}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              className="ml-auto" 
                              onClick={() => setSelectedProduct(null)}
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={auctionForm.control}
                            name="startPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Starting Price ($)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="0.01" 
                                    step="0.01" 
                                    placeholder="100.00" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  The minimum bid for this auction.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={auctionForm.control}
                            name="auctionType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Auction Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="traditional">Traditional</SelectItem>
                                    <SelectItem value="reverse">Reverse</SelectItem>
                                    <SelectItem value="sealed">Sealed Bid</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Traditional: Highest bidder wins. Reverse: Lowest unique bid wins.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={auctionForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date & Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="datetime-local" 
                                    {...field} 
                                    min={new Date().toISOString().slice(0, 16)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={auctionForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date & Time</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="datetime-local" 
                                    {...field} 
                                    min={auctionForm.watch("startDate")}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button 
                            type="submit" 
                            disabled={createAuctionMutation.isPending}
                          >
                            {createAuctionMutation.isPending ? "Creating..." : "Create Auction"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  ) : (
                    <div>
                      <h3 className="font-medium mb-4">Select a Product for Auction</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                        {productsWithoutAuctions.map((product) => (
                          <div 
                            key={product.id} 
                            className="border rounded-md p-4 cursor-pointer hover:border-primary"
                            onClick={() => handleSelectProduct(product.id)}
                          >
                            <div className="flex items-center">
                              <img 
                                src={product.images[0] || ""}
                                alt={product.title}
                                className="h-16 w-16 object-cover rounded mr-4"
                              />
                              <div>
                                <p className="font-medium">{product.title}</p>
                                <p className="text-sm text-gray-500">
                                  Condition: {product.condition}
                                </p>
                                <Badge variant="outline" className="mt-1">
                                  {categories?.find(c => c.id === product.categoryId)?.name || "Category"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="text-3xl font-bold">{dashboardData?.productCount || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                    <Package2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Auctions</p>
                    <p className="text-3xl font-bold">{dashboardData?.activeAuctions || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center">
                    <Gavel className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bids</p>
                    <p className="text-3xl font-bold">{dashboardData?.totalBids || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-500 bg-opacity-10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ended Auctions</p>
                    <p className="text-3xl font-bold">{dashboardData?.endedAuctions || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-500 bg-opacity-10 rounded-full flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <Tabs defaultValue="auctions">
            <TabsList className="mb-6">
              <TabsTrigger value="auctions">Auctions</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>
            
            {/* Auctions Tab */}
            <TabsContent value="auctions">
              <div className="grid grid-cols-1 gap-6">
                {/* Active Auctions */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-green-500" />
                    Active Auctions
                  </h2>
                  
                  {activeAuctions.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {activeAuctions.map((auction) => {
                        const product = dashboardData?.products.find(p => p.id === auction.productId);
                        return (
                          <Card key={auction.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-bold mb-1">{product?.title}</CardTitle>
                                  <CardDescription>
                                    Current Bid: <span className="font-medium text-primary">${auction.currentPrice.toLocaleString()}</span>
                                  </CardDescription>
                                </div>
                                <Badge className="bg-green-500">Active</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <img 
                                  src={product?.images[0] || ""}
                                  alt={product?.title}
                                  className="h-32 w-full object-cover rounded-md"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between text-sm mb-4">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-500">
                                    Ends {new Date(auction.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-500">
                                    {auction.bidCount} bids
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Starting Price:</span>
                                  <span>${auction.startPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Current Price:</span>
                                  <span className="font-medium">${auction.currentPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Type:</span>
                                  <span>{auction.auctionType.charAt(0).toUpperCase() + auction.auctionType.slice(1)}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button asChild variant="outline" className="w-full">
                                <Link href={`/auctions/${auction.id}`}>
                                  View Auction
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="text-center py-8">
                      <CardContent>
                        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Active Auctions</h3>
                        <p className="text-gray-600 mb-6">
                          You don't have any active auctions at the moment.
                        </p>
                        <Button onClick={() => document.getElementById('create-auction-button')?.click()}>
                          Create Auction
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Upcoming Auctions */}
                {upcomingAuctions.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-amber-500" />
                      Upcoming Auctions
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {upcomingAuctions.map((auction) => {
                        const product = dashboardData?.products.find(p => p.id === auction.productId);
                        return (
                          <Card key={auction.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-bold mb-1">{product?.title}</CardTitle>
                                  <CardDescription>
                                    Start Price: <span className="font-medium text-primary">${auction.startPrice.toLocaleString()}</span>
                                  </CardDescription>
                                </div>
                                <Badge className="bg-amber-500">Upcoming</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <img 
                                  src={product?.images[0] || ""}
                                  alt={product?.title}
                                  className="h-32 w-full object-cover rounded-md"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between text-sm mb-4">
                                <div>
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                    <span className="text-gray-500">
                                      Starts {new Date(auction.startDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                    <span className="text-gray-500">
                                      Ends {new Date(auction.endDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Starting Price:</span>
                                  <span>${auction.startPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Type:</span>
                                  <span>{auction.auctionType.charAt(0).toUpperCase() + auction.auctionType.slice(1)}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between">
                              <Button variant="outline" className="w-1/2 mr-2" disabled>
                                Edit
                              </Button>
                              <Button variant="destructive" className="w-1/2 ml-2">
                                Cancel
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Ended Auctions */}
                {endedAuctions.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-2 text-gray-500" />
                      Ended Auctions
                    </h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {endedAuctions.slice(0, 3).map((auction) => {
                        const product = dashboardData?.products.find(p => p.id === auction.productId);
                        return (
                          <Card key={auction.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-bold mb-1">{product?.title}</CardTitle>
                                  <CardDescription>
                                    Final Price: <span className="font-medium text-primary">${auction.currentPrice.toLocaleString()}</span>
                                  </CardDescription>
                                </div>
                                <Badge variant="outline">Ended</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <img 
                                  src={product?.images[0] || ""}
                                  alt={product?.title}
                                  className="h-32 w-full object-cover rounded-md"
                                />
                              </div>
                              
                              <div className="flex items-center justify-between text-sm mb-4">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-500">
                                    Ended {new Date(auction.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-gray-500">
                                    {auction.bidCount} bids
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Starting Price:</span>
                                  <span>${auction.startPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-500">Final Price:</span>
                                  <span className="font-medium">${auction.currentPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Type:</span>
                                  <span>{auction.auctionType.charAt(0).toUpperCase() + auction.auctionType.slice(1)}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button asChild variant="outline" className="w-full">
                                <Link href={`/auctions/${auction.id}`}>
                                  View Details
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {endedAuctions.length > 3 && (
                      <div className="mt-4 text-center">
                        <Button variant="outline">
                          View All Ended Auctions
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Products Tab */}
            <TabsContent value="products">
              {dashboardData?.products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.products.map((product) => {
                    const hasAuction = dashboardData.auctions.some(auction => auction.productId === product.id);
                    const category = categories?.find(c => c.id === product.categoryId);
                    
                    return (
                      <Card key={product.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg font-bold mb-1">{product.title}</CardTitle>
                            {hasAuction ? (
                              <Badge variant="outline" className="border-green-500 text-green-600">
                                Listed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500 text-amber-600">
                                Not Listed
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            Category: {category?.name || "Uncategorized"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <img 
                              src={product.images[0] || ""}
                              alt={product.title}
                              className="h-32 w-full object-cover rounded-md"
                            />
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {product.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="outline">
                              Condition: {product.condition}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Added on {new Date(product.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between">
                          {!hasAuction ? (
                            <>
                              <Button 
                                variant="outline" 
                                className="w-1/2 mr-2"
                                onClick={() => handleSelectProduct(product.id)}
                              >
                                Create Auction
                              </Button>
                              <Button variant="outline" className="w-1/2 ml-2">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </>
                          ) : (
                            <Button asChild variant="outline" className="w-full">
                              <Link href={`/auctions/${dashboardData.auctions.find(a => a.productId === product.id)?.id}`}>
                                View Auction
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Link>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <Package2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Products</h3>
                    <p className="text-gray-600 mb-6">
                      You haven't added any products yet. Add products to create auctions.
                    </p>
                    <Button onClick={() => document.getElementById('create-product-button')?.click()}>
                      Add Product
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Management</CardTitle>
                  <CardDescription>
                    Manage your inventory and track products that are unsold or pending auction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b">
                    <div className="flex items-center">
                      <ListChecks className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-semibold">Product Inventory Status</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Listed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-sm">Not Listed</span>
                      </div>
                    </div>
                  </div>
                  
                  {dashboardData?.products.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Inventory</h3>
                      <p className="text-gray-500 mb-6">
                        You don't have any products in your inventory yet.
                      </p>
                      <Button onClick={() => document.getElementById('create-product-button')?.click()}>
                        Add Product
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="pb-3 font-medium">Product</th>
                            <th className="pb-3 font-medium">Category</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Date Added</th>
                            <th className="pb-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData?.products.map((product) => {
                            const hasAuction = dashboardData.auctions.some(auction => auction.productId === product.id);
                            const category = categories?.find(c => c.id === product.categoryId);
                            const auction = dashboardData.auctions.find(a => a.productId === product.id);
                            
                            return (
                              <tr key={product.id} className="border-b">
                                <td className="py-4">
                                  <div className="flex items-center">
                                    <img 
                                      src={product.images[0] || ""}
                                      alt={product.title}
                                      className="h-10 w-10 object-cover rounded-md mr-3"
                                    />
                                    <div>
                                      <p className="font-medium">{product.title}</p>
                                      <p className="text-xs text-gray-500">Condition: {product.condition}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">{category?.name || "Uncategorized"}</td>
                                <td className="py-4">
                                  {hasAuction ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      {auction?.status.charAt(0).toUpperCase() + auction?.status.slice(1)} Auction
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                      Not Listed
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-4 text-sm text-gray-500">
                                  {new Date(product.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-4">
                                  <div className="flex space-x-2">
                                    {!hasAuction ? (
                                      <>
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="h-8"
                                          onClick={() => handleSelectProduct(product.id)}
                                        >
                                          Create Auction
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 px-2">
                                          <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-8"
                                        asChild
                                      >
                                        <Link href={`/auctions/${auction?.id}`}>
                                          <Eye className="h-4 w-4 mr-1" />
                                          View
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
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
