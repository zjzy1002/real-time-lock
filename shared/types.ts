export interface LockInfo {
    adId: string;
    userId: string;
    userName: string;
    startTime: number; 
  }
  

  export type LockStatusUpdate = LockInfo | null; // null means the ad is free!
  
  export interface ServerToClientEvents {
    "status-update": (status: LockStatusUpdate) => void;
    "notification": (message: string) => void;
  }
  
  export interface ClientToServerEvents {
    "request-lock": (data: { adId: string; userId: string; userName: string }) => void;
    "heartbeat": (adId: string) => void;
    "release-lock": (adId: string) => void;
  }