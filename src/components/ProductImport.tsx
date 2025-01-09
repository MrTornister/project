import { useState } from 'react';
import { databaseService } from '../services/databaseService';
import type { Product } from '../types';
import Papa from 'papaparse';

interface CSVProduct {
  id: string;
  name: string;
}

export function ProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const text = await file.text();
      
      Papa.parse<CSVProduct>(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (results.errors.length > 0) {
              throw new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', '));
            }

            // Validate CSV structure
            const headers = Object.keys(results.data[0] || {});
            if (!headers.includes('id') || !headers.includes('name')) {
              throw new Error('Invalid CSV format. Required columns: id, name');
            }

            for (const row of results.data) {
              if (!row.id?.trim() || !row.name?.trim()) {
                throw new Error('All products must have both id and name');
              }

              // Use the ID from CSV directly without generating a new one
              await databaseService.addProduct({
                id: row.id.trim(),
                name: row.name.trim()
              });
            }
            
            setFile(null);
            if (document.querySelector<HTMLInputElement>('input[type="file"]')) {
              document.querySelector<HTMLInputElement>('input[type="file"]')!.value = '';
            }
            setImporting(false);
          } catch (err) {
            setError('Failed to import products: ' + (err instanceof Error ? err.message : String(err)));
            setImporting(false);
          }
        },
        error: (error: Error) => {
          setError('Failed to parse CSV: ' + error.message);
          setImporting(false);
        }
      });
    } catch (err) {
      setError('Failed to read file: ' + (err instanceof Error ? err.message : String(err)));
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Import Products (CSV)
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleImport}
        disabled={!file || importing}
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 
                 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {importing ? 'Importing...' : 'Import Products'}
      </button>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
}