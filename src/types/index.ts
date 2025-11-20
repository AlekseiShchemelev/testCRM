// src/types/index.ts
export interface Client {
  id?: string;
  fullName: string;
  phone: string;
  address: string;
  meetingDate: string;
  status: 'planned' | 'completed' | 'cancelled';
  createdAt: string;
  propertyPhotos?: string[];
  listingUrl?: string;   // ← новое
  comments?: string;     // ← новое
}

export interface HistoryEntry {
  id?: string;
  clientId: string;
  action: 'created' | 'updated' | 'deleted' | 'meeting_completed' | 'meeting_cancelled';
  timestamp: string;
  details?: string;
}