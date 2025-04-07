import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User,
  Clock,
  Package,
  Heart,
  Settings,
  LogOut,
  Edit,
  Save,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

// Profile form schema
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user bids
  const { 
    data: userBids = [],
    isLoading: isLoadingBids
  } = useQuery({
    queryKey: [user ? `/api/users/${user?.id}/bids` : null],
    enabled: !!user,
  });

  // Fetch notifications
  const { 
    data: notifications = [],
    isLoading: isLoadingNotifications
  } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
      queryClient.setQueryData(["/api/user"], updatedUser);
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Format unread notifications count
  const unreadCount = notifications.filter((notification: any) => !notification.isRead).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="" alt={user?.username} />
                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-gray-500 text-sm">@{user?.username}</p>
                  {user?.isSeller && (
                    <Badge className="mt-2">Seller</Badge>
                  )}
                </div>

                <Separator className="my-6" />

                <nav className="space-y-2">
                  <button className="w-full flex items-center px-3 py-2 text-sm rounded-md bg-gray-100 font-medium">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 font-medium">
                    <Heart className="h-4 w-4 mr-2" />
                    Watchlist
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    Bid History
                  </button>
                  {user?.isSeller && (
                    <button 
                      className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 font-medium"
                      onClick={() => window.location.href = "/seller/dashboard"}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Seller Dashboard
                    </button>
                  )}
                  <button className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 font-medium">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button 
                    className="w-full flex items-center px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="bids">Bid History</TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Manage your personal information
                        </CardDescription>
                      </div>
                      <Button 
                        variant={isEditing ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              {...form.register("firstName")}
                              className="mt-1"
                            />
                            {form.formState.errors.firstName && (
                              <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.firstName.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              {...form.register("lastName")}
                              className="mt-1"
                            />
                            {form.formState.errors.lastName && (
                              <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.lastName.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            className="mt-1"
                          />
                          {form.formState.errors.email && (
                            <p className="text-red-600 text-sm mt-1">
                              {form.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            {...form.register("username")}
                            className="mt-1"
                          />
                          {form.formState.errors.username && (
                            <p className="text-red-600 text-sm mt-1">
                              {form.formState.errors.username.message}
                            </p>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="mt-2"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                            <p className="mt-1">{user?.firstName}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                            <p className="mt-1">{user?.lastName}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="mt-1">{user?.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Username</h3>
                          <p className="mt-1">{user?.username}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                          <div className="mt-1">
                            {user?.isSeller ? (
                              <Badge>Seller</Badge>
                            ) : (
                              <Badge variant="outline">Buyer</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bid History Tab */}
              <TabsContent value="bids">
                <Card>
                  <CardHeader>
                    <CardTitle>Bid History</CardTitle>
                    <CardDescription>
                      Track all your bidding activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBids ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex justify-between items-center p-4 border rounded-md">
                            <div>
                              <Skeleton className="h-5 w-40 mb-2" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : userBids.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Bid History</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          You haven't placed any bids yet. Browse our auctions and start bidding!
                        </p>
                        <Button className="mt-4" onClick={() => window.location.href = "/auctions"}>
                          Browse Auctions
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userBids.map((bid: any) => (
                          <div key={bid.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md">
                            <div>
                              <h3 className="font-medium">Bid on Auction #{bid.auctionId}</h3>
                              <p className="text-gray-500 text-sm mt-1">
                                Amount: ${bid.amount.toFixed(2)} · {format(new Date(bid.bidTime), 'MMM d, yyyy - h:mm a')}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-3 md:mt-0"
                              onClick={() => window.location.href = `/auctions/${bid.auctionId}`}
                            >
                              View Auction
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                          Stay updated on your auction activity
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        Mark All as Read
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNotifications ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="flex p-4 border rounded-md">
                            <Skeleton className="h-10 w-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-5 w-60 mb-2" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                        <p className="text-gray-500">
                          You're all caught up! We'll notify you when there's activity on your auctions or bids.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map((notification: any) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border rounded-md ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                          >
                            <div className="flex justify-between">
                              <h3 className="font-medium">{notification.message}</h3>
                              {!notification.isRead && (
                                <Badge variant="secondary">New</Badge>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              {format(new Date(notification.createdAt), 'MMM d, yyyy - h:mm a')}
                            </p>
                            {notification.auctionId && (
                              <Button 
                                variant="link" 
                                className="p-0 h-auto text-primary mt-2"
                                onClick={() => window.location.href = `/auctions/${notification.auctionId}`}
                              >
                                View Auction
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
