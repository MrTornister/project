import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import type { EmailData } from '../types';
import { databaseService } from '../services/databaseService';

export function EmailImport() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshEmails } = useData();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const fileContent = await file.text();
      const emailData = await databaseService.parseEmail(fileContent);
      await databaseService.addEmail(emailData);
      await refreshEmails?.(); // Optional chaining in case refreshEmails is not provided
      setFile(null);
      setError(null);
    } catch (err) {
      setError('Error importing emails: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Import Emails</h2>
      <input
        type="file"
        accept=".eml,.txt"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleImport}
        disabled={!file || loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Importing...' : 'Import'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}