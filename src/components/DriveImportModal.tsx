import React, { useState, useEffect } from 'react';
import { driveService } from '../driveService';
import { DriveFileInfo } from '../types';
import {
  FolderUp,
  FileSpreadsheet,
  Upload,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface Props {
  onLoadCsvContent: (content: string, filename: string) => void;
  currentFilename: string;
}

export const DriveImportModal: React.FC<Props> = ({
  onLoadCsvContent,
  currentFilename,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [isConnected, setIsConnected] = useState(driveService.isAuthenticated());
  const [files, setFiles] = useState<DriveFileInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('FYERS');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Fetch public server config for Client ID if available
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.googleClientId) {
          setGoogleClientId(cfg.googleClientId);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnectOAuth = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (!googleClientId) {
        throw new Error(
          'OAuth Client ID not yet configured. You can either enter a Client ID or paste an OAuth Access Token below.'
        );
      }
      await driveService.requestOAuthToken(googleClientId);
      setIsConnected(true);
      setStatusMessage({ text: 'Connected to Google Drive successfully!', type: 'success' });
      await loadDriveFiles();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to connect via OAuth', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCustomToken = async () => {
    if (!customToken.trim()) return;
    driveService.setManualToken(customToken.trim());
    setIsConnected(true);
    setStatusMessage({ text: 'Access token saved. Fetching files from Drive...', type: 'success' });
    await loadDriveFiles();
  };

  const loadDriveFiles = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const list = await driveService.listCsvFiles(searchQuery);
      setFiles(list);
      if (list.length === 0) {
        setStatusMessage({ text: 'No matching CSV files found in Drive. Try another search or upload FYERS_HIST_DATA.csv.', type: 'info' });
      }
    } catch (err: any) {
      setIsConnected(false);
      setStatusMessage({ text: err.message || 'Error listing Drive files', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFile = async (file: DriveFileInfo) => {
    setIsLoading(true);
    setStatusMessage({ text: `Downloading ${file.name} from Google Drive...`, type: 'info' });
    try {
      const content = await driveService.downloadFileContent(file.id);
      onLoadCsvContent(content, file.name);
      setStatusMessage({ text: `Successfully loaded ${file.name}!`, type: 'success' });
      setIsOpen(false);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to load file content from Drive', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Local File Upload Fallback
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onLoadCsvContent(text, file.name);
        setIsOpen(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <button
        id="open-drive-modal-btn"
        onClick={() => {
          setIsOpen(true);
          if (driveService.isAuthenticated()) {
            loadDriveFiles();
          }
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs"
      >
        <FolderUp className="w-3.5 h-3.5 text-emerald-600" />
        <span>Drive &amp; CSV Data</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Load FYERS Historical Dataset</h3>
                  <p className="text-xs text-slate-500">Connect Google Drive or upload FYERS_HIST_DATA.csv directly</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg px-2"
              >
                &times;
              </button>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <div
                className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  statusMessage.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-800'
                    : statusMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-sky-50 border border-sky-200 text-sky-800'
                }`}
              >
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Active File info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Current Dataset: </span>
                  <strong className="text-slate-800 font-mono">{currentFilename}</strong>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 font-medium">
                  Active
                </span>
              </div>

              {/* Local CSV File Selector */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Upload Local FYERS_HIST_DATA.csv</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Directly parse your local CSV download</span>
                  <input
                    id="local-csv-upload-input"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleLocalFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Google Drive Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FolderUp className="w-4 h-4 text-emerald-600" />
                    <span>Google Drive Integration</span>
                  </div>
                  {isConnected ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">OAuth Drive.readonly</span>
                  )}
                </div>

                {!isConnected ? (
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Google OAuth Client ID
                      </label>
                      <input
                        id="google-client-id-input"
                        type="text"
                        placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="connect-drive-oauth-btn"
                        onClick={handleConnectOAuth}
                        disabled={isLoading}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                        Connect via Google Sign-In
                      </button>
                    </div>

                    {/* Or Manual Access Token option */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>Or Paste Existing Google Drive OAuth Access Token</span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          id="manual-access-token-input"
                          type="password"
                          placeholder="Bearer ya29.a0AfH6..."
                          value={customToken}
                          onChange={(e) => setCustomToken(e.target.value)}
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                        />
                        <button
                          id="save-manual-token-btn"
                          onClick={handleApplyCustomToken}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-900"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Search bar inside Drive */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="drive-search-input"
                          type="text"
                          placeholder="Search Drive files..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') loadDriveFiles();
                          }}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                      <button
                        onClick={loadDriveFiles}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-1 text-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Search
                      </button>
                      <button
                        onClick={() => {
                          driveService.logout();
                          setIsConnected(false);
                          setFiles([]);
                        }}
                        className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                      >
                        Disconnect
                      </button>
                    </div>

                    {/* Drive Files List */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          Searching Google Drive...
                        </div>
                      ) : files.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No CSV datasets found in Drive matching "{searchQuery}".
                        </div>
                      ) : (
                        files.map((file) => (
                          <div
                            key={file.id}
                            id={`drive-file-${file.id}`}
                            onClick={() => handleSelectFile(file)}
                            className="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                                <p className="text-[10px] text-slate-400">ID: {file.id.slice(0, 12)}...</p>
                              </div>
                            </div>
                            <button className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 whitespace-nowrap">
                              Load
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
