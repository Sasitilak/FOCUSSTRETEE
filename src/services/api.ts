import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Slot, Branch, BookingDetails, BookingResponse, Location, DashboardStats } from '../types/booking';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Mock data (used when Supabase keys aren't set yet) ─────────

const mockBranches: Branch[] = [
    {
        id: 1, name: 'Branch 1 — Koramangala', address: '4th Block, Koramangala',
        floors: [
            { floorNumber: 1, rooms: [{ id: 'b1f1', roomNo: 'F1', name: 'Floor 1', seats: Array.from({ length: 24 }, (_, i) => ({ id: `b1f1s${i + 1}`, seatNo: `S${i + 1}`, available: Math.random() > 0.3 })) }] },
            { floorNumber: 2, rooms: [{ id: 'b1f2', roomNo: 'F2', name: 'Floor 2', seats: Array.from({ length: 18 }, (_, i) => ({ id: `b1f2s${i + 1}`, seatNo: `S${i + 1}`, available: Math.random() > 0.25 })) }] },
        ],
    },
    {
        id: 2, name: 'Branch 2 — Indiranagar', address: '100 Feet Road, Indiranagar',
        floors: [
            { floorNumber: 1, rooms: [{ id: 'b2f1', roomNo: 'F1', name: 'Floor 1', seats: Array.from({ length: 30 }, (_, i) => ({ id: `b2f1s${i + 1}`, seatNo: `S${i + 1}`, available: Math.random() > 0.35 })) }] },
            { floorNumber: 2, rooms: [{ id: 'b2f2', roomNo: 'F2', name: 'Floor 2', seats: Array.from({ length: 20 }, (_, i) => ({ id: `b2f2s${i + 1}`, seatNo: `S${i + 1}`, available: Math.random() > 0.3 })) }] },
            { floorNumber: 3, rooms: [{ id: 'b2f3', roomNo: 'F3', name: 'Floor 3', seats: Array.from({ length: 15 }, (_, i) => ({ id: `b2f3s${i + 1}`, seatNo: `S${i + 1}`, available: Math.random() > 0.25 })) }] },
        ],
    },
];

const mockSlots: Slot[] = [
    { id: 'slot-1w', time: '1 Week', available: true, price: 350 },
    { id: 'slot-2w', time: '2 Weeks', available: true, price: 600 },
    { id: 'slot-1m', time: '1 Month', available: true, price: 1000 },
    { id: 'slot-3m', time: '3 Months', available: true, price: 2700 },
];

const mockBookings: BookingResponse[] = [
    { id: 'BK1001', slotId: 's1', slotTime: '1 Month', slotDate: '2026-02-14', location: { branch: 1, floor: 1, roomNo: 'F1', seatNo: 'S3' }, customerName: 'Arun Kumar', customerPhone: '+91 9876543210', amount: 1000, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T08:30:00Z' },
    { id: 'BK1002', slotId: 's2', slotTime: '2 Weeks', slotDate: '2026-02-14', location: { branch: 2, floor: 2, roomNo: 'F2', seatNo: 'S7' }, customerName: 'Priya Sharma', customerPhone: '+91 9123456780', amount: 600, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T09:15:00Z' },
    { id: 'BK1003', slotId: 's3', slotTime: '1 Month', slotDate: '2026-02-13', location: { branch: 1, floor: 2, roomNo: 'F2', seatNo: 'S1' }, customerName: 'Ravi Patel', customerPhone: '+91 9988776655', amount: 1000, status: 'confirmed', createdAt: '2026-02-13T07:00:00Z' },
    { id: 'BK1004', slotId: 's4', slotTime: '3 Months', slotDate: '2026-02-12', location: { branch: 2, floor: 3, roomNo: 'F3', seatNo: 'S2' }, customerName: 'Sneha Reddy', customerPhone: '+91 9090909090', amount: 2700, status: 'confirmed', createdAt: '2026-02-12T14:00:00Z' },
    { id: 'BK1005', slotId: 's5', slotTime: '1 Week', slotDate: '2026-02-11', location: { branch: 1, floor: 1, roomNo: 'F1', seatNo: 'S10' }, customerName: 'Vikram Singh', customerPhone: '+91 8080808080', amount: 350, status: 'rejected', createdAt: '2026-02-11T06:45:00Z' },
    { id: 'BK1006', slotId: 's6', slotTime: '1 Month', slotDate: '2026-02-14', location: { branch: 2, floor: 1, roomNo: 'F1', seatNo: 'S15' }, customerName: 'Meera Nair', customerPhone: '+91 7070707070', amount: 1000, status: 'pending', paymentScreenshotUrl: 'https://placehold.co/400x600/222/aaa?text=Payment+Screenshot', createdAt: '2026-02-14T10:30:00Z' },
];

// ─── Public APIs ────────────────────────────────────────────────

export const getSlots = async (): Promise<Slot[]> => {
    if (!isSupabaseConfigured()) { await delay(400); return mockSlots; }

    const { data, error } = await supabase
        .from('slots')
        .select('*')
        .eq('is_active', true)
        .order('duration_days');

    if (error) throw error;
    return (data ?? []).map(s => ({
        id: s.id,
        time: s.name,
        available: true,
        price: s.price,
    }));
};

export const getBranches = async (): Promise<Branch[]> => {
    if (!isSupabaseConfigured()) { await delay(400); return mockBranches; }

    // Fetch branches, floors, and available seats — check errors
    const { data: branchData, error: branchError } = await supabase.from('branches').select('*').order('id');
    if (branchError) throw new Error(`Failed to fetch branches: ${branchError.message}`);

    const { data: floorData, error: floorError } = await supabase.from('floors').select('*').order('floor_number');
    if (floorError) throw new Error(`Failed to fetch floors: ${floorError.message}`);

    const { data: seatData, error: seatError } = await supabase.from('available_seats').select('*');
    if (seatError) throw new Error(`Failed to fetch seats: ${seatError.message}`);

    if (!branchData || !floorData || !seatData) return [];

    return branchData.map(b => ({
        id: b.id as 1 | 2,
        name: b.name,
        address: b.address,
        floors: floorData
            .filter(f => f.branch_id === b.id)
            .map(f => ({
                floorNumber: f.floor_number,
                rooms: [{
                    id: `b${b.id}f${f.floor_number}`,
                    roomNo: `F${f.floor_number}`,
                    name: `Floor ${f.floor_number}`,
                    seats: seatData
                        .filter(s => s.floor_id === f.id)
                        .map(s => ({
                            id: String(s.id),
                            seatNo: s.seat_no,
                            available: s.is_available,
                        })),
                }],
            })),
    }));
};

export const createBooking = async (
    slotId: string,
    slotDate: string,
    location: Location,
    details: BookingDetails,
    screenshotFile?: File,
): Promise<BookingResponse> => {
    if (!isSupabaseConfigured()) {
        await delay(800);
        return {
            id: `BK${Date.now()}`, slotId, slotTime: '1 Month', slotDate: slotDate,
            location, customerName: details.name, customerPhone: details.phone,
            customerEmail: details.email, amount: 1000, status: 'pending',
            paymentScreenshotUrl: screenshotFile ? URL.createObjectURL(screenshotFile) : undefined,
            createdAt: new Date().toISOString(),
        };
    }

    // Resolve floor_id and seat_id from location
    const { data: floorRow, error: floorError } = await supabase
        .from('floors')
        .select('id')
        .eq('branch_id', location.branch)
        .eq('floor_number', location.floor)
        .single();

    if (floorError || !floorRow) throw new Error(`Floor not found for branch ${location.branch}, floor ${location.floor}`);

    const { data: seatRow, error: seatError } = await supabase
        .from('seats')
        .select('id')
        .eq('floor_id', floorRow.id)
        .eq('seat_no', location.seatNo)
        .single();

    if (seatError || !seatRow) throw new Error(`Seat '${location.seatNo}' not found on floor ${location.floor}`);

    // Get slot info
    const { data: slotRow, error: slotError } = await supabase.from('slots').select('*').eq('id', slotId).single();

    if (slotError || !slotRow) throw new Error(`Slot '${slotId}' not found`);

    // Parse dates — use UTC-safe date-only math to avoid timezone drift
    let startDate = slotDate;
    let endDate = slotDate;
    if (slotDate.includes(' to ')) {
        const parts = slotDate.split(' to ');
        startDate = parts[0];
        endDate = parts[1];
    } else {
        // Calculate end date from slot duration using UTC to avoid timezone issues
        const [year, month, day] = slotDate.split('-').map(Number);
        const startMs = Date.UTC(year, month - 1, day);
        const endMs = startMs + (slotRow.duration_days ?? 30) * 86_400_000;
        const endDt = new Date(endMs);
        endDate = `${endDt.getUTCFullYear()}-${String(endDt.getUTCMonth() + 1).padStart(2, '0')}-${String(endDt.getUTCDate()).padStart(2, '0')}`;
    }

    // Upload screenshot
    let screenshotUrl: string | undefined;
    if (screenshotFile) {
        const ext = screenshotFile.name.split('.').pop() || 'png';
        const path = `bookings/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
            .from('payment-screenshots')
            .upload(path, screenshotFile);

        if (uploadError) throw new Error(`Screenshot upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(path);
        screenshotUrl = urlData.publicUrl;
    }

    // Insert booking
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
            customer_name: details.name,
            customer_phone: details.phone,
            customer_email: details.email || null,
            slot_id: slotId,
            branch_id: location.branch,
            floor_id: floorRow.id,
            seat_id: seatRow.id,
            start_date: startDate,
            end_date: endDate,
            amount: slotRow.price ?? 0,
            payment_screenshot_url: screenshotUrl || null,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;

    return {
        id: booking.id,
        slotId: booking.slot_id,
        slotTime: slotRow.name ?? '',
        slotDate: booking.start_date,
        location,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email ?? undefined,
        amount: booking.amount,
        status: booking.status,
        paymentScreenshotUrl: booking.payment_screenshot_url ?? undefined,
        createdAt: booking.created_at,
    };
};

export const getBooking = async (id: string): Promise<BookingResponse | null> => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        return mockBookings.find(b => b.id === id) ?? null;
    }
    const { data, error } = await supabase.from('bookings').select('*, slots(name), floors(floor_number), seats(seat_no)').eq('id', id).maybeSingle();
    if (error) throw new Error(`getBooking: ${error.message}`);
    if (!data) return null;
    return mapBookingRow(data);
};

// ─── Admin APIs ─────────────────────────────────────────────────

export const getAdminBookings = async (): Promise<BookingResponse[]> => {
    if (!isSupabaseConfigured()) { await delay(500); return mockBookings; }

    const { data, error } = await supabase
        .from('bookings')
        .select('*, slots(name), floors(floor_number), seats(seat_no)')
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
        .select('*, slots(name), floors(floor_number), seats(seat_no)')
        .single();

    if (error) throw error;
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
        .select('*, slots(name), floors(floor_number), seats(seat_no)')
        .single();

    if (error) throw error;
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
        .select('*, slots(name), floors(floor_number), seats(seat_no)')
        .single();

    if (error) throw error;
    return mapBookingRow(data);
};

// ─── Admin: Seat Management ─────────────────────────────────────

export const getAdminSeats = async () => {
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
                    }))
                )
            )
        );
    }

    const { data, error } = await supabase
        .from('seats')
        .select('id, seat_no, is_blocked, floor_id, floors(branch_id, floor_number, branches(name))')
        .order('id');

    if (error) throw new Error(`getAdminSeats failed: ${error.message}`);

    return (data ?? []).map((s: Record<string, unknown>) => {
        const floor = s.floors as Record<string, unknown> | null;
        const branch = floor?.branches as Record<string, unknown> | null;
        return {
            id: s.id as number,
            seat_no: s.seat_no as string,
            is_blocked: s.is_blocked as boolean,
            floor_id: s.floor_id as number,
            branch_id: (floor?.branch_id ?? 0) as number,
            floor_number: (floor?.floor_number ?? 0) as number,
            branch_name: (branch?.name ?? '') as string,
        };
    });
};

