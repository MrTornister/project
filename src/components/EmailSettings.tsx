import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';
import { databaseService } from '../services/databaseService';
import type { EmailData } from '../types';
import Papa from 'papaparse';

// Add type for CSV row
interface CSVRow {
  email_id: string;
  sender_name: string;
  sender_email: string;
  date: string;
  subject: string;
  folder_id: string;
  file_id: string;
}

interface EmailSettingsProps {
  onDataLoad: (emails: EmailData[]) => void;
}

export function EmailSettings({ onDataLoad }: EmailSettingsProps) {
  const [csvUrl, setCsvUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load CSV URL from localStorage instead of Firebase
    const savedCsvUrl = localStorage.getItem('emailSettingsCsvUrl');
    if (savedCsvUrl) {
      setCsvUrl(savedCsvUrl);
    }
  }, []);

  const handleSaveUrl = async () => {
    if (csvUrl.trim()) {
      try {
        // Save to localStorage instead of Firebase
        localStorage.setItem('emailSettingsCsvUrl', csvUrl.trim());
        setStatus('success');
        setMessage('URL saved successfully');
      } catch (error) {
        setStatus('error');
        setMessage('Failed to save URL');
      }
    }
  };

  const loadEmailData = async () => {
    try {
      const savedCsvUrl = localStorage.getItem('emailSettingsCsvUrl');
      
      if (!savedCsvUrl) {
        setStatus('error');
        setMessage('No CSV URL configured');
        return;
      }

      setStatus('loading');
      setMessage('Loading data...');

      const response = await fetch(savedCsvUrl);
      const csvText = await response.text();

      Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const emails: EmailData[] = results.data.map((row) => ({
            id: row.email_id,
            sender_name: row.sender_name,
            sender_email: row.sender_email,
            email_id: row.email_id,
            date: new Date(row.date),
            subject: row.subject,
            folder_id: row.folder_id,
            file_id: row.file_id,
            web_link_view: `https://drive.google.com/file/d/${row.file_id}/view`
          }));
          
          // Store in localStorage for offline access
          localStorage.setItem('emailData', JSON.stringify(emails));
          
          onDataLoad(emails);
          setStatus('success');
          setMessage(`Loaded ${emails.length} emails successfully`);
        },
        error: (error: Error) => {
          setStatus('error');
          setMessage(`Error parsing CSV: ${error.message}`);
        }
      });
    } catch (error) {
      setStatus('error');
      setMessage(`Error fetching CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Data Source</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CSV File URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={csvUrl}
                onChange={(e) => setCsvUrl(e.target.value)}
                placeholder="https://example.com/data.csv"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                onClick={handleSaveUrl}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save URL
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={loadEmailData}
              disabled={status === 'loading'}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>

            {status !== 'idle' && (
              <div className={`flex items-center gap-2 ${
                status === 'error' ? 'text-red-600' : 
                status === 'success' ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                <AlertCircle className="h-4 w-4" />
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}