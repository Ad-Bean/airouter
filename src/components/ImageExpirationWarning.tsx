"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Clock, Crown, X } from "lucide-react";

// Helper function to get time remaining (duplicated to avoid server-side import issues)
function getTimeRemaining(autoDeleteAt: Date): {
  expired: boolean;
  timeLeft: string;
  minutes: number;
} {
  const now = new Date();
  const timeDiff = autoDeleteAt.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return { expired: true, timeLeft: "Expired", minutes: 0 };
  }
  
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return { expired: false, timeLeft: `${days}d ${hours % 24}h`, minutes };
  } else if (hours > 0) {
    return { expired: false, timeLeft: `${hours}h ${minutes % 60}m`, minutes };
  } else {
    return { expired: false, timeLeft: `${minutes}m`, minutes };
  }
}

interface ImageExpirationWarningProps {
  autoDeleteAt: Date;
  userType: "free" | "paid";
  onDismiss?: () => void;
  className?: string;
}

export function ImageExpirationWarning({
  autoDeleteAt,
  userType,
  onDismiss,
  className = ""
}: ImageExpirationWarningProps) {
  const [timeInfo, setTimeInfo] = useState(() => getTimeRemaining(autoDeleteAt));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const newTimeInfo = getTimeRemaining(autoDeleteAt);
      setTimeInfo(newTimeInfo);
      
      // Auto-hide if expired
      if (newTimeInfo.expired) {
        setDismissed(true);
      }
    };

    // Update immediately
    updateTimer();

    // Update every minute for free users, every hour for paid users
    const interval = setInterval(updateTimer, userType === "free" ? 60000 : 3600000);

    return () => clearInterval(interval);
  }, [autoDeleteAt, userType]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || timeInfo.expired) {
    return null;
  }

  // Show warning immediately for free users, and for paid users when getting close to expiration
  if (userType === "free") {
    // Always show for free users since they have only 10 minutes
    // No need to hide initially
  } else if (userType === "paid" && timeInfo.minutes > 24 * 60) {
    // Don't show warning for paid users with more than 24 hours left
    return null;
  }

  const isUrgent = (userType === "free" && timeInfo.minutes <= 2) || 
                   (userType === "paid" && timeInfo.minutes <= 60);

  return (
    <div className={`rounded-lg border p-3 ${className} ${
      isUrgent 
        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800" 
        : userType === "free"
          ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
    }`}>
      <div className="flex items-start gap-2">
        <div className={`w-4 h-4 mt-0.5 ${
          isUrgent ? "text-red-500" : userType === "free" ? "text-amber-500" : "text-yellow-500"
        }`}>
          {isUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${
            isUrgent 
              ? "text-red-800 dark:text-red-200" 
              : userType === "free"
                ? "text-amber-800 dark:text-amber-200"
                : "text-yellow-800 dark:text-yellow-200"
          }`}>
            {userType === "free" ? "⏰ Free Tier - Limited Storage" : "Image Expiration"}
          </div>
          
          <div className={`text-xs mt-1 ${
            isUrgent 
              ? "text-red-600 dark:text-red-300" 
              : userType === "free"
                ? "text-amber-600 dark:text-amber-300"
                : "text-yellow-600 dark:text-yellow-300"
          }`}>
            {userType === "free" ? (
              <>
                These images will be <strong>automatically deleted in {timeInfo.timeLeft}</strong>.
                <br />
                💡 Free tier images are stored for 10 minutes only.
              </>
            ) : (
              <>
                This image will be deleted in <strong>{timeInfo.timeLeft}</strong>.
                <br />
                Paid plan images are stored for 7 days.
              </>
            )}
          </div>
          
          {userType === "free" && (
            <div className="mt-2">
              <a
                href="/billing"
                className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-2.5 py-1.5 rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Crown className="w-3 h-3" />
                Upgrade for 7-day storage
              </a>
            </div>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className={`w-4 h-4 ${
            isUrgent 
              ? "text-red-400 hover:text-red-600" 
              : "text-yellow-400 hover:text-yellow-600"
          } transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
