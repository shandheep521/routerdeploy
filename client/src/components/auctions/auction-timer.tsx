import { useState, useEffect } from "react";

interface AuctionTimerProps {
  endDate: string | Date;
}

export default function AuctionTimer({ endDate }: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [isEnded, setIsEnded] = useState(false);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsEnded(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);
    
    // Clean up on unmount
    return () => clearInterval(timer);
  }, [endDate]);
  
  const formatTime = (value: number) => {
    return value < 10 ? `0${value}` : value;
  };
  
  if (isEnded) {
    return <span className="text-red-500 font-mono">Auction ended</span>;
  }
  
  // Show different formats based on how much time is left
  if (timeLeft.days > 0) {
    return (
      <span className="font-mono">
        Ending in {timeLeft.days}d {formatTime(timeLeft.hours)}h
      </span>
    );
  } else {
    return (
      <span className="font-mono">
        Ending in {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    );
  }
}
