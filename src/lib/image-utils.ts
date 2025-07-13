export function isImageExpired(autoDeleteAt: string | null): boolean {
  if (!autoDeleteAt) return false;
  
  const expirationDate = new Date(autoDeleteAt);
  const now = new Date();
  
  return now > expirationDate;
}

export function getImageStatus(
  autoDeleteAt: string | null,
  userType: string | null
): {
  isExpired: boolean;
  timeLeft: string;
  shouldShowWarning: boolean;
} {
  if (!autoDeleteAt) {
    return {
      isExpired: false,
      timeLeft: "",
      shouldShowWarning: false,
    };
  }

  const expirationDate = new Date(autoDeleteAt);
  const now = new Date();
  const timeDiff = expirationDate.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return {
      isExpired: true,
      timeLeft: "Expired",
      shouldShowWarning: false,
    };
  }
  
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  let timeLeft: string;
  if (days > 0) {
    timeLeft = `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    timeLeft = `${hours}h ${minutes % 60}m`;
  } else {
    timeLeft = `${minutes}m`;
  }
  
  // Show warning for free users always, for paid users when < 24 hours
  const shouldShowWarning = userType === "free" || (userType === "paid" && hours < 24);
  
  return {
    isExpired: false,
    timeLeft,
    shouldShowWarning,
  };
}
