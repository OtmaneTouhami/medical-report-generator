import React from 'react';
import { Download, AlertTriangle, Trash2 } from './icons/CustomIcons';
import { ReportApiResponse } from '../types';
import api from '../api/axios';

interface ReportsListProps {
  reports: ReportApiResponse[];
  onRefresh: () => Promise<void>;
  onDeleteReport: (reportId: number) => void;
  onViewPrompt: (report: ReportApiResponse) => void;
}

const ReportsList: React.FC<ReportsListProps> = ({ reports, onDeleteReport, onViewPrompt }) => {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No reports found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div 
          key={report.id} 
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onViewPrompt(report)}
        >
          <div className="text-sm text-gray-800 dark:text-gray-200 mb-2 line-clamp-2 font-medium">
            {report.prompt_text}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(report.created_at).toLocaleString()}
            </span>
            
            <div className="flex space-x-2">
              {report.generated_report_path ? (
                <a
                  href={`${api.defaults.baseURL}/reports/${report.id}/download`}
                  download
                  className="p-1.5 rounded text-sm flex items-center space-x-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering the card's onClick
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              ) : (
                <div 
                  className="p-1.5 rounded text-sm flex items-center space-x-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering the card's onClick
                >
                  <AlertTriangle size={14} />
                  <span>{report.error_message || 'Failed'}</span>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the card's onClick
                  onDeleteReport(report.id);
                }}
                className="p-1.5 rounded text-sm flex items-center space-x-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportsList;
