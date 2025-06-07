'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BookingDetails {
  id: string;
  payment_status: string;
  checked_in: boolean;
  checked_in_at?: string | null;
  event_id: string;
  user_id: string;
  user_name?: string;
  event_name?: string;
  selected_tier_name?: string;
  tickets: number;
}

interface ValidationResponse {
  status: 'success' | 'not_found' | 'not_paid' | 'already_checked_in' | 'update_failed' | 'error';
  message: string;
  booking_details: BookingDetails | null;
}

export default function ScanTicketPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [bookingId, setBookingId] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerRegionId = "qr-scanner-region";

  const handleValidateTicket = async (idToValidate?: string) => {
    const currentBookingId = idToValidate || bookingId;
    if (!currentBookingId.trim()) {
      toast({ title: 'Error', description: 'Please enter or scan a Booking ID.' });
      return;
    }
    setIsLoading(true);
    setValidationResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('validate-ticket', {
        body: { booking_id: currentBookingId.trim() },
      });

      if (error) {
        throw new Error(error.message || 'Failed to call validation function.');
      }
      
      const result = data as ValidationResponse;
      setValidationResult(result);
      // Also update the input field if a QR code was scanned
      if (idToValidate) {
        setBookingId(idToValidate);
      }

      if (result.status === 'success') {
        toast({ title: 'Success', description: result.message });
        if (showScanner && scannerRef.current) {
          // Consider stopping the scanner or providing feedback to scan next
        }
      } else {
        toast({ title: 'Validation Info', description: result.message, variant: result.status === 'already_checked_in' || result.status === 'not_paid' ? 'default' : 'destructive' });
      }

    } catch (error: any) {
      console.error('Error validating ticket:', error);
      setValidationResult({
        status: 'error',
        message: error.message || 'An unexpected error occurred.',
        booking_details: null,
      });
      toast({ title: 'Error', description: error.message || 'Failed to validate ticket.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showScanner) {
      if (!scannerRef.current) {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.EAN_13,
        ];
        const html5QrcodeScanner = new Html5QrcodeScanner(
          scannerRegionId,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            supportedScanTypes: [], 
            formatsToSupport: formatsToSupport
          },
          /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string, decodedResult: any) => {
          console.log(`Scan result: ${decodedText}`, decodedResult);
          setBookingId(decodedText); 
          handleValidateTicket(decodedText);
          // setShowScanner(false); // Optional: hide scanner after successful scan
        };

        const onScanFailure = (error: any) => {
          // console.warn(`QR error = ${error}`);
        };

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        scannerRef.current = html5QrcodeScanner;
      }
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner: ", error);
        });
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Cleanup: Failed to clear html5QrcodeScanner: ", error);
        });
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  const handleManualValidate = () => {
    handleValidateTicket(); // This will use the bookingId from the state
  }

  const getAlertVariant = (status?: ValidationResponse['status']): "default" | "destructive" | null | undefined => {
    if (!status) return "default";
    switch (status) {
      case 'success':
        return "default"; // Or a custom "success" variant if you have one
      case 'already_checked_in':
      case 'not_paid':
        return "default"; // Informational, but not a "success"
      case 'not_found':
      case 'update_failed':
      case 'error':
        return "destructive";
      default:
        return "default";
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold">Scan & Validate Ticket</h1>

      <Card>
        <CardHeader>
          <CardTitle>Validate Ticket</CardTitle>
          <CardDescription>
            Input the Booking ID manually or use the QR code scanner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookingIdInput">Booking ID</Label>
            <div className="flex items-end space-x-2">
              <Input
                id="bookingIdInput"
                type="text"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Enter or scan Booking ID"
                disabled={showScanner} // Disable manual input when scanner is active
              />
              <Button onClick={handleManualValidate} disabled={isLoading || showScanner}>
                {isLoading && !showScanner ? 'Validating...' : 'Validate Manually'}
              </Button>
            </div>
          </div>

          <div>
            <Button
              variant="outline"
              onClick={() => setShowScanner(prev => !prev)}
              disabled={isLoading}
            >
              {showScanner ? (isLoading ? 'Scanner Active...' : 'Hide Scanner') : 'Scan QR Code'}
            </Button>
          </div>

          {showScanner && (
            <div id={scannerRegionId} className="w-full md:w-[500px] mx-auto my-4 border rounded-md aspect-square">
              {/* QR Code Scanner will be rendered here by html5-qrcode */}
            </div>
          )}
        </CardContent>
      </Card>

      {validationResult && (
        <Alert variant={getAlertVariant(validationResult.status)}>
          <AlertTitle>
            {validationResult.status === 'success' && "Ticket Validated & Checked In!"}
            {validationResult.status === 'already_checked_in' && "Ticket Already Checked In"}
            {validationResult.status === 'not_paid' && "Ticket Not Paid"}
            {validationResult.status === 'not_found' && "Ticket Not Found"}
            {validationResult.status === 'update_failed' && "Check-in Failed"}
            {validationResult.status === 'error' && "Error"}
          </AlertTitle>
          <AlertDescription>
            {validationResult.message}
            {validationResult.booking_details && (
              <div className="mt-2 text-sm space-y-1 p-2 border rounded bg-muted/50">
                <p><strong>Booking ID:</strong> {validationResult.booking_details.id}</p>
                <p><strong>Event:</strong> {validationResult.booking_details.event_name || 'N/A'}</p>
                <p><strong>Name:</strong> {validationResult.booking_details.user_name || 'N/A'}</p>
                <p><strong>Tier:</strong> {validationResult.booking_details.selected_tier_name || 'N/A'} ({validationResult.booking_details.tickets} ticket(s))</p>
                <p><strong>Payment Status:</strong> {validationResult.booking_details.payment_status}</p>
                <p><strong>Checked In:</strong> {validationResult.booking_details.checked_in ? 'Yes' : 'No'}</p>
                {validationResult.booking_details.checked_in_at && (
                  <p><strong>Checked In At:</strong> {new Date(validationResult.booking_details.checked_in_at).toLocaleString()}</p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
