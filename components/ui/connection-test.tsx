"use client";

import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { api } from "@/lib/api";
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export function ConnectionTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    backend: boolean;
    database: boolean;
    realtime: boolean;
  } | null>(null);

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults(null);

    const results = {
      backend: false,
      database: false,
      realtime: false,
    };

    try {
      // Test Backend Connection
      const healthResponse = await api.health();
      results.backend = healthResponse.success;

      // Test Database Connection (through projects API)
      const projectsResponse = await api.projects.getAll();
      results.database = projectsResponse.success;

      // Test Realtime Connection
      try {
        const realtimeResponse = await fetch("/api/realtime/broadcast", {
          method: "GET",
        });
        results.realtime = realtimeResponse.ok;
      } catch (error) {
        console.error("Realtime test failed:", error);
        results.realtime = false;
      }
    } catch (error) {
      console.error("Connection test failed:", error);
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const allTestsPassed = testResults && 
    testResults.backend && 
    testResults.database && 
    testResults.realtime;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={runConnectionTest}
          disabled={isTesting}
          variant="outline"
          size="sm"
        >
          {isTesting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          {isTesting ? "جاري الاختبار..." : "اختبار الاتصال"}
        </Button>
        
        {testResults && (
          <Badge variant={allTestsPassed ? "default" : "destructive"}>
            {allTestsPassed ? "جميع الاختبارات نجحت" : "فشل في بعض الاختبارات"}
          </Badge>
        )}
      </div>

      {testResults && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {testResults.backend ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              الخادم الخلفي: {testResults.backend ? "متصل" : "غير متصل"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {testResults.database ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              قاعدة البيانات: {testResults.database ? "متصل" : "غير متصل"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {testResults.realtime ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              التحديثات المباشرة: {testResults.realtime ? "متصل" : "غير متصل"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 