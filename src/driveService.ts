import { DriveFileInfo } from './types';

declare global {
  interface Window {
    google?: any;
  }
}

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export class GoogleDriveService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    // Try restoring existing token from sessionStorage
    const savedToken = sessionStorage.getItem('gdrive_access_token');
    const savedExp = sessionStorage.getItem('gdrive_token_expires');
    if (savedToken && savedExp && Number(savedExp) > Date.now()) {
      this.accessToken = savedToken;
      this.tokenExpiresAt = Number(savedExp);
    }
  }

  public isAuthenticated(): boolean {
    return Boolean(this.accessToken && this.tokenExpiresAt > Date.now());
  }

  public getAccessToken(): string | null {
    if (this.isAuthenticated()) {
      return this.accessToken;
    }
    return null;
  }

  public setManualToken(token: string) {
    this.accessToken = token;
    this.tokenExpiresAt = Date.now() + 3600 * 1000;
    sessionStorage.setItem('gdrive_access_token', token);
    sessionStorage.setItem('gdrive_token_expires', String(this.tokenExpiresAt));
  }

  public logout() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    sessionStorage.removeItem('gdrive_access_token');
    sessionStorage.removeItem('gdrive_token_expires');
  }

  // Request OAuth access token using Google Identity Services (GSI)
  public async requestOAuthToken(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google?.accounts?.oauth2) {
        return reject(new Error('Google Identity Services script not yet loaded. Please check connection.'));
      }

      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_SCOPE,
          callback: (response: any) => {
            if (response.error) {
              return reject(new Error(response.error_description || response.error));
            }
            if (response.access_token) {
              const token = String(response.access_token);
              this.accessToken = token;
              const expiresIn = response.expires_in ? Number(response.expires_in) : 3500;
              this.tokenExpiresAt = Date.now() + expiresIn * 1000;
              sessionStorage.setItem('gdrive_access_token', token);
              sessionStorage.setItem('gdrive_token_expires', String(this.tokenExpiresAt));
              resolve(token);
            } else {
              reject(new Error('No access token received.'));
            }
          },
        });

        this.tokenClient.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  // List CSV files from the user's Google Drive
  public async listCsvFiles(searchTerm?: string): Promise<DriveFileInfo[]> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not connected to Google Drive.');

    let query = "trashed = false and (mimeType = 'text/csv' or mimeType = 'text/plain' or name contains '.csv')";
    if (searchTerm && searchTerm.trim()) {
      query += ` and name contains '${searchTerm.trim().replace(/'/g, "\\'")}'`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'files(id, name, mimeType, size, modifiedTime)');
    url.searchParams.set('pageSize', '30');
    url.searchParams.set('orderBy', 'modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.logout();
        throw new Error('Google Drive authorization expired. Please sign in again.');
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to search Google Drive (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  }

  // Download raw CSV content from Google Drive by File ID
  public async downloadFileContent(fileId: string): Promise<string> {
    const token = this.getAccessToken();
    if (!token) throw new Error('Not connected to Google Drive.');

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        this.logout();
        throw new Error('Google Drive session expired. Please re-authenticate.');
      }
      throw new Error(`Failed to download file from Google Drive (HTTP ${res.status})`);
    }

    return await res.text();
  }
}

export const driveService = new GoogleDriveService();
