import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { addDays, addHours, format } from "date-fns";

// Auction form schema
const auctionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  startingPrice: z.string().refine(value => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  }, "Starting price must be greater than 0"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  auctionType: z.string().min(1, "Auction type is required"),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

interface AuctionFormProps {
  productId: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AuctionForm({ productId, onSuccess, onCancel }: AuctionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Format date to YYYY-MM-DDThh:mm
  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  // Default start date (now) and end date (3 days from now)
  const now = new Date();
  const defaultStartDate = formatDateForInput(addHours(now, 1));
  const defaultEndDate = formatDateForInput(addDays(now, 3));

  // Fetch user's products
  const { data: products = [] } = useQuery({
    queryKey: [user ? `/api/users/${user.id}/products` : null],
    enabled: !!user && !productId, // Only fetch if we don't have a specific productId
  });

  // Get the selected product or the first product as default
  const selectedProduct = productId 
    ? products.find((p: any) => p.id === productId) 
    : products[0];

  // Define form
  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      productId: productId ? String(productId) : "",
      startingPrice: "0.00",
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      auctionType: "traditional",
    },
  });

  // Create auction mutation
  const createAuctionMutation = useMutation({
    mutationFn: async (data: AuctionFormValues) => {
      const formattedData = {
        productId: parseInt(data.productId),
        startingPrice: parseFloat(data.startingPrice),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        auctionType: data.auctionType,
        sellerId: user?.id,
      };
      const res = await apiRequest("POST", "/api/auctions", formattedData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Auction created",
        description: "Your auction has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/auctions`] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating auction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AuctionFormValues) => {
    createAuctionMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Auction</CardTitle>
        <CardDescription>
          Set up an auction for your product
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!productId} // Disable if productId is provided
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={formatDateForInput(new Date())}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={form.getValues().startDate}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="auctionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select auction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="traditional">Traditional Auction</SelectItem>
                      <SelectItem value="reverse">Reverse Auction</SelectItem>
                      <SelectItem value="sealed">Sealed Bid Auction</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAuctionMutation.isPending}
            >
              {createAuctionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Auction"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
