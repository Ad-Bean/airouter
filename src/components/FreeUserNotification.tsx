"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Crown, X } from "lucide-react";

export function FreeUserNotification() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this notification
    const dismissed = localStorage.getItem("freeUserNotificationDismissed");
    if (dismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("freeUserNotificationDismissed", "true");
  };

  // Only show for authenticated free users
  if (!session?.user || dismissed) {
    return null;
  }

  // Check user type - default to free if not specified
  const userType = (session.user as { userType?: string })?.userType || "free";
  
  if (userType !== "free") {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-b border-orange-200 dark:border-orange-800">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <strong>Free Plan:</strong> Your generated images will be automatically deleted after 10 minutes. 
              <a 
                href="/billing" 
                className="font-medium underline hover:no-underline ml-1"
              >
                Upgrade to keep images for 7 days
              </a>
            </p>
          </div>
          
          <a
            href="/billing"
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded-md transition-colors"
          >
            <Crown className="w-3 h-3" />
            Upgrade
          </a>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
