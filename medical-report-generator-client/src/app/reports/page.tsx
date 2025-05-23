"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, Trash2, FileText, Calendar, Eye } from "lucide-react";

import { useChat } from "@/contexts/chat-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import api from "@/api/axios";

export default function ReportsPage() {
    const { reports, fetchReports, deleteReport, deleteAllReports } = useChat();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
    const [isViewPromptDialogOpen, setIsViewPromptDialogOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState<number | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<string>("");

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleDeleteReport = () => {
        if (reportToDelete !== null) {
            deleteReport(reportToDelete);
            setReportToDelete(null);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleDeleteAllReports = async () => {
        try {
            await deleteAllReports();
            // Refresh the reports list after a short delay
            setTimeout(() => {
                fetchReports();
            }, 500);
        } catch (error) {
            console.error("Error deleting all reports:", error);
        } finally {
            setIsDeleteAllDialogOpen(false);
        }
    };

    const handleViewPrompt = (prompt: string) => {
        setSelectedPrompt(prompt);
        setIsViewPromptDialogOpen(true);
    };

    const truncateText = (text: string, maxLength: number = 60) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    };

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-4 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold">Generated Reports</h1>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        View and manage your medical reports
                                    </p>
                                </div>
                                {reports.length > 0 && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setIsDeleteAllDialogOpen(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete All
                                    </Button>
                                )}
                            </div>
                            <div className="rounded-lg border shadow-sm overflow-hidden">
                                <Table>
                                    <TableCaption>A list of your generated medical reports.</TableCaption>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[50%]">Prompt</TableHead>
                                            <TableHead className="w-[180px]">Created At</TableHead>
                                            <TableHead className="w-[120px]">Status</TableHead>
                                            <TableHead className="text-right w-[150px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center">
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                        <FileText className="h-10 w-10 mb-2 opacity-20" />
                                                        <p>No reports found.</p>
                                                        <p className="text-sm">Generate a report from the chat interface.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            reports.map((report) => (
                                                <TableRow key={report.id} className="hover:bg-muted/30">
                                                    <TableCell className="max-w-xs">
                                                        <div className="font-medium">{truncateText(report.prompt_text)}</div>
                                                    </TableCell>
                                                    <TableCell className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {format(new Date(report.created_at), "PPP")}
                                                    </TableCell>
                                                    <TableCell>
                                                        {report.generated_report_path ? (
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
                                                                Completed
                                                            </Badge>
                                                        ) : (
                                                            report.error_message ? (
                                                                <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
                                                                    Error
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200">
                                                                    Processing
                                                                </Badge>
                                                            )
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => handleViewPrompt(report.prompt_text)}
                                                                title="View Prompt"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {report.generated_report_path && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => window.open(`${api.defaults.baseURL}/reports/${report.id}/download`, "_blank")}
                                                                    title="Download Report"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setReportToDelete(report.id);
                                                                    setIsDeleteDialogOpen(true);
                                                                }}
                                                                title="Delete Report"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>

            {/* Delete Single Report Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Report</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this report? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteReport}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete All Reports Dialog */}
            <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete All Reports</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete all reports? This action cannot be undone and will remove {reports.length} reports.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAllReports}>
                            Delete All
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Prompt Dialog */}
            <Dialog open={isViewPromptDialogOpen} onOpenChange={setIsViewPromptDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Prompt Details</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <div className="bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                            {selectedPrompt}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewPromptDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
