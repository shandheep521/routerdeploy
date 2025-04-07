import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Category, Product, insertProductSchema } from "@shared/schema";

// Extended product schema with validation
const auctionSchema = insertProductSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  initialPrice: z.number().min(1, "Initial price must be at least $1"),
  increment: z.number().min(0.01, "Bid increment must be at least $0.01"),
  auctionType: z.enum(["traditional", "reverse", "sealed"], {
    errorMap: () => ({ message: "Please select an auction type" }),
  }),
  startDate: z.date({
    required_error: "A start date is required",
  }),
  endDate: z.date({
    required_error: "An end date is required",
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type AuctionForm = z.infer<typeof auctionSchema>;

export default function CreateAuctionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const queryParams = new URLSearchParams(search);
  const editId = queryParams.get("edit");
  const [isEditMode, setIsEditMode] = useState(!!editId);
  
  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch product if in edit mode
  const {
    data: product,
    isLoading: productLoading,
    error: productError,
  } = useQuery<Product>({
    queryKey: [`/api/products/${editId}`],
    enabled: !!editId,
  });

  // Form setup
  const form = useForm<AuctionForm>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      initialPrice: 10,
      currentPrice: 10, // This will be the same as initialPrice for new products
      increment: 1,
      auctionType: "traditional",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
      sellerId: user?.id || 0,
      categoryId: 1,
    },
  });

  // Set form values when product is loaded in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      form.reset({
        ...product,
        startDate: new Date(product.startDate),
        endDate: new Date(product.endDate),
      });
    }
  }, [isEditMode, product, form]);

  // Create auction mutation
  const createAuctionMutation = useMutation({
    mutationFn: async (data: AuctionForm) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Auction created",
        description: "Your auction has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setLocation("/seller");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create auction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update auction mutation
  const updateAuctionMutation = useMutation({
    mutationFn: async (data: AuctionForm) => {
      const res = await apiRequest("PUT", `/api/products/${editId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Auction updated",
        description: "Your auction has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${editId}`] });
      setLocation("/seller");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update auction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AuctionForm) => {
    // Ensure the current price is the same as initial price for new auctions
    if (!isEditMode) {
      data.currentPrice = data.initialPrice;
    }
    
    // Set seller ID
    if (user) {
      data.sellerId = user.id;
    }
    
    if (isEditMode) {
      updateAuctionMutation.mutate(data);
    } else {
      createAuctionMutation.mutate(data);
    }
  };

  // Check if user is logged in and is a seller
  if (!user || !user.isSeller) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Seller Access Required</CardTitle>
              <CardDescription>
                You need to be registered as a seller to create auctions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Please update your profile to become a seller before creating auctions.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <a href="/auth?register=true">Register as a Seller</a>
              </Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show loading state when fetching data in edit mode
  if (isEditMode && (productLoading || categoriesLoading)) {
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

  // Show error state if product not found in edit mode
  if (isEditMode && (productError || !product)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Product Not Found</CardTitle>
              <CardDescription>
                The auction you're trying to edit doesn't exist or has been removed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Please return to the seller dashboard and try again.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <a href="/seller">Back to Seller Dashboard</a>
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => setLocation("/seller")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seller Dashboard
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>{isEditMode ? "Edit Auction" : "Create New Auction"}</CardTitle>
              <CardDescription>
                {isEditMode 
                  ? "Update your auction details below" 
                  : "Fill out the form below to list a new item for auction"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auction Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Vintage Camera in Excellent Condition" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, concise title that describes your item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a detailed description of your item including condition, history, and any unique features..." 
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed descriptions tend to attract more bidders
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Image URL */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Provide a direct link to your item image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          disabled={categoriesLoading} 
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
                              <SelectItem 
                                key={category.id} 
                                value={category.id.toString()}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the category that best fits your item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="initialPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="increment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bid Increment ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              value={field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum amount a new bid must exceed the current bid by
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Auction Type */}
                  <FormField
                    control={form.control}
                    name="auctionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auction Type</FormLabel>
                        <Select
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select auction type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="traditional">Traditional</SelectItem>
                            <SelectItem value="reverse">Reverse</SelectItem>
                            <SelectItem value="sealed">Sealed Bid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          <span>
                            Traditional: Highest bid wins. Reverse: Lowest unique bid wins. Sealed: Bids are hidden until end.
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When should the auction begin?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date < form.getValues().startDate}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When should the auction end?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/seller")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createAuctionMutation.isPending || updateAuctionMutation.isPending}
                    >
                      {(createAuctionMutation.isPending || updateAuctionMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        isEditMode ? "Update Auction" : "Create Auction"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
