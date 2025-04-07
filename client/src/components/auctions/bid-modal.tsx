import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AuctionTimer } from "./timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export default function BidModal({ open, onOpenChange, product }: BidModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState<number>(
    Math.ceil(product.currentPrice + product.increment)
  );
  const [maxBidAmount, setMaxBidAmount] = useState<number>(
    Math.ceil(product.currentPrice + product.increment * 5)
  );
  const [notes, setNotes] = useState("");
  const [autoBidEnabled, setAutoBidEnabled] = useState(false);

  const bidMutation = useMutation({
    mutationFn: async (bidData: {
      productId: number;
      amount: number;
      isAutoBid: boolean;
      maxAmount?: number;
      notes?: string;
    }) => {
      const res = await apiRequest("POST", "/api/bids", bidData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid placed successfully",
        description: `Your bid of $${bidAmount.toFixed(2)} has been placed.`,
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/bids`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bid failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to place a bid",
        variant: "destructive",
      });
      return;
    }

    // Validate bid amount
    if (bidAmount <= product.currentPrice) {
      toast({
        title: "Invalid bid amount",
        description: `Bid amount must be greater than the current bid of $${product.currentPrice.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    if (bidAmount < product.currentPrice + product.increment) {
      toast({
        title: "Invalid bid amount",
        description: `Minimum bid increment is $${product.increment.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    // Validate max bid amount for auto-bidding
    if (autoBidEnabled && maxBidAmount <= bidAmount) {
      toast({
        title: "Invalid maximum bid amount",
        description: "Maximum bid amount must be greater than your initial bid amount",
        variant: "destructive",
      });
      return;
    }

    // Submit bid
    bidMutation.mutate({
      productId: product.id,
      amount: bidAmount,
      isAutoBid: autoBidEnabled,
      maxAmount: autoBidEnabled ? maxBidAmount : undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place Your Bid</DialogTitle>
          <DialogDescription>
            {product.status === 'upcoming' 
              ? "This auction hasn't started yet, but you can place an early bid!"
              : "Submit your bid for this auction item"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 flex items-center">
          <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-20 h-20 object-cover rounded"
          />
          <div className="ml-4">
            <h4 className="font-medium">{product.title}</h4>
            <p className="text-sm text-gray-500">Current bid: ${product.currentPrice.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="border-t border-b border-gray-200 py-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Minimum bid increment:</span>
            <span className="font-medium">${product.increment.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Auction {product.status === 'upcoming' ? 'starts' : 'ends'} in:</span>
            <span className="font-medium text-red-600">
              <AuctionTimer endDate={product.endDate} startDate={product.startDate} />
            </span>
          </div>
          
          {product.status === 'upcoming' && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <p>You're placing an early bid on this upcoming auction. Your bid will be recorded immediately, and you'll be notified when the auction officially begins.</p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bid_amount">Your Bid Amount ($)</Label>
              <Input
                id="bid_amount"
                type="number"
                min={product.currentPrice + product.increment}
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(parseFloat(e.target.value))}
                placeholder={`${(product.currentPrice + product.increment).toFixed(2)}`}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter at least ${(product.currentPrice + product.increment).toFixed(2)} (current bid + ${product.increment.toFixed(2)})
              </p>
            </div>
            
            <div>
              <Label htmlFor="bid_notes">Notes (optional)</Label>
              <Textarea
                id="bid_notes"
                placeholder="Add a note to the seller"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto_bid"
                checked={autoBidEnabled}
                onCheckedChange={(checked) => setAutoBidEnabled(checked === true)}
              />
              <Label htmlFor="auto_bid" className="font-normal">
                Enable automatic bidding up to a maximum amount
              </Label>
            </div>
            
            {autoBidEnabled && (
              <div>
                <Label htmlFor="max_bid">Maximum Bid Amount ($)</Label>
                <Input
                  id="max_bid"
                  type="number"
                  min={bidAmount + 0.01}
                  step="0.01"
                  value={maxBidAmount}
                  onChange={(e) => setMaxBidAmount(parseFloat(e.target.value))}
                  placeholder={`${(product.currentPrice + product.increment * 5).toFixed(2)}`}
                  required
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={bidMutation.isPending}>
              {bidMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Bid"
              )}
            </Button>
          </DialogFooter>
        </form>
        
        <div className="mt-2 text-xs text-gray-500">
          <p>
            By placing a bid, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and commit to purchase this item if you win the auction.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
