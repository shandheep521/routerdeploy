import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Check } from "lucide-react";

interface BidHistoryProps {
  bids: any[];
}

export function BidHistory({ bids }: BidHistoryProps) {
  // Sort bids by amount in descending order
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
  
  if (bids.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bids have been placed yet. Be the first to bid!
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bidder</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBids.map((bid, index) => (
            <TableRow key={bid.id}>
              <TableCell>
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="" alt={`Bidder ${bid.userId}`} />
                    <AvatarFallback className="text-xs">
                      {`B${bid.userId}`}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">User #{bid.userId}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ${bid.amount.toFixed(2)}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {format(new Date(bid.createdAt), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                {index === 0 ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center">
                    <Check className="h-3 w-3 mr-1" /> Leading
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600">
                    Outbid
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