export const toggleSeatBlock = async (seatId: number, isBlocked: boolean) => {
    if (!isSupabaseConfigured()) { await delay(300); return; }

    const { error } = await supabase
        .from('seats')
        .update({ is_blocked: isBlocked })
        .eq('id', seatId);

    if (error) throw error;
};

// ─── Admin: Pricing ──────────────────────────────────────────────

export const getAdminSlots = async () => {
    if (!isSupabaseConfigured()) {
        await delay(300);
        return mockSlots.map((s, i) => ({
            id: s.id, name: s.time, duration_days: [7, 14, 30, 90][i], price: s.price, is_active: true,
        }));
    }

    const { data, error } = await supabase.from('slots').select('*').order('duration_days');
    if (error) throw new Error(`getAdminSlots failed: ${error.message}`);
    return data ?? [];
};

export const updateSlotPrice = async (slotId: string, price: number) => {
    if (!isSupabaseConfigured()) { await delay(300); return; }

    const { error } = await supabase
        .from('slots')
        .update({ price })
        .eq('id', slotId);

    if (error) throw error;
};

export const toggleSlotActive = async (slotId: string, isActive: boolean) => {
    if (!isSupabaseConfigured()) { await delay(300); return; }

    const { error } = await supabase
        .from('slots')
        .update({ is_active: isActive })
        .eq('id', slotId);

    if (error) throw error;
};

// ─── Helpers ─────────────────────────────────────────────────────

function mapBookingRow(row: Record<string, unknown>): BookingResponse {
    const slots = row.slots as Record<string, unknown> | null;
    const floors = row.floors as Record<string, unknown> | null;
    const seats = row.seats as Record<string, unknown> | null;
    return {
        id: row.id as string,
        slotId: row.slot_id as string,
        slotTime: (slots?.name ?? '') as string,
        slotDate: row.start_date as string,
        location: {
            branch: row.branch_id as 1 | 2,
            floor: (floors?.floor_number ?? 0) as number,
            roomNo: `F${(floors?.floor_number ?? 0)}`,
            seatNo: (seats?.seat_no ?? '') as string,
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
