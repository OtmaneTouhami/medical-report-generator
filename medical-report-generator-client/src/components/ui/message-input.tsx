"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Info,
  Loader2,
  Mic,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { Button } from "@/components/ui/button";
import { InterruptPrompt } from "@/components/ui/interrupt-prompt";

interface MessageInputProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  submitOnEnter?: boolean;
  stop?: () => void;
  isGenerating: boolean;
  enableInterrupt?: boolean;
  transcribeAudio?: (blob: Blob) => Promise<string>;
  onPaste?: React.ClipboardEventHandler<HTMLTextAreaElement>;
}

export function MessageInput({
  placeholder = "Ask AI...",
  className,
  onKeyDown: onKeyDownProp,
  submitOnEnter = true,
  stop,
  isGenerating,
  enableInterrupt = true,
  transcribeAudio,
  onPaste,
  ...props
}: MessageInputProps) {
  const [showInterruptPrompt, setShowInterruptPrompt] = useState(false);
  const [pastedContent, setPastedContent] = useState<string | null>(null);

  const {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  } = useAudioRecording({
    transcribeAudio,
    onTranscriptionComplete: (text) => {
      props.onChange?.({
        target: { value: text },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    },
  });

  useEffect(() => {
    if (!isGenerating) {
      setShowInterruptPrompt(false);
    }
  }, [isGenerating]);

  const handlePaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData("text");
    if (text) {
      event.preventDefault();
      setPastedContent(text);
      return;
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    if (pastedContent && onPaste) {
      onPaste?.({
        clipboardData: {getData: () => pastedContent}
      } as unknown as React.ClipboardEvent<HTMLTextAreaElement>);
      setPastedContent(null);
    }
    (event.currentTarget as HTMLFormElement).form?.requestSubmit();  
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (isGenerating && stop && enableInterrupt) {
        if (showInterruptPrompt) {
          stop();
          setShowInterruptPrompt(false);
          handleSubmit(event);
        } else if (props.value || pastedContent) {
          setShowInterruptPrompt(true);
          return;
        }
      }

      handleSubmit(event);
    }

    onKeyDownProp?.(event);
  };

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [textAreaHeight, setTextAreaHeight] = useState<number>(0);

  useEffect(() => {
    if (textAreaRef.current) {
      setTextAreaHeight(textAreaRef.current.offsetHeight);
    }
  }, [props.value]);

  useAutosizeTextArea({
    ref: textAreaRef as React.RefObject<HTMLTextAreaElement>,
    maxHeight: 240,
    borderWidth: 1,
    dependencies: [props.value],
  });

  return (
    <div className="relative flex w-full">
      {enableInterrupt && (
        <InterruptPrompt
          isOpen={showInterruptPrompt}
          close={() => setShowInterruptPrompt(false)}
        />
      )}

      <RecordingPrompt
        isVisible={isRecording}
        onStopRecording={stopRecording}
      />

      <div className="relative flex w-1/2 mx-auto items-center my-4 space-x-2">
        <div className="relative flex-1">
          {pastedContent && (
            <div className="mb-2">
              <div className="relative flex max-w-[200px] rounded-md border p-1.5 pr-2 text-xs">
                <div className="flex w-full items-center space-x-2">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border bg-muted p-0.5">
                    <div className="h-full w-full overflow-hidden text-[6px] leading-none text-muted-foreground">
                      {pastedContent.slice(0, 50) + (pastedContent.length > 50 ? "..." : "")}
                    </div>
                  </div>
                  <span className="w-full truncate text-muted-foreground">
                    Pasted text
                  </span>
                </div>
                <button
                  className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border bg-background"
                  type="button"
                  onClick={() => setPastedContent(null)}
                  aria-label="Remove pasted content"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
          <textarea
            aria-label="Write your prompt here"
            placeholder={placeholder}
            ref={textAreaRef}
            onPaste={handlePaste}
            onKeyDown={onKeyDown}
            className={cn(
              "z-10 w-full grow resize-none rounded-xl border border-input bg-background p-3 pr-24 text-sm ring-offset-background transition-[border] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />

          <div className="absolute right-3 bottom-6 z-20 flex gap-2">
            {isSpeechSupported && (
                <Button
                    type="button"
                    variant="outline"
                    className={cn("h-8 w-8", isListening && "text-primary")}
                    aria-label="Voice input"
                    size="icon"
                    onClick={toggleListening}
                >
                  <Mic className="h-4 w-4" />
                </Button>
            )}
            {isGenerating ? (
                <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Stop generating"
                    onClick={stop}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
            ) : (
                <Button
                    type="submit"
                    size="icon"
                    className="h-8 w-8 transition-opacity"
                    aria-label="Send message"
                    disabled={props.value === "" && !pastedContent}
                    onClick={handleSubmit}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
            )}
          </div>
        </div>
      </div>

      <RecordingControls
        isRecording={isRecording}
        isTranscribing={isTranscribing}
        audioStream={audioStream}
        textAreaHeight={textAreaHeight}
        onStopRecording={stopRecording}
      />
    </div>
  );
}

function TranscribingOverlay() {
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <motion.div
          className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Transcribing audio...
      </p>
    </motion.div>
  );
}

interface RecordingPromptProps {
  isVisible: boolean;
  onStopRecording: () => void;
}

function RecordingPrompt({ isVisible, onStopRecording }: RecordingPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 cursor-pointer overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
          onClick={onStopRecording}
        >
          <span className="mx-2.5 flex items-center">
            <Info className="mr-2 h-3 w-3" />
            Click to finish recording
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface RecordingControlsProps {
  isRecording: boolean;
  isTranscribing: boolean;
  audioStream: MediaStream | null;
  textAreaHeight: number;
  onStopRecording: () => void;
}

function RecordingControls({
  isRecording,
  isTranscribing,
  audioStream,
  textAreaHeight,
  onStopRecording,
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <AudioVisualizer
          audioStream={audioStream}
          isRecording={isRecording}
          onClick={onStopRecording}
        />
      </div>
    );
  }

  if (isTranscribing) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <TranscribingOverlay />
      </div>
    );
  }

  return null;
}
