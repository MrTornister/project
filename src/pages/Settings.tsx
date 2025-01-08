// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Upload, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import type { EmailData } from '../types';
import { emailsDB, settingsDB } from '../db/database';

export function Settings() {
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [csvUrl, setCsvUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
    loadEmails();
  }, []);

  const loadSettings = async () => {
    const settings = await settingsDB.get('csvUrl');
    console.log('Loaded settings:', settings);
    if (settings) {
      setCsvUrl(settings.value);
      fetchCsvData(settings.value);
    }
  };

  const loadEmails = async () => {
    const loadedEmails = await emailsDB.getAll();
    setEmails(loadedEmails);
  };

  const fetchCsvData = async (url: string) => {
    try {
      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.text();
      console.log('Received CSV data:', data.substring(0, 200)); // Log first 200 chars
      
      Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log('Parsed results:', results);
          try {
            const emailData = results.data as EmailData[];

            // Validate required fields
            const invalidEmails = emailData.filter(email => 
              !email.sender_email || !email.email_id
            );

            if (invalidEmails.length > 0) {
              throw new Error('Some emails have missing required fields');
            }

            // Clear existing emails
            await emailsDB.deleteAll();

            // Add new emails
            for (const email of emailData) {
              await emailsDB.add(email);
            }

            await loadEmails();
            setStatus('success');
            setMessage(`${emailData.length} emails imported successfully`);
          } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Import failed');
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          setStatus('error');
          setMessage(error.message);
        }
      });
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to fetch CSV');
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCsvUrl(event.target.value);
  };

  const handleUrlSave = async () => {
    await settingsDB.set('csvUrl', csvUrl);
    fetchCsvData(csvUrl);
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all emails?')) {
      await emailsDB.deleteAll();
      setEmails([]);
      setStatus('success');
      setMessage('All emails deleted');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Email Data Import</h2>
              <div className="flex gap-4">
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </button>
              </div>
            </div>

            {status !== 'idle' && (
              <div className={`mb-4 flex items-center gap-2 ${
                status === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={csvUrl}
                  onChange={handleUrlChange}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <button
                  onClick={handleUrlSave}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Save URL
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emails.map((email) => (
                    <tr key={email.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{email.sender_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{email.sender_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{email.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{email.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={email.web_link_view}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Email
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}