import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Product, Bid } from "@shared/schema";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BidHistory } from "./bid-history";

interface BidFormProps {
  auction: { 
    currentPrice: number;
    product: Product;
    status?: string;
  };
}

export default function BidForm({ auction }: BidFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Fetch bids for this product
  const { data: bids = [], isLoading: isLoadingBids } = useQuery<Bid[]>({
    queryKey: [`/api/products/${auction.product.id}/bids`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${auction.product.id}/bids`);
      if (!res.ok) throw new Error('Failed to fetch bids');
      return res.json();
    }
  });
  
  // Calculate minimum bid (current price + minimum increment)
  const minBidIncrement = Math.max(1, auction.currentPrice * 0.05); // 5% or at least $1
  const minimumBid = auction.currentPrice + minBidIncrement;
  
  // Create zod schema for bid form
  const bidSchema = z.object({
    amount: z.coerce
      .number()
      .min(minimumBid, `Bid must be at least $${minimumBid.toFixed(2)}`)
  });
  
  type BidFormValues = z.infer<typeof bidSchema>;
  
  // Create form
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: minimumBid,
    },
  });
  
  // Bid mutation
  const bidMutation = useMutation({
    mutationFn: async (data: BidFormValues) => {
      const res = await apiRequest("POST", "/api/bids", {
        productId: auction.product.id,
        amount: data.amount,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid placed successfully!",
        description: `You have placed a bid of $${form.getValues().amount} on ${auction.product.title}`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/products/${auction.product.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${auction.product.id}/bids`] });
      
      // Reset form
      form.reset({ amount: minimumBid + minBidIncrement });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place bid",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: BidFormValues) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to place a bid",
        variant: "destructive",
      });
      navigate("/auth?mode=login");
      return;
    }
    
    bidMutation.mutate(data);
  };
  
  return (
    <Card className="w-full">
      <Tabs defaultValue="bidform" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="bidform">Place Bid</TabsTrigger>
          <TabsTrigger value="bidhistory">Bid History {bids.length > 0 && `(${bids.length})`}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bidform">
          <CardHeader>
            <CardTitle>Place Your Bid</CardTitle>
            <CardDescription>
              Current bid: <span className="font-bold text-primary">${auction.currentPrice.toLocaleString()}</span>
              {auction.status === 'upcoming' && (
                <div className="text-amber-600 mt-1">
                  This auction is upcoming but accepts early bids!
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bid Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min={minimumBid} 
                            className="pl-7" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Minimum bid is ${minimumBid.toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={bidMutation.isPending || !user}
                >
                  {bidMutation.isPending ? "Placing Bid..." : "Place Bid"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="text-xs text-gray-500">
              By placing a bid, you agree to our Terms of Service and Auction Rules.
            </p>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="bidhistory">
          <CardHeader>
            <CardTitle>Bid History</CardTitle>
            <CardDescription>
              See all bids for this auction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBids ? (
              <div className="text-center py-4">Loading bid history...</div>
            ) : bids.length > 0 ? (
              <BidHistory bids={bids} />
            ) : (
              <div className="text-center py-4 text-gray-500">
                No bids have been placed on this auction yet.
                {auction.status === 'upcoming' && " You could be the first!"}
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
