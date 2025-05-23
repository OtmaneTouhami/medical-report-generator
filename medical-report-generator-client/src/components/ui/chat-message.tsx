"use client";

import React, { useEffect } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { type Message } from "@/contexts/chat-context";
import { ReportMessage } from "@/components/ui/report-message";

const chatBubbleVariants = cva(
  "group/message relative break-words rounded-lg p-3 text-sm sm:max-w-[70%]",
  {
    variants: {
      isUser: {
        true: "bg-primary text-primary-foreground",
        false: "bg-muted text-foreground",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
);

type Animation = VariantProps<typeof chatBubbleVariants>["animation"];


export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean;
  animation?: Animation;
  actions?: React.ReactNode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  type,
  content,
  timestamp,
  showTimeStamp = false,
  animation = "scale",
  actions,
}) => {
  const isUser = type === "user";
  
  // Check if this is a report path message using our special format
  const isReportPath = !isUser && content.startsWith('REPORT_PATH:');
  
  // Extract report information if it's a report path
  let reportPath = '';
  let reportId = '';
  
  if (isReportPath) {
    const parts = content.split(':');
    if (parts.length >= 2) {
      reportPath = parts[1];
      reportId = parts.length >= 3 ? parts[2] : '';
    }
  }

  // Debug log to see what's coming in
  useEffect(() => {
    if (!isUser) {
      console.log("Assistant message content:", content);
      console.log("Is detected as report path:", isReportPath);
      if (isReportPath) {
        console.log("Extracted report path:", reportPath);
        console.log("Extracted report ID:", reportId);
      }
    }
  }, [content, isUser, isReportPath, reportPath, reportId]);

  const formattedTime = timestamp?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div className={cn(chatBubbleVariants({ isUser, animation }))}>
        {isReportPath ? (
          <ReportMessage reportPath={reportPath} reportId={reportId} />
        ) : (
          <MarkdownRenderer>{content}</MarkdownRenderer>
        )}
        {actions ? (
          <div className="absolute -bottom-4 right-2 flex space-x-1 rounded-lg border bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/message:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>

      {showTimeStamp && timestamp ? (
        <time
          dateTime={timestamp.toISOString()}
          className={cn(
            "mt-1 block px-1 text-xs opacity-50",
            animation !== "none" && "duration-500 animate-in fade-in-0"
          )}
        >
          {formattedTime}
        </time>
      ) : null}
    </div>
  );
};
