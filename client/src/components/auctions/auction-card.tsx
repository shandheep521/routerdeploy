import { Link } from "wouter";
import { Product, User } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AuctionTimer } from "./timer";
import BidModal from "./bid-modal";

interface AuctionCardProps {
  product: Product;
  seller?: User;
}

export default function AuctionCard({ product, seller }: AuctionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWatching, setIsWatching] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);

  const handleBid = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to place a bid",
        variant: "destructive",
      });
      return;
    }
    setBidModalOpen(true);
  };

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
        await apiRequest("POST", "/api/watchlist", { productId: product.id });
        setIsWatching(true);
        toast({
          title: "Added to watchlist",
          description: `${product.title} has been added to your watchlist.`,
        });
      } else {
        await apiRequest("DELETE", `/api/watchlist/${product.id}`);
        setIsWatching(false);
        toast({
          title: "Removed from watchlist",
          description: `${product.title} has been removed from your watchlist.`,
        });
      }
      // Invalidate watchlist cache if needed
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

  // Determine auction status badge
  const getStatusBadge = () => {
    const now = new Date();
    const endDate = new Date(product.endDate);
    const startDate = new Date(product.startDate);

    // Calculate time remaining
    const hoursRemaining = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (now > endDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Ended
        </span>
      );
    } else if (now < startDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Upcoming
        </span>
      );
    } else if (hoursRemaining < 24) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ending Soon
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
  };

  return (
    <>
      <div className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="relative">
          <Link href={`/auctions/${product.id}`}>
            <img 
              src={product.imageUrl} 
              alt={product.title} 
              className="w-full h-60 object-cover cursor-pointer"
            />
          </Link>
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between">
            <div>
              <Link href={`/auctions/${product.id}`}>
                <h3 className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors">
                  {product.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500">
                Listed by <span className="text-primary hover:underline">{seller?.username || "Seller"}</span>
              </p>
            </div>
            <div className="auction-timer bg-gray-100 px-2 py-1 rounded text-xs font-medium">
              <AuctionTimer endDate={product.endDate} startDate={product.startDate} />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Current Bid</span>
              <span className="text-gray-500">Bids</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xl font-bold">${product.currentPrice.toFixed(2)}</span>
              <span className="text-gray-700">{product.bidCount}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              onClick={handleBid}
              disabled={product.status !== 'active' || (user && product.sellerId === user.id)}
            >
              Place Bid
            </Button>
            <Button
              variant="outline"
              onClick={handleWatchlist}
            >
              {isWatching ? 'Watching' : 'Watch'}
            </Button>
          </div>
        </div>
      </div>

      <BidModal 
        open={bidModalOpen}
        onOpenChange={setBidModalOpen}
        product={product}
      />
    </>
  );
}
