import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Bell, User, LogOut, Menu, X, ShoppingBag, 
  PlusCircle, Package, Home, Info 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetClose,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Auctions', href: '/auctions' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Contact', href: '/#contact' }
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-auto text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-18c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
                <path d="M14.8 15.2L12 13.8V8h1.5v5l2.3 1.2z"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-primary">BidVista</span>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    location === item.href
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-600">
                  <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" alt={user.username} />
                        <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.isSeller && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/seller" className="cursor-pointer flex items-center">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Seller Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/create-auction" className="cursor-pointer flex items-center">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Create Auction</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth" className="text-gray-700 hover:text-gray-800 text-sm font-medium">
                  Sign In
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/auth?register=true" className="text-gray-700 hover:text-gray-800 text-sm font-medium">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="-mr-2 flex items-center sm:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-6 w-6 text-gray-500" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="flex items-center">
                    <svg className="h-8 w-auto text-primary mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm0-18c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z"/>
                      <path d="M14.8 15.2L12 13.8V8h1.5v5l2.3 1.2z"/>
                    </svg>
                    <span className="text-xl font-bold text-primary">BidVista</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="py-4 flex flex-col gap-4">
                  {/* Navigation Links */}
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.name}>
                      <Link 
                        href={item.href}
                        className="flex items-center px-2 py-2 text-base font-medium rounded-md hover:bg-gray-100"
                      >
                        {item.name === 'Home' && <Home className="mr-3 h-5 w-5 text-gray-500" />}
                        {item.name === 'Auctions' && <ShoppingBag className="mr-3 h-5 w-5 text-gray-500" />}
                        {item.name === 'How It Works' && <Info className="mr-3 h-5 w-5 text-gray-500" />}
                        {item.name === 'Contact' && <User className="mr-3 h-5 w-5 text-gray-500" />}
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}

                  {/* User Actions */}
                  {user ? (
                    <>
                      <div className="pt-4 pb-3 border-t border-gray-200">
                        <div className="flex items-center px-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="https://github.com/shadcn.png" alt={user.username} />
                              <AvatarFallback>{getInitials(user.fullName || user.username)}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="ml-3">
                            <div className="text-base font-medium text-gray-800">{user.fullName || user.username}</div>
                            <div className="text-sm font-medium text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          <SheetClose asChild>
                            <Link
                              href="/dashboard"
                              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                            >
                              Your Dashboard
                            </Link>
                          </SheetClose>
                          {user.isSeller && (
                            <>
                              <SheetClose asChild>
                                <Link
                                  href="/seller"
                                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                                >
                                  Seller Dashboard
                                </Link>
                              </SheetClose>
                              <SheetClose asChild>
                                <Link
                                  href="/create-auction"
                                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                                >
                                  Create Auction
                                </Link>
                              </SheetClose>
                            </>
                          )}
                          <button
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                          >
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="pt-4 pb-3 border-t border-gray-200">
                      <div className="space-y-1">
                        <SheetClose asChild>
                          <Link
                            href="/auth"
                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                          >
                            Sign In
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/auth?register=true"
                            className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
                          >
                            Register
                          </Link>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
