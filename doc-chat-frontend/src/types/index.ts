export type MessageType = "user" | "assistant";

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  document?: DocumentResponse;
}

export interface DocumentResponse {
  id: string;
  filename: string;
  url: string;
  createdAt: Date;
}

export interface ReportApiResponse {
  id: number;
  prompt_text: string;
  generated_report_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  addMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  reports: ReportApiResponse[];
  fetchReports: () => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
  deleteAllReports: () => Promise<void>;
}
