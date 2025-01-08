import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import type { EmailData } from '../types';
import { db } from '../firebaseConfig';
import { collection, writeBatch, doc } from 'firebase/firestore';
import Papa from 'papaparse';

interface EmailImportProps {
  onImport: (emails: EmailData[]) => void;
}

export function EmailImport({ onImport }: EmailImportProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const emails: EmailData[] = results.data.map((row: any) => ({
            id: doc(collection(db, 'emails')).id, // Generate new ID
            sender_name: row.sender_name,
            sender_email: row.sender_email,
            email_id: row.email_id,
            date: new Date(row.date),
            subject: row.subject,
            folder_id: row.folder_id,
            web_link_view: row.web_link_view
          }));

          const batch = writeBatch(db);
          emails.forEach(email => {
            const emailRef = doc(collection(db, 'emails'), email.id);
            batch.set(emailRef, email);
          });
          await batch.commit();

          onImport(emails);
          setStatus('success');
          setMessage(`${emails.length} emails imported successfully`);
        } catch (error) {
          setStatus('error');
          setMessage(error instanceof Error ? error.message : 'Failed to import emails');
        }
      },
      error: (error) => {
        setStatus('error');
        setMessage(error.message);
      }
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer">
          <Upload className="h-4 w-4" />
          Import Email CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        CSV file should contain: sender_name, sender_email, email_id, date, subject, folder_id, web_link_view
      </div>
    </div>
  );
}