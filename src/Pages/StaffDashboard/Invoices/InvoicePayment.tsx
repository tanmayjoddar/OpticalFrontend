import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, DollarSign, Gift } from 'lucide-react';
import { StaffAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/currency';

const InvoicePayment: React.FC = () => {
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Auto-clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchInvoiceDetails = async () => {
    if (!invoiceId.trim()) return;
    try {
      setLoadingInvoice(true);
      setError(null);
      const data = await StaffAPI.invoices.getById(invoiceId.trim());
      setInvoiceData(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load invoice');
      setInvoiceData(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!invoiceId.trim()) {
      setError('Invoice ID is required');
      return;
    }
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (!paymentMethod) {
      setError('Payment method is required');
      return;
    }
    if (paymentMethod.toUpperCase() === 'GIFT_CARD' && !giftCardCode.trim()) {
      setError('Gift card code is required for gift card payments');
      return;
    }

    try {
      setProcessing(true);
      const payload: any = {
        invoiceId: invoiceId.trim(),
        amount: paymentAmount,
        paymentMethod: paymentMethod,
      };
      
      if (paymentMethod.toUpperCase() === 'GIFT_CARD') {
        payload.giftCardCode = giftCardCode.trim();
      }

      const result = await StaffAPI.payment.processPayment(payload);
      
      setSuccess(`Payment of ${formatCurrency(paymentAmount)} processed successfully!`);
      // Reset form
      setAmount('');
      setGiftCardCode('');
      
      // Refresh invoice data
      if (result?.id) {
        setTimeout(() => {
          navigate(`/staff-dashboard/invoices/${result.id}`);
        }, 2000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const remainingBalance = invoiceData 
    ? Math.max(0, (invoiceData.totalAmount || invoiceData.total || 0) - (invoiceData.paidAmount || 0))
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Process Payment</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Add payment to an invoice using multiple payment methods
          </p>
        </div>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert className="bg-green-50 text-green-800 border-green-300">{success}</Alert>}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Form */}
        <Card className="p-6">
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </h2>
              <Separator />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice ID *</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter invoice ID"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  disabled={processing}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchInvoiceDetails}
                  disabled={loadingInvoice || !invoiceId.trim()}
                >
                  {loadingInvoice ? 'Loading...' : 'Lookup'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={processing}
                  className="pl-9"
                />
              </div>
              {invoiceData && remainingBalance > 0 && (
                <p className="text-xs text-muted-foreground">
                  Remaining balance: {formatCurrency(remainingBalance)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={processing}
                className="w-full border rounded-md h-10 px-3 text-sm bg-background"
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="GIFT_CARD">Gift Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {paymentMethod.toUpperCase() === 'GIFT_CARD' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Gift Card Code *
                </label>
                <Input
                  type="text"
                  placeholder="Enter gift card code"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                  disabled={processing}
                />
              </div>
            )}

            <Separator />

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={processing || !invoiceId || !amount}
                className="flex-1"
              >
                {processing ? 'Processing...' : 'Process Payment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setInvoiceId('');
                  setAmount('');
                  setGiftCardCode('');
                  setPaymentMethod('CASH');
                  setError(null);
                  setSuccess(null);
                  setInvoiceData(null);
                }}
                disabled={processing}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        {/* Invoice Preview */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <Separator />
            </div>

            {!invoiceData ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">Enter an invoice ID and click "Lookup" to view details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Invoice ID:</span>
                    <p className="font-medium">#{invoiceData.id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{invoiceData.status || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <p className="font-medium">{formatCurrency(invoiceData.totalAmount || invoiceData.total || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <p className="font-medium">{formatCurrency(invoiceData.paidAmount || 0)}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Remaining Balance</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                  {remainingBalance === 0 && (
                    <Alert className="bg-green-50 text-green-800 border-green-300">
                      Invoice is fully paid
                    </Alert>
                  )}
                </div>

                {invoiceData.patient && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Patient:</span>
                    <p className="text-sm font-medium">{invoiceData.patient.name || `ID: ${invoiceData.patientId}`}</p>
                  </div>
                )}

                {invoiceData.customer && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground">Customer:</span>
                    <p className="text-sm font-medium">{invoiceData.customer.name || `ID: ${invoiceData.customerId}`}</p>
                  </div>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/staff-dashboard/invoices/${invoiceData.id}`)}
                >
                  View Full Invoice
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Tips */}
      <Card className="p-4 bg-muted/30">
        <h3 className="text-sm font-semibold mb-2">Payment Processing Tips</h3>
        <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
          <li>Payment amount cannot exceed the remaining balance</li>
          <li>Gift card payments will automatically deduct from the card balance</li>
          <li>Multiple partial payments can be added to a single invoice</li>
          <li>Invoice status will auto-update to "PAID" when fully settled</li>
          <li>All payment transactions are logged with timestamps</li>
        </ul>
      </Card>
    </div>
  );
};

export default InvoicePayment;
