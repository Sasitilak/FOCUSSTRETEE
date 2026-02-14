import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { Slot, Location, BookingDetails, BookingResponse, PaymentStatus } from '../types/booking';

interface BookingContextType {
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
    selectedSlot: Slot | null;
    setSelectedSlot: (slot: Slot | null) => void;
    selectedLocation: Location | null;
    setSelectedLocation: (location: Location | null) => void;
    bookingDetails: BookingDetails | null;
    setBookingDetails: (details: BookingDetails | null) => void;
    booking: BookingResponse | null;
    setBooking: (booking: BookingResponse | null) => void;
    paymentStatus: PaymentStatus;
    setPaymentStatus: (status: PaymentStatus) => void;
    transactionId: string | null;
    setTransactionId: (id: string | null) => void;
    paymentScreenshot: File | null;
    setPaymentScreenshot: (file: File | null) => void;
    resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
    const [booking, setBooking] = useState<BookingResponse | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);

    const resetBooking = () => {
        setSelectedDate(null);
        setSelectedSlot(null);
        setSelectedLocation(null);
        setBookingDetails(null);
        setBooking(null);
        setPaymentStatus('idle');
        setTransactionId(null);
        setPaymentScreenshot(null);
    };

    return (
        <BookingContext.Provider
            value={{
                selectedDate, setSelectedDate,
                selectedSlot, setSelectedSlot,
                selectedLocation, setSelectedLocation,
                bookingDetails, setBookingDetails,
                booking, setBooking,
                paymentStatus, setPaymentStatus,
                transactionId, setTransactionId,
                paymentScreenshot, setPaymentScreenshot,
                resetBooking,
            }}
        >
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = (): BookingContextType => {
    const context = useContext(BookingContext);
    if (!context) throw new Error('useBooking must be used within BookingProvider');
    return context;
};
