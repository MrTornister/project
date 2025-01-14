import { useState, useEffect } from 'react';
import { Mail, User, Settings as SettingsIcon, X, Loader2 } from 'lucide-react';
import { EmailSettings } from '../components/EmailSettings';
import { UserAccountSettings } from '../components/UserAccountSettings';
import type { EmailData } from '../types';
import Modal from 'react-modal';

type SettingsTab = 'email' | 'user' | 'general';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
  const [emailContent, setEmailContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cachedData = localStorage.getItem('emailData');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      setEmails(parsedData.map((email: any) => ({
        ...email,
        date: new Date(email.date)
      })));
    }
  }, []);

  const handleEmailDataLoad = (newEmails: EmailData[]) => {
    setEmails(newEmails);
  };

  const handleViewEmail = async (email: EmailData) => {
    setSelectedEmail(email);
    setIsLoading(true);
    setError(null);

    try {
      // Pobierz plik z lokalnego serwera
      const response = await fetch(`http://localhost:3001/api/email/${email.file_id}`);
      if (!response.ok) throw new Error('Failed to fetch email content');
      
      const htmlContent = await response.text();
      
      // Przygotuj treść do wyświetlenia
      const sanitizedContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <base target="_blank">
            <style>
              body { 
                font-family: Arial, sans-serif;
                margin: 20px;
                line-height: 1.5;
              }
              img { max-width: 100%; height: auto; }
              table { width: 100%; border-collapse: collapse; }
              td, th { padding: 8px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="email-content">
              ${htmlContent}
            </div>
          </body>
        </html>
      `;

      setEmailContent(sanitizedContent);
    } catch (err) {
      console.error('Error:', err);
      setError('Could not load email content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { id: 'general', label: 'General Settings', icon: SettingsIcon },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'user', label: 'User Settings', icon: User },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <UserAccountSettings />
          </div>
        );
      case 'email':
        return (
          <>
            <EmailSettings onDataLoad={handleEmailDataLoad} />
            {/* Existing email table */}
            {emails.length > 0 && (
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Imported Emails</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Showing {emails.length} emails from the data source
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {emails.map((email) => (
                        <tr key={email.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {email.sender_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.sender_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {email.date.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleViewEmail(email)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        );
      case 'user':
        return <div>User Management Content</div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as SettingsTab)}
              className={`w-full flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>

      {/* Email Content Modal */}
      <Modal
        isOpen={!!selectedEmail}
        onRequestClose={() => {
          setSelectedEmail(null);
          setEmailContent('');
          setError(null);
        }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vh] bg-white rounded-lg shadow-xl"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <div className="h-full flex flex-col">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEmail?.subject}
              </h3>
              <p className="text-sm text-gray-500">
                From: {selectedEmail?.sender_name} ({selectedEmail?.sender_email})
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedEmail(null);
                setEmailContent('');
                setError(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-auto p-6 email-content">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-600 text-center">
                  <p className="font-medium">Error loading email content</p>
                  <p className="text-sm mt-1">{error}</p>
                  <a 
                    href={selectedEmail?.web_link_view} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Open in Google Drive
                  </a>
                </div>
              </div>
            )}

            {!isLoading && !error && emailContent && (
              <div className="h-full bg-white overflow-auto">
                <iframe
                  srcDoc={emailContent}
                  className="w-full h-full"
                  sandbox="allow-same-origin"
                  style={{ minHeight: '500px' }}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}