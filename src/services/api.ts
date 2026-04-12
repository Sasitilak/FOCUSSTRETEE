import { supabase, isSupabaseConfigured } from '../lib/supabase';
import dayjs from 'dayjs';
import type { Slot, Branch, BookingDetails, BookingResponse, Location, DashboardStats, Holiday, PricingRule, PricingConfig, Announcement, Floor, Room, Seat, RoomElement, SeatPosition } from '../types/booking';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Mock data (used when Supabase keys aren't set yet) ─────────

const mockBranches: Branch[] = [
    {
        id: 1, name: 'Branch 1 — Koramangala', address: '4th Block, Koramangala',
        floors: [
            {
                floorNumber: 1,
                rooms: [
                    {
                        id: 'b1f1r1', roomNo: 'M1', name: 'Main Office', isAc: true, price_daily: 80,
                        seats: [
                            ...[95, 96, 97, 98, 94, 93, 92, 103, 101, 100, 99, 104, 105, 106, 107].map(n => ({ id: `b1f1s${n}`, seatNo: `${n}`, available: true })),
                            ...Array.from({ length: 40 }).map((_, i) => ({ id: `b1f1s${108 + i}`, seatNo: `${108 + i}`, available: true })),
                            ...[78, 77, 76, 79, 80, 81].map(num => ({ id: `b1f1s${num}`, seatNo: `${num}`, available: true })),
                            ...[91, 90, 89, 88, 87, 86, 85].map(n => ({ id: `b1f1s${n}`, seatNo: `${n}`, available: true })),
                        ]
                    }
                ]
            },
            {
                floorNumber: 2,
                rooms: [
                    { id: 'b1f2r1', roomNo: 'R1', name: 'Lounge', isAc: false, price_daily: 50, seats: [...Array(7)].map((_, i) => ({ id: `b1f2s${49 + i}`, seatNo: `${49 + i}`, available: true })) },
                    { id: 'b1f2r2', roomNo: 'R2', name: 'Private Zone A', isAc: false, price_daily: 50, seats: [...Array(4)].map((_, i) => ({ id: `b1f2s${45 + i}`, seatNo: `${45 + i}`, available: true })) },
                    { id: 'b1f2r3', roomNo: 'R3', name: 'Private Zone B', isAc: false, price_daily: 50, seats: [...Array(4)].map((_, i) => ({ id: `b1f2s${41 + i}`, seatNo: `${41 + i}`, available: true })) },
                    { id: 'b1f2r4', roomNo: 'R4', name: 'Main Deck A', isAc: false, price_daily: 50, seats: [...Array(20)].map((_, i) => ({ id: `b1f2s${21 + i}`, seatNo: `${21 + i}`, available: true })) },
                    { id: 'b1f2r5', roomNo: 'R5', name: 'Main Deck B', isAc: false, price_daily: 50, seats: [...Array(20)].map((_, i) => ({ id: `b1f2s${1 + i}`, seatNo: `${1 + i}`, available: true })) },
                    { id: 'b1f2r6', roomNo: 'R6', name: 'Open Space', isAc: false, price_daily: 50, seats: [...Array(17)].map((_, i) => ({ id: `b1f2s${56 + i}`, seatNo: `${56 + i}`, available: true })) },
                ]
            },
        ],
    },
    {
        id: 2, name: 'Branch 2 — Indiranagar', address: '100 Feet Road, Indiranagar',
        floors: [
            {
                floorNumber: 1,
                rooms: [
                    { id: 'b2f1r1', roomNo: 'R1', name: 'Common Floor', isAc: true, price_daily: 90, seats: [...Array(28)].map((_, i) => ({ id: `b2f1s${i + 1}`, seatNo: `${i + 1}`, available: true })) },
                    { id: 'b2f1r2', roomNo: 'R2', name: 'LADIES SECTION (A)', isAc: true, price_daily: 90, seats: [...Array(7)].map((_, i) => ({ id: `b2f1s${i + 29}`, seatNo: `${i + 29}`, available: true })) },
                    { id: 'b2f1r3', roomNo: 'R3', name: 'LADIES SECTION (B)', isAc: true, price_daily: 90, seats: [...Array(17)].map((_, i) => ({ id: `b2f1s${i + 36}`, seatNo: `${i + 36}`, available: true })) },
                ]
            },
            {
                floorNumber: 2,
                rooms: [
                    { id: 'b2f2r1', roomNo: 'R1', name: 'Main Floor', isAc: true, price_daily: 90, seats: [...Array(95)].map((_, i) => ({ id: `b2f2s${i + 1}`, seatNo: `${i + 1}`, available: i % 5 !== 0 })) },
                ]
            },
            {
                floorNumber: 3,
                rooms: [
                    { id: 'b2f3r1', roomNo: 'R1', name: 'Rooftop Hall', isAc: false, price_daily: 60, seats: [...Array(15)].map((_, i) => ({ id: `b2f3s${i + 1}`, seatNo: `${i + 1}`, available: true })) },
                ]
            },
        ],
    },
];

const mockSlots: Slot[] = [
    { id: 'slot-1w', time: '1 Week', available: true, price: 350, durationDays: 7 },
    { id: 'slot-2w', time: '2 Weeks', available: true, price: 600, durationDays: 14 },
    { id: 'slot-1m', time: '1 Month', available: true, price: 1000, durationDays: 30 },
    { id: 'slot-3m', time: '3 Months', available: true, price: 2700, durationDays: 90 },
];

let mockBookings: BookingResponse[] = [
    { id: 'BK1001', slotId: 's1', slotTime: '1 Month', slotDate: '2026-02-14', location: { branch: 1, floor: 1, roomNo: 'F1', seatNo: 'S3', isAc: true }, customerName: 'Arun Kumar', customerPhone: '+91 9876543210', amount: 1000, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T08:30:00Z' },
    { id: 'BK1002', slotId: 's2', slotTime: '2 Weeks', slotDate: '2026-02-14', location: { branch: 2, floor: 2, roomNo: 'F2', seatNo: 'S7', isAc: true }, customerName: 'Priya Sharma', customerPhone: '+91 9123456780', amount: 600, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T09:15:00Z' },
    { id: 'BK1003', slotId: 's3', slotTime: '1 Month', slotDate: '2026-02-13', location: { branch: 1, floor: 2, roomNo: 'F2', seatNo: 'S1', isAc: false }, customerName: 'Ravi Patel', customerPhone: '+91 9988776655', amount: 1000, status: 'confirmed', createdAt: '2026-02-13T07:00:00Z' },
    { id: 'BK1004', slotId: 's4', slotTime: '3 Months', slotDate: '2026-02-12', location: { branch: 2, floor: 3, roomNo: 'F3', seatNo: 'S2', isAc: false }, customerName: 'Sneha Reddy', customerPhone: '+91 9090909090', amount: 2700, status: 'confirmed', createdAt: '2026-02-12T14:00:00Z' },
    { id: 'BK1005', slotId: 's5', slotTime: '1 Week', slotDate: '2026-02-11', location: { branch: 1, floor: 1, roomNo: 'F1', seatNo: 'S10', isAc: true }, customerName: 'Vikram Singh', customerPhone: '+91 8080808080', amount: 350, status: 'rejected', createdAt: '2026-02-11T06:45:00Z' },
    { id: 'BK1006', slotId: 's6', slotTime: '1 Month', slotDate: '2026-02-14', location: { branch: 2, floor: 1, roomNo: 'F1', seatNo: 'S15', isAc: true }, customerName: 'Meera Nair', customerPhone: '+91 7070707070', amount: 1000, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T10:30:00Z' },
];

let mockHolidays: Holiday[] = [
    { id: 'h1', date: '2026-08-15', branchId: null, reason: 'Independence Day' },
    { id: 'h2', date: '2026-01-26', branchId: null, reason: 'Republic Day' },
];

let mockPricingRules: PricingRule[] = [
    {
        branchId: 1, isAc: true, tiers: { price_1w: 700, price_2w: 1350, price_3w: 2000, price_1m: 2600 }
    },
    {
        branchId: 1, isAc: false, tiers: { price_1w: 500, price_2w: 950, price_3w: 1400, price_1m: 1800 }
    },
    {
        branchId: 2, isAc: true, tiers: { price_1w: 800, price_2w: 1550, price_3w: 2300, price_1m: 3000 }
    },
    {
        branchId: 2, isAc: false, tiers: { price_1w: 600, price_2w: 1150, price_3w: 1700, price_1m: 2200 }
    },
];

let mockAnnouncements: Announcement[] = [
    { id: 'a1', message: 'Welcome to StudySpot!', targets: ['all'], sentAt: '2026-01-01T10:00:00Z', recipientCount: 150 },
];

// ─── Public APIs ────────────────────────────────────────────────

export const getSlots = async (dailyRate?: number): Promise<Slot[]> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        if (dailyRate !== undefined) {
            return mockSlots.map(s => {
                return { ...s, price: s.durationDays * dailyRate };
            });
        }
        // If no rate provided (e.g. browsing before selection), return base prices or 0
        return mockSlots;
    }

    const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('is_active', true)
        .order('duration_days');

    if (error) throw error;

    return (data || []).map(s => ({
        id: s.id,
        time: s.name,
        available: true,
        price: dailyRate ? (s.duration_days * dailyRate) : 0,
        durationDays: s.duration_days,
    }));
};

export const uploadReceipt = async (file: File): Promise<string> => {
    if (!isSupabaseConfigured()) {
        await delay(1000);
        return URL.createObjectURL(file); // Fallback mock
    }

    const { data, error } = await supabase.storage
        .from('receipts')
        .upload(`${Date.now()}_${file.name}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(data.path);

    return publicUrl;
};



export const getBranches = async (): Promise<Branch[]> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        // Filter out seats that have active/pending bookings for "today" or future
        const allBranches = JSON.parse(JSON.stringify(mockBranches)) as Branch[];
        allBranches.forEach(b => {
            b.floors.forEach(f => {
                f.rooms.forEach(r => {
                    r.seats.forEach(s => {
                        const isBooked = mockBookings.some(booking =>
                            booking.location.branch === b.id &&
                            booking.location.floor === f.floorNumber &&
                            booking.location.roomNo === r.roomNo &&
                            booking.location.seatNo === s.seatNo &&
                            ['confirmed', 'pending'].includes(booking.status) &&
                            dayjs(booking.slotDate).isAfter(dayjs().subtract(1, 'day'))
                        );
                        if (isBooked) s.available = false;
                    });
                });
            });
        });
        return allBranches;
    }

    // Fetch branches, floors, and available seats — check errors
    const { data: branchData, error: branchError } = await supabase.from('branches').select('*').order('id');
    if (branchError) throw new Error(`Failed to fetch branches: ${branchError.message}`);

    const { data: floorData, error: floorError } = await supabase.from('floors').select('*').order('floor_number');
    if (floorError) throw new Error(`Failed to fetch floors: ${floorError.message}`);

    // Update: fetch 'rooms' to get is_ac and price
    const { data: roomData, error: roomError } = await supabase.from('rooms').select('*');
    if (roomError) throw new Error(`Failed to fetch rooms: ${roomError.message}`);

    const { data: seatData, error: seatError } = await supabase.from('available_seats').select('*');
    if (seatError) throw new Error(`Failed to fetch seats: ${seatError.message}`);

    // Fetch active bookings (confirmed/pending) to mark seats as occupied
    const today = dayjs().format('YYYY-MM-DD');
    const { data: activeBookings } = await supabase
        .from('bookings')
        .select('seat_id, status, end_date')
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', today);
    const bookedSeatIds = new Set((activeBookings || []).map(b => b.seat_id));

    if (!branchData || !floorData || !roomData || !seatData) return [];

    return branchData.map(b => ({
        id: b.id,
        name: b.name,
        address: b.address,
        mapsUrl: b.maps_url || undefined,
        floors: floorData
            .filter(f => f.branch_id === b.id)
            .map(f => ({
                floorNumber: f.floor_number,
                rooms: roomData
                    .filter(r => r.floor_id === f.id)
                    .map(r => ({
                        id: r.id,
                        roomNo: r.room_no,
                        name: r.name || `Room ${r.room_no}`,
                        isAc: r.is_ac,
                        price_daily: r.price_daily,
                        pricing_tiers: r.pricing_tiers,
                        seats: seatData
                            .filter(s => s.room_id === r.id)
                            .map(s => ({
                                id: String(s.id),
                                seatNo: s.seat_no,
                                available: s.is_available && !bookedSeatIds.has(s.id),
                                isLadies: s.is_ladies ?? false,
                            })),
                    })),
            })),
    }));
};


// Helper for location text formatting
const formatLocationText = (booking: any) => {
    try {
        const b = booking.floors?.branches?.name || "AcumenHive Branch";
        const f = booking.floors?.floor_number || "?";
        const r = booking.seats?.rooms?.name || booking.seats?.rooms?.room_no || "?";
        const s = booking.seats?.seat_no || "?";
        return `${b}, Floor ${f}, ${r}, Seat ${s}`;
    } catch {
        return "AcumenHive Spot";
    }
};

export const createBooking = async (details: BookingDetails): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(800);

        if (!details.location) throw new Error("Location is required for booking");

        const newBooking: BookingResponse = {
            id: `BK${1000 + mockBookings.length + 1}`,
            slotId: details.slotId || '',
            slotTime: details.slotTime || '',
            slotDate: details.slotDate || '',
            location: details.location,
            customerName: details.name,
            customerPhone: details.phone,
            customerEmail: details.email,
            amount: details.amount || 0,
            status: 'pending',
            paymentScreenshotUrl: details.paymentScreenshotUrl,
            createdAt: new Date().toISOString(),
        };

        // If there's an existing temporary/pending booking for this seat, overwrite it
        const existingIdx = mockBookings.findIndex(b =>
            b.location.branch === details.location!.branch &&
            b.location.floor === details.location!.floor &&
            b.location.roomNo === details.location!.roomNo &&
            b.location.seatNo === details.location!.seatNo &&
            b.status === 'pending'
        );

        if (existingIdx !== -1) {
            mockBookings[existingIdx] = { ...newBooking, id: mockBookings[existingIdx].id };
            return mockBookings[existingIdx];
        }

        mockBookings.push(newBooking);
        return newBooking;
    }

    if (!details.location || !details.slotId || !details.slotDate || details.amount === undefined) {
        throw new Error("Missing required booking details for real database insertion.");
    }

    // Use provided ID or generate a robust one using the utility
    const bookingId = details.id || generateShortBookingId();

    const { location, slotId, slotDate } = details as { location: Location; slotId: string; slotDate: string };

    // 1. Resolve Floor
    const { data: floorRow, error: floorError } = await supabase
        .from('floors')
        .select('id')
        .eq('branch_id', location.branch)
        .eq('floor_number', location.floor)
        .maybeSingle(); // Use maybeSingle to avoid PGRST116

    if (floorError || !floorRow) throw new Error(`Floor not found for branch ${location.branch}, floor ${location.floor}`);

    // 2. Resolve Room
    let roomRow;
    if (location.roomId) {
        const { data, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('id', location.roomId)
            .maybeSingle();
        roomRow = data;
        if (error) throw error;
    }

    if (!roomRow) {
        const { data, error } = await supabase
            .from('rooms')
            .select('id')
            .eq('floor_id', floorRow.id)
            .eq('room_no', location.roomNo)
            .maybeSingle();
        roomRow = data;
        if (error || !roomRow) throw new Error(`Room '${location.roomNo}' not found on floor ${location.floor}`);
    }

    // 3. Resolve Seat
    const { data: seatRow, error: seatError } = await supabase
        .from('seats')
        .select('id')
        .eq('room_id', roomRow.id)
        .eq('seat_no', location.seatNo)
        .maybeSingle();
    if (seatError || !seatRow) throw new Error(`Seat '${location.seatNo}' not found in room ${location.roomNo}`);

    // Get slot info (optional for custom dates)
    const { data: slotRow } = await supabase.from('slots').select('*').eq('id', slotId).maybeSingle();
    // If slot not found, only proceed if we have explicit dates (e.g. custom range)
    if (!slotRow && !slotDate.includes(' to ')) {
        throw new Error(`Slot '${slotId}' not found and no date range provided`);
    }

    // Parse dates — use UTC-safe date-only math
    let startDate = slotDate;
    let endDate = slotDate;
    if (slotDate.includes(' to ')) {
        const parts = slotDate.split(' to ');
        startDate = parts[0];
        endDate = parts[1];
    } else if (slotRow) {
        const [year, month, day] = slotDate.split('-').map(Number);
        const startMs = Date.UTC(year, month - 1, day);
        const endMs = startMs + (slotRow.duration_days ?? 30) * 86_400_000;
        const endDt = new Date(endMs);
        endDate = `${endDt.getUTCFullYear()}-${String(endDt.getUTCMonth() + 1).padStart(2, '0')}-${String(endDt.getUTCDate()).padStart(2, '0')}`;
    } else {
        // Should not happen due to check above
        throw new Error("Invalid slot configuration");
    }

    // 4. Double-check availability for the specific dates to prevent race conditions
    const { data: overlapping, error: overlapError } = await supabase
        .from('bookings')
        .select('id')
        .eq('seat_id', seatRow.id)
        .in('status', ['confirmed', 'pending'])
        .or(`and(start_date.lte."${endDate}",end_date.gte."${startDate}")`)
        .maybeSingle();

    if (overlapError) throw overlapError;
    if (overlapping) {
        throw new Error("This seat has just been booked by someone else for these dates. Please go back and select another seat.");
    }

    // Insert booking with generated ID
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
            id: bookingId,
            customer_name: details.name,
            customer_phone: details.phone,
            customer_email: details.email || null,
            slot_id: slotRow ? slotId : null,
            branch_id: location.branch,
            floor_id: floorRow.id,
            seat_id: seatRow.id,
            start_date: startDate,
            end_date: endDate,
            amount: details.amount,
            payment_screenshot_url: details.paymentScreenshotUrl || null,
            status: 'pending',
        })
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))')
        .single();

    if (error) throw error;

    // Trigger WhatsApp: Pending for User & Alert for Admins
    const locText = formatLocationText(booking);

    // 1. Send PENDING to USER
    supabase.functions.invoke('send-whatsapp', {
        body: { booking, template: 'booking_pending', locationText: locText }
    }).catch(e => console.error("WhatsApp Pending Notification failed:", e));

    // 2. Fetch admins and notify them
    supabase.from('admins').select('phone').then(({ data: admins }) => {
        admins?.forEach(adm => {
            supabase.functions.invoke('send-whatsapp', {
                body: { booking, template: 'admin_booking_alert', phone: adm.phone, locationText: locText }
            }).catch(e => console.error(`Admin Alert failed for ${adm.phone}:`, e));
        });
    });

    return mapBookingRow(booking);
};



export const createAdminBooking = async (details: Partial<BookingDetails>, location: Location, startDate: string, endDate: string): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(800);
        const newB: BookingResponse = {
            id: `BK${1000 + mockBookings.length + 1}`,
            slotId: details.slotId || 'admin',
            slotTime: details.slotTime || 'Full Day',
            slotDate: startDate,
            location,
            customerName: details.name || 'Admin',
            customerPhone: details.phone || '',
            customerEmail: details.email,
            amount: details.amount || 0,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
        };
        mockBookings.unshift(newB);
        return newB;
    }

    // Generate robust Booking ID
    const bookingId = generateShortBookingId();

    // Resolve location IDs (Branch -> Floor -> Room -> Seat)
    // 1. Resolve Floor
    const { data: floorRow } = await supabase
        .from('floors').select('id')
        .eq('branch_id', location.branch).eq('floor_number', location.floor).maybeSingle();
    if (!floorRow) throw new Error(`Floor not found`);

    // 2. Resolve Room — try roomId first, then room_no, then room name
    let roomRow = null;
    if (location.roomId) {
        const { data } = await supabase.from('rooms').select('id').eq('id', location.roomId).maybeSingle();
        roomRow = data;
    }
    if (!roomRow && location.roomNo) {
        // Try by room_no first, then by name
        const { data } = await supabase.from('rooms').select('id').eq('floor_id', floorRow.id).eq('room_no', location.roomNo).maybeSingle();
        roomRow = data;
        if (!roomRow) {
            const { data: byName } = await supabase.from('rooms').select('id').eq('floor_id', floorRow.id).eq('name', location.roomNo).maybeSingle();
            roomRow = byName;
        }
    }
    if (!roomRow) throw new Error(`Room not found`);

    // 3. Resolve Seat
    const { data: seatRow } = await supabase
        .from('seats').select('id')
        .eq('room_id', roomRow.id).eq('seat_no', location.seatNo).maybeSingle();
    if (!seatRow) throw new Error(`Seat not found`);

    // Real Supabase: similar to createBooking but with manual dates and status='confirmed'
    const { data, error } = await supabase.from('bookings').insert({
        id: bookingId,
        customer_name: details.name,
        customer_phone: details.phone,
        customer_email: details.email || null,
        branch_id: location.branch,
        floor_id: floorRow.id,
        seat_id: seatRow.id,
        // slot_id is optional but good to have if possible, or null.
        // If specific slot is needed, passed in details.slotId?
        // Admin might not select a slot, just dates.
        slot_id: details.slotId || null,
        start_date: startDate,
        end_date: endDate,
        status: 'confirmed',
        amount: details.amount || 0,
    }).select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))').single();

    if (error) throw error;

    // Trigger WhatsApp Notification (Edge Function) for Admin Booking
    const locText = formatLocationText(data);
    supabase.functions.invoke('send-whatsapp', {
        body: { booking: data, template: 'booking_confirmed', locationText: locText }
    }).then(({ error: waErr }) => {
        if (waErr) console.error("Admin Booking WhatsApp failed:", waErr);
    });

    return mapBookingRow(data);
};

export const getBooking = async (id: string): Promise<BookingResponse | null> => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        return mockBookings.find(b => b.id === id) ?? null;
    }
    const { data, error } = await supabase.from('bookings').select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))').eq('id', id).maybeSingle();
    if (error) throw new Error(`getBooking: ${error.message}`);
    if (!data) return null;
    return mapBookingRow(data);
};

// ─── Admin APIs ─────────────────────────────────────────────────

export const getAdminBookings = async (): Promise<BookingResponse[]> => {
    if (!isSupabaseConfigured()) { await delay(500); return mockBookings; }

    const { data, error } = await supabase
        .from('bookings')
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapBookingRow);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        return {
            totalBookings: 156, activeBookings: 42, totalRevenue: 11700, pendingApprovals: 3,
            monthlyBookings: [
                { month: 'Sep', count: 18 }, { month: 'Oct', count: 24 },
                { month: 'Nov', count: 31 }, { month: 'Dec', count: 28 },
                { month: 'Jan', count: 35 }, { month: 'Feb', count: 20 },
            ],
        };
    }

    const { data: bookings, error } = await supabase.from('bookings').select('status, amount, created_at');
    if (error) throw new Error(`getDashboardStats: ${error.message}`);
    const all = bookings ?? [];

    const totalBookings = all.length;
    const activeBookings = all.filter(b => b.status === 'confirmed').length;
    const totalRevenue = all.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);
    const pendingApprovals = all.filter(b => b.status === 'pending').length;

    // Monthly breakdown (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyBookings = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const count = all.filter(b => {
            const bd = new Date(b.created_at);
            return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
        }).length;
        return { month: months[d.getMonth()], count };
    });

    return { totalBookings, activeBookings, totalRevenue, pendingApprovals, monthlyBookings };
};

export const approveBooking = async (bookingId: string): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const b = mockBookings.find(b => b.id === bookingId);
        if (!b) throw new Error(`Mock booking not found: ${bookingId}`);
        return { ...b, status: 'confirmed' };
    }

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))') // Select relation data for template
        .single();

    if (error) throw error;

    // Trigger WhatsApp Notification: CONFIRMED
    const locText = formatLocationText(data);
    supabase.functions.invoke('send-whatsapp', {
        body: { booking: data, template: 'booking_confirmed', locationText: locText }
    }).then(({ error }) => {
        if (error) console.error("Failed to send WhatsApp Confirmation:", error);
    });

    return mapBookingRow(data);
};

export const rejectBooking = async (bookingId: string): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const b = mockBookings.find(b => b.id === bookingId);
        if (!b) throw new Error(`Mock booking not found: ${bookingId}`);
        return { ...b, status: 'rejected' };
    }

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'rejected' })
        .eq('id', bookingId)
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))')
        .single();

    if (error) throw error;

    // Trigger WhatsApp Notification: REJECTED
    const locText = formatLocationText(data);
    supabase.functions.invoke('send-whatsapp', {
        body: { booking: data, template: 'booking_rejected', locationText: locText }
    }).then(({ error }) => {
        if (error) console.error("Failed to send WhatsApp Rejection:", error);
    });

    // Automatically unblock the seat if rejected
    if (data?.seat_id) {
        await unblockSeat(data.seat_id).catch(err => console.error("Auto-unblock failed:", err));
    }

    return mapBookingRow(data);
};

export const revokeBooking = async (bookingId: string): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const b = mockBookings.find(b => b.id === bookingId);
        if (!b) throw new Error(`Mock booking not found: ${bookingId}`);
        return { ...b, status: 'revoked' as BookingResponse['status'] };
    }

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'revoked' })
        .eq('id', bookingId)
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))')
        .single();

    if (error) throw error;

    // Automatically unblock the seat if revoked
    if (data?.seat_id) {
        await unblockSeat(data.seat_id).catch(err => console.error("Auto-unblock failed:", err));
    }

    return mapBookingRow(data);
};

export const expireBooking = async (bookingId: string): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const b = mockBookings.find(b => b.id === bookingId);
        if (!b) throw new Error(`Mock booking not found: ${bookingId}`);
        return { ...b, status: 'expired' as BookingResponse['status'] };
    }

    const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'expired' })
        .eq('id', bookingId)
        .select('*, floors(floor_number, branches(name)), seats(seat_no, rooms(name, room_no))')
        .single();

    if (error) throw error;

    // Automatically unblock the seat if expired
    if (data?.seat_id) {
        await unblockSeat(data.seat_id).catch(err => console.error("Auto-unblock failed:", err));
    }

    return mapBookingRow(data);
};

// ─── Admin: Seat Management ─────────────────────────────────────

export const getAdminSeats = async (): Promise<any[]> => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        return mockBranches.flatMap(b =>
            b.floors.flatMap(f =>
                f.rooms.flatMap(r =>
                    r.seats.map(s => ({
                        id: Number(s.id.replace(/\D/g, '')),
                        seat_no: s.seatNo,
                        is_blocked: !s.available,
                        floor_id: 0,
                        branch_id: b.id,
                        floor_number: f.floorNumber,
                        branch_name: b.name,
                        is_ac: r.isAc,
                        room_name: r.name,
                        room_no: r.roomNo,
                        price_daily: r.price_daily || 0,
                        pricing_tiers: r.pricing_tiers || { price_1w: 500, price_2w: 900, price_3w: 1200, price_1m: 1500 },
                    }))
                )
            )
        );
    }

    const { data, error } = await supabase
        .from('seats')
        .select('id, seat_no, is_blocked, is_ladies, room_id, rooms(floor_id, is_ac, name, room_no, price_daily, pricing_tiers, floors(branch_id, floor_number, branches(name)))')
        .order('id');

    if (error) throw new Error(`getAdminSeats failed: ${error.message}`);

    return (data ?? []).map((s: Record<string, unknown>) => {
        const room = s.rooms as Record<string, unknown> | null;
        const floor = room?.floors as Record<string, unknown> | null;
        const branch = floor?.branches as Record<string, unknown> | null;
        return {
            id: s.id as number,
            seat_no: s.seat_no as string,
            is_blocked: s.is_blocked as boolean,
            room_id: (s.room_id ?? '') as string,
            floor_id: (room?.floor_id ?? 0) as number,
            branch_id: (floor?.branch_id ?? 0) as number,
            floor_number: (floor?.floor_number ?? 0) as number,
            branch_name: (branch?.name ?? '') as string,
            is_ac: (room?.is_ac as boolean) ?? false,
            room_name: (room?.name ?? 'Main Floor') as string,
            room_no: (room?.room_no ?? '') as string,
            is_ladies: (s.is_ladies as boolean) ?? false,
            price_daily: (room?.price_daily ?? 50) as number,
            pricing_tiers: (room?.pricing_tiers as any) ?? { price_1w: 500, price_2w: 900, price_3w: 1200, price_1m: 1500 },
        };
    });
};

export const blockSeat = async (id: number) => {
    if (!isSupabaseConfigured()) { await delay(300); return; }
    const { error } = await supabase.from('seats').update({ is_blocked: true }).eq('id', id);
    if (error) throw new Error(`blockSeat failed: ${error.message}`);
};

export const unblockSeat = async (id: number) => {
    if (!isSupabaseConfigured()) { await delay(300); return; }
    const { error } = await supabase.from('seats').update({ is_blocked: false }).eq('id', id);
    if (error) throw new Error(`unblockSeat failed: ${error.message}`);
};


// ─── Admin: Room Layout ──────────────────────────────────────────

export const getRoomLayout = async (roomId: string): Promise<{
    gridCols: number;
    gridRows: number;
    seatPositions: SeatPosition[];
    elements: RoomElement[];
}> => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        return { gridCols: 0, gridRows: 0, seatPositions: [], elements: [] };
    }

    const { data: elemData, error: elemError } = await supabase
        .from('room_elements')
        .select('*')
        .eq('room_id', roomId);
    if (elemError) throw elemError;

    const rows = elemData || [];

    // Parse config entry (type='config')
    const configRow = rows.find((e: any) => e.type === 'config');
    const gridCols = configRow?.grid_col || 0;
    const gridRows = configRow?.grid_row || 0;

    // Parse seat positions (type='seat', seat_id stored in 'side' column)
    const seatPositions: SeatPosition[] = rows
        .filter((e: any) => e.type === 'seat')
        .map((e: any) => ({
            seatId: e.side, // seat ID stored in the side column
            gridRow: e.grid_row,
            gridCol: e.grid_col,
        }));

    // Parse wall & entrance elements
    const elements: RoomElement[] = rows
        .filter((e: any) => e.type === 'wall' || e.type === 'entrance')
        .map((e: any) => ({
            id: e.id,
            roomId: e.room_id,
            type: e.type,
            gridRow: e.grid_row,
            gridCol: e.grid_col,
            side: e.side,
        }));

    return { gridCols, gridRows, seatPositions, elements };
};

export type RoomLayoutData = {
    gridCols: number;
    gridRows: number;
    seatPositions: SeatPosition[];
    elements: RoomElement[];
};

export const getRoomLayoutsBatch = async (roomIds: string[]): Promise<Map<string, RoomLayoutData>> => {
    const result = new Map<string, RoomLayoutData>();
    if (roomIds.length === 0) return result;

    if (!isSupabaseConfigured()) {
        await delay(300);
        roomIds.forEach(id => result.set(id, { gridCols: 0, gridRows: 0, seatPositions: [], elements: [] }));
        return result;
    }

    const { data, error } = await supabase
        .from('room_elements')
        .select('*')
        .in('room_id', roomIds);
    if (error) throw error;

    const rows = data || [];

    roomIds.forEach(roomId => {
        const roomRows = rows.filter((e: any) => e.room_id === roomId);
        const configRow = roomRows.find((e: any) => e.type === 'config');
        const gridCols = configRow?.grid_col || 0;
        const gridRows = configRow?.grid_row || 0;

        const seatPositions: SeatPosition[] = roomRows
            .filter((e: any) => e.type === 'seat')
            .map((e: any) => ({ seatId: e.side, gridRow: e.grid_row, gridCol: e.grid_col }));

        const elements: RoomElement[] = roomRows
            .filter((e: any) => e.type === 'wall' || e.type === 'entrance')
            .map((e: any) => ({ id: e.id, roomId: e.room_id, type: e.type, gridRow: e.grid_row, gridCol: e.grid_col, side: e.side }));

        result.set(roomId, { gridCols, gridRows, seatPositions, elements });
    });

    return result;
};

export const saveRoomLayout = async (
    roomId: string,
    gridCols: number,
    gridRows: number,
    seatPositions: SeatPosition[],
    elements: Omit<RoomElement, 'id' | 'roomId'>[]
): Promise<void> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        return;
    }

    // Delete all existing layout data for this room
    const { error: delErr } = await supabase
        .from('room_elements')
        .delete()
        .eq('room_id', roomId);
    if (delErr) throw delErr;

    // Build all rows to insert
    const allRows: any[] = [];

    // 1. Config row — store grid dimensions
    allRows.push({
        room_id: roomId,
        type: 'config',
        grid_row: gridRows,
        grid_col: gridCols,
        side: '',
    });

    // 2. Seat position rows — seat ID stored in 'side' column
    for (const sp of seatPositions) {
        allRows.push({
            room_id: roomId,
            type: 'seat',
            grid_row: sp.gridRow,
            grid_col: sp.gridCol,
            side: sp.seatId,
        });
    }

    // 3. Wall & entrance rows
    for (const e of elements) {
        allRows.push({
            room_id: roomId,
            type: e.type,
            grid_row: e.gridRow,
            grid_col: e.gridCol,
            side: e.side,
        });
    }

    if (allRows.length > 0) {
        const { error: insErr } = await supabase
            .from('room_elements')
            .insert(allRows);
        if (insErr) throw insErr;
    }
};

// ─── Admin: Holidays ─────────────────────────────────────────────

export const getHolidays = async (): Promise<Holiday[]> => {
    if (!isSupabaseConfigured()) { await delay(300); return mockHolidays; }
    const { data, error } = await supabase.from('holidays').select('*').order('date');
    if (error) throw error;
    return data ?? [];
};

export const addHoliday = async (date: string, branchId: number | null, reason: string): Promise<Holiday> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        const newH = { id: `h${Date.now()}`, date, branchId, reason };
        mockHolidays.push(newH);
        return newH;
    }
    const { data, error } = await supabase.from('holidays').insert({ date, branch_id: branchId, reason }).select().single();
    if (error) throw error;
    return data;
};

export const deleteHoliday = async (id: string) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        mockHolidays = mockHolidays.filter(h => h.id !== id);
        return;
    }
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (error) throw error;
};

// ─── Admin: Location Management ──────────────────────────────────

/** Checks if a location has any active or pending bookings */
export const hasActiveBookings = async (branchId: number, floorNumber?: number, roomNo?: string, seatNo?: string): Promise<string[]> => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const active = mockBookings.filter(b => {
            const matchBranch = b.location.branch === branchId;
            const matchFloor = floorNumber === undefined || b.location.floor === floorNumber;
            const matchRoom = roomNo === undefined || b.location.roomNo === roomNo;
            const matchSeat = seatNo === undefined || b.location.seatNo === seatNo;
            const isFuture = dayjs(b.slotDate).isAfter(dayjs().subtract(1, 'day'));
            const isActiveStatus = ['confirmed', 'pending'].includes(b.status);
            return matchBranch && matchFloor && matchRoom && matchSeat && isFuture && isActiveStatus;
        });
        return active.map(b => `${b.id} (${b.customerName} - ${b.slotDate})`);
    }

    // Real Supabase check with Relational Filtering
    let query = supabase.from('bookings')
        .select('id, customer_name, start_date, floors!inner(floor_number), seats!inner(seat_no, rooms!inner(room_no))')
        .eq('branch_id', branchId)
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', new Date().toISOString());

    if (floorNumber !== undefined) {
        query = query.eq('floors.floor_number', floorNumber);
    }
    if (roomNo !== undefined) {
        // Filter by room_no via seats -> rooms
        query = query.eq('seats.rooms.room_no', roomNo);
    }
    if (seatNo !== undefined) {
        // Filter by seat_no via seats
        query = query.eq('seats.seat_no', seatNo);
    }

    const { data, error } = await query;
    if (error) {
        console.error("hasActiveBookings check failed", error);
        throw new Error(`Failed to check for active bookings: ${error.message}`);
    }

    return (data || []).map((b: any) => `${b.id} (${b.customer_name} - ${b.start_date})`);
};

export const addBranch = async (branch: Omit<Branch, 'id' | 'floors'>): Promise<Branch> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const newB = { ...branch, id: mockBranches.length + 1, floors: [] };
        mockBranches.push(newB);
        return newB;
    }
    const { data, error } = await supabase.from('branches').insert({
        name: branch.name,
        address: branch.address,
        maps_url: branch.mapsUrl || null,
    }).select().single();
    if (error) throw error;
    return { id: data.id, name: data.name, address: data.address, mapsUrl: data.maps_url || undefined, floors: [] };
};

export const updateBranch = async (id: number, branch: Partial<Branch>) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const idx = mockBranches.findIndex(b => b.id === id);
        if (idx !== -1) mockBranches[idx] = { ...mockBranches[idx], ...branch };
        return;
    }
    const updates: any = {};
    if (branch.name !== undefined) updates.name = branch.name;
    if (branch.address !== undefined) updates.address = branch.address;
    if (branch.mapsUrl !== undefined) updates.maps_url = branch.mapsUrl || null;
    const { error } = await supabase.from('branches').update(updates).eq('id', id);
    if (error) throw error;
};

export const deleteBranch = async (id: number) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const bookings = await hasActiveBookings(id);
        if (bookings.length > 0) {
            throw new Error(`Cannot delete branch: It has active bookings: ${bookings.join(', ')}`);
        }
        const idx = mockBranches.findIndex(b => b.id === id);
        if (idx !== -1) mockBranches.splice(idx, 1);
        return;
    }
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) throw error;
};

export const addFloor = async (branchId: number, floor: Omit<Floor, 'rooms'>): Promise<Floor> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        const branch = mockBranches.find(b => b.id === branchId);
        if (!branch) throw new Error('Branch not found');
        const newF: Floor = { ...floor, id: `f${Date.now()}`, rooms: [], floorNumber: floor.floorNumber };
        branch.floors.push(newF);
        return newF;
    }
    const { data, error } = await supabase.from('floors').insert({
        branch_id: branchId,
        floor_number: floor.floorNumber,
        // room_no/room_name are optional but if present in floor object they might be needed? 
        // The interface 'Floor' doesn't have them, only 'rooms' array.
    }).select().single();
    if (error) throw error;
    return {
        id: String(data.id),
        floorNumber: data.floor_number,
        rooms: []
    };
};

export const updateFloor = async (branchId: number, floorNumber: number, floor: Partial<Floor>) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const branch = mockBranches.find(b => b.id === branchId);
        const target = branch?.floors.find(f => f.floorNumber === floorNumber);
        if (target) Object.assign(target, floor);
        return;
    }
    const updates: any = {};
    if (floor.floorNumber !== undefined) updates.floor_number = floor.floorNumber;

    if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('floors').update(updates).eq('branch_id', branchId).eq('floor_number', floorNumber);
        if (error) throw error;
    }
};

export const deleteFloor = async (branchId: number, floorNumber: number) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const bookings = await hasActiveBookings(branchId, floorNumber);
        if (bookings.length > 0) {
            throw new Error(`Cannot delete floor: It has active bookings: ${bookings.join(', ')}`);
        }
        const branch = mockBranches.find(b => b.id === branchId);
        if (branch) branch.floors = branch.floors.filter(f => f.floorNumber !== floorNumber);
        return;
    }
    const { error } = await supabase.from('floors').delete().eq('branch_id', branchId).eq('floor_number', floorNumber);
    if (error) throw error;
};

export const addRoom = async (branchId: number, floorNumber: number, room: Omit<Room, 'seats'>): Promise<Room> => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        const floor = mockBranches.find(b => b.id === branchId)?.floors.find(f => f.floorNumber === floorNumber);
        if (!floor) throw new Error('Floor not found');

        const seats: Seat[] = [];
        const count = room.seatsCount || 0;
        for (let i = 1; i <= count; i++) {
            seats.push({ id: `${room.id}s${i}`, seatNo: `${i}`, available: true });
        }

        const newRoom: Room = { ...room, id: room.id, roomNo: room.roomNo, name: room.name, seats };
        floor.rooms.push(newRoom);
        return newRoom;
    }

    // 1. Get Floor ID
    const { data: floorRow, error: floorError } = await supabase.from('floors')
        .select('id').eq('branch_id', branchId).eq('floor_number', floorNumber).single();
    if (floorError || !floorRow) throw new Error('Floor not found');

    // 2. Insert Room
    const from = room.seatsFrom || 1;
    const to = room.seatsTo || (room.seatsCount ? from + room.seatsCount - 1 : from + 9);
    const count = (to - from + 1);

    const { data: newRoomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
            floor_id: floorRow.id,
            room_no: room.roomNo,
            name: room.name,
            is_ac: room.isAc,
            price_daily: room.price_daily || 0,
            seats_count: count,
            pricing_tiers: room.pricing_tiers || null
        })
        .select()
        .single();

    if (roomError) throw roomError;

    // 3. Insert Seats
    const seatsToInsert = [];
    for (let i = from; i <= to; i++) {
        seatsToInsert.push({
            room_id: newRoomData.id,
            seat_no: `${i}`,
            is_blocked: false
        });
    }

    if (seatsToInsert.length > 0) {
        const { error: seatError } = await supabase.from('seats').insert(seatsToInsert);
        if (seatError) throw seatError;
    }

    return {
        id: newRoomData.id,
        roomNo: newRoomData.room_no,
        name: newRoomData.name,
        isAc: newRoomData.is_ac,
        price_daily: newRoomData.price_daily,
        seats: seatsToInsert.map((s, idx) => ({
            id: `generated-${idx}`,
            seatNo: s.seat_no,
            available: true
        })),
        seatsCount: newRoomData.seats_count,
        seatsFrom: from,
        seatsTo: to
    };
};

export const updateRoom = async (branchId: number, floorNumber: number, roomId: string, updates: Partial<Room>): Promise<Room> => {
    if (!isSupabaseConfigured()) {
        await delay(500);
        const floor = mockBranches.find(b => b.id === branchId)?.floors.find(f => f.floorNumber === floorNumber);
        const room = floor?.rooms.find(r => r.id === roomId);
        if (!room) throw new Error('Room not found');

        if (updates.seatsCount !== undefined && updates.seatsCount !== room.seats.length) {
            const newCount = updates.seatsCount;
            const oldCount = room.seats.length;

            if (newCount > oldCount) {
                for (let i = oldCount + 1; i <= newCount; i++) {
                    room.seats.push({ id: `${room.id}s${i}`, seatNo: `${i}`, available: true });
                }
            } else {
                for (let i = newCount + 1; i <= oldCount; i++) {
                    const bookings = await hasActiveBookings(branchId, floorNumber, room.roomNo, `${i}`);
                    if (bookings.length > 0) {
                        throw new Error(`Cannot reduce seat count: Seat ${i} has active bookings: ${bookings.join(', ')}`);
                    }
                }
                room.seats = room.seats.slice(0, newCount);
            }
        }

        if (updates.name) room.name = updates.name;
        if (updates.roomNo) room.roomNo = updates.roomNo;
        if (updates.isAc !== undefined) room.isAc = updates.isAc;
        if (updates.price_daily !== undefined) room.price_daily = updates.price_daily;
        if (updates.pricing_tiers !== undefined) room.pricing_tiers = updates.pricing_tiers;

        return room;
    }

    // 1. Get current room with its seats
    const { data: currentRoom, error: fetchError } = await supabase
        .from('rooms')
        .select('*, seats(id, seat_no)')
        .eq('id', roomId)
        .single();

    if (fetchError || !currentRoom) throw new Error('Room not found');

    const currentSeats = (currentRoom.seats as any[]) || [];
    const currentSeatNos = currentSeats.map(s => parseInt(s.seat_no)).filter(n => !isNaN(n));
    const currentFrom = currentSeatNos.length > 0 ? Math.min(...currentSeatNos) : 1;
    const currentTo = currentSeatNos.length > 0 ? Math.max(...currentSeatNos) : 0;

    const from = updates.seatsFrom !== undefined ? updates.seatsFrom : currentFrom;
    const to = updates.seatsTo !== undefined ? updates.seatsTo : currentTo;
    const newCount = (to - from + 1);

    // 2. Prepare room field updates
    const roomUpdates: any = {};
    if (updates.name) roomUpdates.name = updates.name;
    if (updates.roomNo) roomUpdates.room_no = updates.roomNo;
    if (updates.isAc !== undefined) roomUpdates.is_ac = updates.isAc;
    if (updates.price_daily !== undefined) roomUpdates.price_daily = updates.price_daily;
    if (updates.pricing_tiers !== undefined) roomUpdates.pricing_tiers = updates.pricing_tiers;
    if (newCount !== currentRoom.seats_count) roomUpdates.seats_count = newCount;

    if (Object.keys(roomUpdates).length > 0) {
        const { error: updateErr } = await supabase.from('rooms').update(roomUpdates).eq('id', roomId);
        if (updateErr) throw updateErr;
    }

    // 3. Handle Seat Range Changes
    if (updates.seatsFrom !== undefined || updates.seatsTo !== undefined) {
        // Find seats to ADD
        const seatsToAdd = [];
        for (let i = from; i <= to; i++) {
            if (!currentSeatNos.includes(i)) {
                seatsToAdd.push({
                    room_id: roomId,
                    seat_no: `${i}`,
                    is_blocked: false
                });
            }
        }
        if (seatsToAdd.length > 0) {
            const { error: insErr } = await supabase.from('seats').insert(seatsToAdd);
            if (insErr) throw insErr;
        }

        // Find seats to REMOVE (by ID to safely nullify FK references)
        const seatsToRemove = currentSeats.filter(s => {
            const n = parseInt(s.seat_no);
            return n < from || n > to;
        });
        if (seatsToRemove.length > 0) {
            const removeIds = seatsToRemove.map(s => s.id);
            // Nullify seat_id in bookings first to avoid FK constraint violation
            await supabase.from('bookings').update({ seat_id: null }).in('seat_id', removeIds);
            const { error: delErr } = await supabase.from('seats').delete().in('id', removeIds);
            if (delErr) {
                console.error("Deletion failed:", delErr);
                throw new Error("Cannot remove seats that have active bookings or are otherwise protected.");
            }
        }
    }

    return {
        ...currentRoom,
        ...roomUpdates,
        id: roomId,
        seatsFrom: from,
        seatsTo: to,
        seatsCount: newCount
    } as Room;
};

export const deleteRoom = async (branchId: number, floorNumber: number, roomId: string) => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        const floor = mockBranches.find(b => b.id === branchId)?.floors.find(f => f.floorNumber === floorNumber);
        const room = floor?.rooms.find(r => r.id === roomId);
        if (room) {
            const bookings = await hasActiveBookings(branchId, floorNumber, room.roomNo);
            if (bookings.length > 0) {
                throw new Error(`Cannot delete room: It has active bookings: ${bookings.join(', ')}`);
            }
            floor!.rooms = floor!.rooms.filter(r => r.id !== roomId);
        }
        return;
    }
    // Get all seat IDs for this room
    const { data: roomSeats } = await supabase.from('seats').select('id').eq('room_id', roomId);
    if (roomSeats && roomSeats.length > 0) {
        const seatIds = roomSeats.map((s: any) => s.id);
        // Nullify seat_id in bookings to avoid FK constraint violation
        await supabase.from('bookings').update({ seat_id: null }).in('seat_id', seatIds);
        // Delete seats
        await supabase.from('seats').delete().eq('room_id', roomId);
    }
    // Delete room layout elements
    await supabase.from('room_elements').delete().eq('room_id', roomId);
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) throw error;
};

// ─── Admin: Pricing Rules ────────────────────────────────────────

export const getPricingRules = async (): Promise<PricingRule[]> => {
    if (!isSupabaseConfigured()) { await delay(300); return mockPricingRules; }
    const { data, error } = await supabase.from('pricing_rules').select('*');
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
        branchId: r.branch_id,
        isAc: r.is_ac,
        tiers: r.tiers || { price_1w: 0, price_2w: 0, price_3w: 0, price_1m: 0 },
    }));
};

export const updatePricingRule = async (branchId: number, isAc: boolean, tiers: PricingConfig) => {
    if (!isSupabaseConfigured()) {
        await delay(400);
        const idx = mockPricingRules.findIndex(r => r.branchId === branchId && r.isAc === isAc);
        if (idx !== -1) mockPricingRules[idx].tiers = tiers;
        else mockPricingRules.push({ branchId, isAc, tiers });
        return;
    }
    const { error } = await supabase.from('pricing_rules')
        .upsert({ branch_id: branchId, is_ac: isAc, tiers }, { onConflict: 'branch_id,is_ac' });
    if (error) throw error;
};

// ─── Admin: Announcements ────────────────────────────────────────

export const getAnnouncementHistory = async (): Promise<Announcement[]> => {
    if (!isSupabaseConfigured()) { await delay(300); return mockAnnouncements; }
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
};

export const sendBulkAnnouncement = async (message: string, targets: string[]): Promise<Announcement> => {
    if (!isSupabaseConfigured()) {
        await delay(1000);
        const newA = { id: `a${Date.now()}`, message, targets: targets as any, sentAt: new Date().toISOString(), recipientCount: 45 };
        mockAnnouncements.unshift(newA);
        console.log(`[Announce] Bulk sending to ${targets.join(', ')}: ${message}`);
        return newA;
    }
    // Real implementation: Fetch users and trigger Edge Function

    // 1. Insert record into DB
    const { data: announcement, error } = await supabase.from('announcements').insert({ message, targets }).select().single();
    if (error) throw error;

    // 2. Fetch target phone numbers
    // Note: In a real large-scale app, this should be done inside an Edge Function to avoid 
    // fetching thousands of rows to the client. For this scale, client-side orchestration is acceptable.
    const uniquePhones = new Set<string>();
    const now = new Date().toISOString();

    if (targets.includes('active')) {
        const { data } = await supabase.from('bookings').select('customer_phone')
            .eq('status', 'confirmed').gte('end_date', now);
        data?.forEach(b => uniquePhones.add(b.customer_phone));
    }
    if (targets.includes('pending')) {
        const { data } = await supabase.from('bookings').select('customer_phone')
            .eq('status', 'pending');
        data?.forEach(b => uniquePhones.add(b.customer_phone));
    }
    if (targets.includes('past')) {
        const { data } = await supabase.from('bookings').select('customer_phone')
            .eq('status', 'confirmed').lt('end_date', now);
        data?.forEach(b => uniquePhones.add(b.customer_phone));
    }

    // 3. Trigger WhatsApp for each unique phone
    const phoneList = Array.from(uniquePhones).filter(p => p && p.length >= 10);
    console.log(`[Announce] Broadcasting to ${phoneList.length} recipients: ${phoneList.join(', ')}`);

    // We fire and forget these requests to avoid blocking the UI
    phoneList.forEach(phone => {
        supabase.functions.invoke('send-whatsapp', {
            body: { phone, message }
        }).then(({ error }) => {
            if (error) console.error(`Failed to send to ${phone}`, error);
        });
    });

    // 4. Update recipient count
    await supabase.from('announcements').update({ recipient_count: phoneList.length }).eq('id', announcement.id);

    return { ...announcement, recipientCount: phoneList.length };
};





export const sendWhatsAppConfirmation = async (phone: string, message: string) => {
    // Invoke the send-whatsapp Edge Function
    // We expect the function to handle 'phone' + 'message' as a broadcast/custom message
    const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: { phone, message }
    });

    if (error) {
        console.error(`[WhatsApp] Failed to send to ${phone}`, error);
        throw error;
    }
};

// ─── System Settings (Maintenance Mode) ──────────────────────────

let mockMaintenanceMode = false;

export const checkAdminAccess = async (phone: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_admin_access', { phone_no: phone });
    if (error) {
        console.error("Error checking admin access:", error);
        return false;
    }
    return !!data;
};

// ─── Utilities ───────────────────────────────────────────────────

export const generateShortBookingId = (): string => {
    // Robust Base36 timestamp + random hash for high uniqueness
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BK-${timestamp}${random}`;
};

// ─── Settings ────────────────────────────────────────────────────

export const getSetting = async (key: string): Promise<string | null> => {
    try {
        if (!isSupabaseConfigured()) {
            if (key === 'maintenance_mode') return mockMaintenanceMode ? 'true' : 'false';
            return null;
        }

        // Add a timeout to prevent infinite hang
        const timeout = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const fetchSetting = (async () => {
            const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
            if (error) throw error;
            return data?.value || null;
        })();

        return await Promise.race([fetchSetting, timeout]);
    } catch (err) {
        console.error(`[API] getSetting(${key}) failed:`, err);
        if (key === 'maintenance_mode') return 'false'; // Default to OFF on failure
        return null;
    }
};

export const updateSetting = async (key: string, value: string) => {
    if (!isSupabaseConfigured()) {
        if (key === 'maintenance_mode') mockMaintenanceMode = value === 'true';
        return;
    }
    const { error } = await supabase.from('settings').upsert({ key, value });
    if (error) throw error;
};

let maintenanceCache = {
    value: false,
    lastFetched: 0,
    TTL: 5 * 60 * 1000 // 5 minutes
};

let newsEnabledCache = {
    value: true,
    lastFetched: 0,
    TTL: 5 * 60 * 1000
};

export const getNewsEnabled = async (): Promise<boolean> => {
    const now = Date.now();
    if (now - newsEnabledCache.lastFetched < newsEnabledCache.TTL) {
        return newsEnabledCache.value;
    }
    const val = await getSetting('news_enabled');
    const enabled = val !== 'false';
    newsEnabledCache.value = enabled;
    newsEnabledCache.lastFetched = now;
    return enabled;
};

export const setNewsEnabled = async (enabled: boolean) => {
    await updateSetting('news_enabled', enabled ? 'true' : 'false');
    newsEnabledCache.value = enabled;
    newsEnabledCache.lastFetched = Date.now();
};

export const getMaintenanceMode = async (): Promise<boolean> => {
    const now = Date.now();
    if (now - maintenanceCache.lastFetched < maintenanceCache.TTL) {
        return maintenanceCache.value;
    }

    const val = await getSetting('maintenance_mode');
    const mode = val === 'true';

    maintenanceCache.value = mode;
    maintenanceCache.lastFetched = now;

    return mode;
};

export const setMaintenanceMode = async (enabled: boolean) => {
    await updateSetting('maintenance_mode', enabled ? 'true' : 'false');
    // Clear/Update cache immediately
    maintenanceCache.value = enabled;
    maintenanceCache.lastFetched = Date.now();
};

// ─── Helpers ─────────────────────────────────────────────────────

function mapBookingRow(row: Record<string, unknown>): BookingResponse {
    const floors = row.floors as Record<string, unknown> | null;
    const branches = floors?.branches as Record<string, unknown> | null;
    const seats = row.seats as Record<string, unknown> | null;
    const rooms = seats?.rooms as Record<string, unknown> | null;

    // Manual mapping for common durations since FK is removed for dynamic slots
    const slotId = (row.slot_id as string) ?? 'admin';
    let slotTime = 'Custom';

    if (slotId === '1w') slotTime = '1 Week';
    else if (slotId === '2w') slotTime = '2 Weeks';
    else if (slotId === '3w') slotTime = '3 Weeks';
    else if (slotId === '1m') slotTime = '1 Month';
    else if (slotId.startsWith('slot-')) slotTime = 'Custom Duration';

    return {
        id: row.id as string,
        slotId: slotId,
        slotTime: slotTime,
        slotDate: row.start_date as string,
        startDate: row.start_date as string,
        endDate: row.end_date as string,
        location: {
            branch: row.branch_id as number,
            branchName: (branches?.name as string) ?? undefined,
            floor: (floors?.floor_number ?? 0) as number,
            roomNo: (rooms?.name ?? rooms?.room_no ?? `F${(floors?.floor_number ?? 0)}`) as string,
            seatNo: (seats?.seat_no ?? '') as string,
            isAc: (rooms?.is_ac as boolean) ?? false,
        },
        customerName: row.customer_name as string,
        customerPhone: row.customer_phone as string,
        customerEmail: (row.customer_email as string) ?? undefined,
        amount: row.amount as number,
        status: row.status as BookingResponse['status'],
        paymentScreenshotUrl: (row.payment_screenshot_url as string) ?? undefined,
        createdAt: row.created_at as string,
    };
}

// ─── Legacy export (unused but keeps compat) ─────────────────
export const createPayment = async (_bookingId: string) => {
    await delay(500);
    return { success: true, transactionId: `TXN${Date.now()}`, message: 'OK' };
};
