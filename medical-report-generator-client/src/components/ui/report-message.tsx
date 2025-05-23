"use client";

import React, { useEffect } from "react";
import { Download, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/axios";
import { cn } from "@/lib/utils";

interface ReportMessageProps {
  reportPath: string;
  reportId?: string;
  className?: string;
}

export function ReportMessage({ reportPath, reportId, className }: ReportMessageProps) {
  // Use provided reportId or extract it if not provided
  const finalReportId = reportId || (() => {
    console.log("No reportId provided, extracting from path:", reportPath);
    
    // Try to extract ID using regex pattern matching
    const idMatch = reportPath.match(/\/reports\/(\d+)/);
    if (idMatch && idMatch[1]) {
      return idMatch[1];
    }
    
    // Fallback: try to get the last numeric segment from the path
    const segments = reportPath.split('/');
    for (let i = segments.length - 1; i >= 0; i--) {
      const numericPart = segments[i].match(/(\d+)/);
      if (numericPart && numericPart[1]) {
        return numericPart[1];
      }
    }
    
    return reportPath;
  })();
  
  useEffect(() => {
    console.log("Report path:", reportPath);
    console.log("Provided reportId:", reportId);
    console.log("Final reportId:", finalReportId);
  }, [reportPath, reportId, finalReportId]);
  
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Report generated successfully!</span>
      </div>
      
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Medical Report Document (DOCX)</span>
          </div>
          <Button 
            variant="outline"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            onClick={() => window.open(`${api.defaults.baseURL}/reports/${finalReportId}/download`, "_blank")}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground mt-2">
        <p>Would you like to generate another medical report? Feel free to ask!</p>
      </div>
    </div>
  );
} 