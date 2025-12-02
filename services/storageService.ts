import { Shipment, ShipmentStatus } from '../types';

const STORAGE_KEY = 'dispatch_logistics_data';

// Seed data to populate the app if empty
const SEED_DATA: Shipment[] = [
  {
    id: '1',
    trackingNumber: 'TRK-8859201',
    sender: 'Acme Corp',
    recipient: 'John Doe',
    origin: 'New York, NY',
    destination: 'Austin, TX',
    currentStatus: ShipmentStatus.IN_TRANSIT,
    estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    events: [
      {
        id: 'e1',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        location: 'New York, NY',
        status: ShipmentStatus.CREATED,
        description: 'Shipment label created.',
      },
      {
        id: 'e2',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        location: 'New York, NY',
        status: ShipmentStatus.PICKED_UP,
        description: 'Package received by carrier.',
      },
      {
        id: 'e3',
        timestamp: new Date().toISOString(),
        location: 'Philadelphia, PA',
        status: ShipmentStatus.IN_TRANSIT,
        description: 'Arrived at distribution center.',
      },
    ],
  },
  {
    id: '2',
    trackingNumber: 'TRK-1123581',
    sender: 'Tech Solutions Ltd',
    recipient: 'Sarah Smith',
    origin: 'San Francisco, CA',
    destination: 'Seattle, WA',
    currentStatus: ShipmentStatus.DELIVERED,
    estimatedDelivery: new Date(Date.now() - 43200000).toISOString(),
    lastUpdated: new Date().toISOString(),
    events: [
      {
        id: 'e4',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        location: 'San Francisco, CA',
        status: ShipmentStatus.PICKED_UP,
        description: 'Picked up by courier.',
      },
      {
        id: 'e5',
        timestamp: new Date(Date.now() - 43200000).toISOString(),
        location: 'Seattle, WA',
        status: ShipmentStatus.DELIVERED,
        description: 'Delivered to front porch.',
      },
    ],
  },
];

export const getShipments = (): Shipment[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(data);
};

export const getShipmentByTracking = (trackingNumber: string): Shipment | undefined => {
  const shipments = getShipments();
  return shipments.find(s => s.trackingNumber.toUpperCase() === trackingNumber.toUpperCase());
};

export const saveShipment = (shipment: Shipment): void => {
  const shipments = getShipments();
  const index = shipments.findIndex(s => s.id === shipment.id);
  if (index >= 0) {
    shipments[index] = shipment;
  } else {
    shipments.unshift(shipment); // Add to top
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
};

export const deleteShipment = (id: string): void => {
  const shipments = getShipments();
  const filtered = shipments.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
