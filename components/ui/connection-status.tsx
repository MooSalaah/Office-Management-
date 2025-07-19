"use client";

import { useRealtimeConnection } from "@/lib/realtime";
import { Badge } from "./badge";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected, reconnectAttempts } = useRealtimeConnection();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Wifi className="h-4 w-4 text-green-500" />
        <Badge variant="secondary" className="text-xs">
          متصل
        </Badge>
      </div>
    );
  }

  if (reconnectAttempts > 0) {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-500" />
        <Badge variant="secondary" className="text-xs">
          إعادة الاتصال... ({reconnectAttempts})
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <WifiOff className="h-4 w-4 text-red-500" />
      <Badge variant="destructive" className="text-xs">
        غير متصل
      </Badge>
    </div>
  );
} 