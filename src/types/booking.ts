export interface Location {
    branch: number;
    floor: number;
    roomNo: string;
    seatNo: string;
    roomId?: string;
    isAc?: boolean;
    branchName?: string;
}

export interface Slot {
    id: string;
    time: string;
    available: boolean;
    price: number;
    durationDays: number;
    effectiveWeeks?: number;
}

export interface Seat {
    id: string;
    seatNo: string;
    available: boolean;
    isBlocked?: boolean;
    label?: string; // Custom label, e.g., "95"
    blockInfo?: {
        name: string;
        phone: string;
        startDate: string;
        endDate: string;
        bookedAt: string;
    };
}

export interface RoomElement {
    id?: number;
    roomId: string;
    type: 'wall' | 'entrance';
    gridRow: number;
    gridCol: number;
    side: string;
}

export interface SeatPosition {
    seatId: string;
    gridRow: number;
    gridCol: number;
}

export interface RoomLayout {
    gridCols: number;
    gridRows: number;
    seatPositions: SeatPosition[];
    elements: RoomElement[];
}

export interface Room {
    id: string;
    roomNo: string;
    name: string;
    seats: Seat[];
    isAc: boolean;
    seatsCount?: number;
    seatsFrom?: number;
    seatsTo?: number;
    price_daily?: number;
    pricing_tiers?: PricingConfig;
}

export interface Floor {
    id?: string;
    floorNumber: number;
    rooms: Room[];
}

export interface Branch {
    id: number;
    name: string;
    address: string;
    mapsUrl?: string;
    floors: Floor[];
}

export interface BookingDetails {
    name?: string;
    phone?: string;
    email?: string;
    slotId?: string;
    slotTime?: string;
    slotDate?: string;
    location?: Location;
    amount?: number;
    paymentScreenshotUrl?: string;
    id?: string;
}

export interface BookingResponse {
    id: string;
    slotId: string;
    slotTime: string;
    slotDate: string;
    startDate?: string;
    endDate?: string;
    location: Location;
    customerName?: string;
    customerPhone?: string;
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

export interface Holiday {
    id: string;
    date: string;
    branchId: number | null; // null means all branches
    reason: string;
}

export interface PricingConfig {
    price_1w: number;
    price_2w: number;
    price_3w: number;
    price_1m: number;
}

export interface PricingRule {
    branchId: number;
    isAc: boolean;
    tiers: PricingConfig;
}

export interface Announcement {
    id: string;
    message: string;
    targets: ('active' | 'pending' | 'past' | 'all')[];
    sentAt: string;
    recipientCount: number;
}
