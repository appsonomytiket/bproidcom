
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { CheckCircle, ClipboardCopy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingDetails {
  bookingId: string;
  eventName: string;
  name: string;
  email: string;
  tickets: number;
  totalPrice: number;
  referralCode?: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const { bookingId } = params;
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDetails = localStorage.getItem('bookingDetails');
      if (storedDetails) {
        const parsedDetails = JSON.parse(storedDetails);
        // Check if the stored bookingId matches the URL param
        if (parsedDetails.bookingId === bookingId) {
          // Simulate generating a referral code
          const referralCode = `${parsedDetails.name.substring(0,3).toUpperCase()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          setDetails({...parsedDetails, referralCode});
        } else {
          // Data mismatch, might be an old booking or direct navigation
          setDetails({
            bookingId: bookingId as string,
            eventName: "Unknown Event",
            name: "N/A",
            email: "N/A",
            tickets: 0,
            totalPrice: 0,
            referralCode: "N/A"
          });
        }
      }
    }
  }, [bookingId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${label} Copied!`, description: `${text} has been copied to your clipboard.` });
    }).catch(err => {
      toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };
  
  if (!details) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <p>Loading booking details...</p>
      </div>
    );
  }

  const paymentInstructions = {
    bankTransfer: {
      bank: "Bank BCA",
      accountNumber: "123-456-7890",
      accountName: "PT Bproid Event Organizer",
    },
    qris: "https://placehold.co/200x200.png?text=QRIS+Placeholder", // Placeholder QRIS image
  };

  return (
    <div className="container py-12">
      <Card className="mx-auto max-w-2xl shadow-xl">
        <CardHeader className="bg-primary text-primary-foreground p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-10 w-10" />
            <div>
              <CardTitle className="text-3xl font-bold">Booking Confirmed!</CardTitle>
              <CardDescription className="text-primary-foreground/80">Your tickets for {details.eventName} are reserved.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Booking ID: {details.bookingId}</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><strong>Name:</strong> {details.name}</li>
              <li><strong>Email:</strong> {details.email}</li>
              <li><strong>Event:</strong> {details.eventName}</li>
              <li><strong>Tickets:</strong> {details.tickets}</li>
              <li><strong>Total Price:</strong> Rp {details.totalPrice.toLocaleString()}</li>
            </ul>
          </div>

          {details.referralCode && (
             <div>
              <h3 className="text-lg font-semibold mb-1">Your Referral Code:</h3>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-accent p-2 border border-dashed border-accent rounded-md">
                  {details.referralCode}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(details.referralCode!, "Referral Code")}
                >
                  <ClipboardCopy className="h-4 w-4 mr-2" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Share this code with friends! You'll earn a commission if they book using your code.</p>
            </div>
          )}

          <div className="space-y-4 rounded-md border bg-secondary/30 p-4">
            <h3 className="text-lg font-semibold text-primary">Payment Instructions</h3>
            <p className="text-sm text-muted-foreground">Please complete your payment within 24 hours to secure your tickets. Amount to pay: <strong>Rp {details.totalPrice.toLocaleString()}</strong></p>
            
            <div>
              <h4 className="font-semibold mb-1">Bank Transfer:</h4>
              <p className="text-sm">Bank: {paymentInstructions.bankTransfer.bank}</p>
              <div className="flex items-center gap-2">
                <p className="text-sm">Account Number: {paymentInstructions.bankTransfer.accountNumber}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(paymentInstructions.bankTransfer.accountNumber, "Account Number")}>
                  <ClipboardCopy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm">Account Name: {paymentInstructions.bankTransfer.accountName}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">QRIS:</h4>
              <p className="text-sm mb-2">Scan the QR code below using your e-wallet or mobile banking app.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paymentInstructions.qris} alt="QRIS Payment Code" className="rounded-md border" data-ai-hint="QR code" />
            </div>
            <p className="text-xs text-muted-foreground">After payment, please send proof of transfer to payments@bproid.com with your Booking ID.</p>
          </div>
        </CardContent>
        <CardFooter className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/">
              <Download className="mr-2 h-4 w-4" /> Download E-Ticket (Mock)
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
