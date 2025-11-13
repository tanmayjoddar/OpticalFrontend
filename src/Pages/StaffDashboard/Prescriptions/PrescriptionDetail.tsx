import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { StaffAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PrescriptionData {
  id?: number;
  patientId?: number;
  patient?: { id?: number; name?: string; phone?: string };
  rightEye?: { sph?: string; cyl?: string; axis?: string; add?: string };
  leftEye?: { sph?: string; cyl?: string; axis?: string; add?: string };
  notes?: string;
  doctor?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PrescriptionDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PrescriptionData | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingThermal, setDownloadingThermal] = useState(false);

  const fetchPrescription = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await StaffAPI.prescriptions.getById(Number(id));
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prescription');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);

  const downloadPdf = async () => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      const blob = await StaffAPI.prescriptions.getPdf(Number(id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const printThermal = async () => {
    if (!id) return;
    setDownloadingThermal(true);
    try {
      const thermalHtml = await StaffAPI.prescriptions.getThermal(Number(id));
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(thermalHtml);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to generate thermal print');
    } finally {
      setDownloadingThermal(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 space-y-4">
        <Alert>
          <AlertDescription>Prescription not found</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prescription #{data.id}</h1>
            <p className="text-sm text-muted-foreground">
              Created: {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={downloadingPdf}
          >
            <Download className="h-4 w-4 mr-1" />
            {downloadingPdf ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printThermal}
            disabled={downloadingThermal}
          >
            <Printer className="h-4 w-4 mr-1" />
            {downloadingThermal ? 'Generating...' : 'Thermal Print'}
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient Name</p>
              <p className="font-medium">{data.patient?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient ID</p>
              <p className="font-medium">{data.patientId || '—'}</p>
            </div>
            {data.patient?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{data.patient.phone}</p>
              </div>
            )}
            {data.doctor && (
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">{data.doctor}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prescription Details */}
      <Card>
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Right Eye */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Right Eye (OD)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sphere (SPH)</p>
                <p className="font-medium text-lg">{data.rightEye?.sph || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cylinder (CYL)</p>
                <p className="font-medium text-lg">{data.rightEye?.cyl || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Axis</p>
                <p className="font-medium text-lg">{data.rightEye?.axis || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add</p>
                <p className="font-medium text-lg">{data.rightEye?.add || '—'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Left Eye */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Left Eye (OS)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sphere (SPH)</p>
                <p className="font-medium text-lg">{data.leftEye?.sph || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cylinder (CYL)</p>
                <p className="font-medium text-lg">{data.leftEye?.cyl || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Axis</p>
                <p className="font-medium text-lg">{data.leftEye?.axis || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add</p>
                <p className="font-medium text-lg">{data.leftEye?.add || '—'}</p>
              </div>
            </div>
          </div>

          {data.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Additional Notes</p>
                <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Record Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prescription ID</p>
              <p className="font-medium">{data.id}</p>
            </div>
            {data.date && (
              <div>
                <p className="text-muted-foreground">Prescription Date</p>
                <p className="font-medium">{new Date(data.date).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">
                {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            {data.updatedAt && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(data.updatedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionDetail;
