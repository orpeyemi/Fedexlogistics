export enum ShipmentStatus {
  CREATED = 'Created',
  PICKED_UP = 'Picked Up',
  IN_TRANSIT = 'In Transit',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  EXCEPTION = 'Exception',
}

export interface TrackingEvent {
  id: string;
  timestamp: string; // ISO date string
  location: string;
  status: ShipmentStatus;
  description: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  currentStatus: ShipmentStatus;
  estimatedDelivery: string; // ISO date string
  events: TrackingEvent[];
  lastUpdated: string;
}

export interface AIAnalysisResult {
  summary?: string;
  suggestedAction?: string;
}
