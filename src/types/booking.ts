export interface Location {
    branch: 1 | 2;
    floor: number;
    roomNo: string;
    seatNo: string;
}

export interface Slot {
    id: string;
    time: string;
    available: boolean;
    price: number;
}

export interface Seat {
    id: string;
    seatNo: string;
    available: boolean;
}

export interface Room {
    id: string;
    roomNo: string;
    name: string;
    seats: Seat[];
}

export interface Floor {
    floorNumber: number;
    rooms: Room[];
}

export interface Branch {
    id: 1 | 2;
    name: string;
    address: string;
    floors: Floor[];
}

export interface BookingDetails {
    name: string;
    phone: string;
    email?: string;
}

export interface BookingResponse {
    id: string;
    slotId: string;
    slotTime: string;
    slotDate: string;
    location: Location;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'revoked' | 'expired';
    paymentScreenshotUrl?: string;
    createdAt: string;
}

export interface PaymentResponse {
    success: boolean;
    transactionId?: string;
    message: string;
}

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

// Admin types
export interface DashboardStats {
    totalBookings: number;
    activeBookings: number;
    totalRevenue: number;
    pendingApprovals: number;
    monthlyBookings: { month: string; count: number }[];
}
