import { useState, useEffect } from "react";

interface AuctionTimerProps {
  startDate: string | Date;
  endDate: string | Date;
}

export function AuctionTimer({ startDate, endDate }: AuctionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      
      // If auction hasn't started yet
      if (now < startDateTime) {
        setIsActive(false);
        const distance = startDateTime - now;
        formatTime(distance, "Starts in");
      }
      // If auction is active
      else if (now < endDateTime) {
        setIsActive(true);
        const distance = endDateTime - now;
        formatTime(distance);
      }
      // If auction has ended
      else {
        setIsActive(false);
        setTimeLeft("Ended");
      }
    };
    
    const formatTime = (distance: number, prefix = "") => {
      // Calculate time units
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Format the time string
      let timeString = "";
      
      if (days > 0) {
        timeString = `${days}d ${hours}h`;
      } else if (hours > 0) {
        timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
      
      setTimeLeft(prefix ? `${prefix} ${timeString}` : timeString);
    };
    
    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  return (
    <span className={`${isActive && "auction-timer"}`}>
      {timeLeft}
    </span>
  );
}
