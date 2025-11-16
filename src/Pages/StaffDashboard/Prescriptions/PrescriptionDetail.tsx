import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { StaffAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PrescriptionData {
  id?: number;
  patientId?: number;
  patient?: {
    id?: number;
    name?: string;
    phone?: string;
    address?: string;
    shopId?: number;
  };
  rightEye?: {
    type?: string;
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
    pd?: string;
    bc?: string;
    remarks?: string;
  };
  leftEye?: {
    type?: string;
    sph?: string;
    cyl?: string;
    axis?: string;
    add?: string;
    pd?: string;
    bc?: string;
    remarks?: string;
  };
  notes?: string;
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
    } catch (e: unknown) {
      const error = e as { message?: string };
      setError(error?.message || "Failed to load prescription");
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
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error?.message || "Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const printThermal = async () => {
    if (!id) return;
    setDownloadingThermal(true);
    try {
      const thermalData = await StaffAPI.prescriptions.getThermal(Number(id));
      const thermalContent = (thermalData as { thermalContent: string })
        .thermalContent;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(
          '<pre style="font-family: monospace; font-size: 10px; white-space: pre-wrap;">' +
            thermalContent +
            "</pre>"
        );
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert(error?.message || "Failed to generate thermal print");
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
            <h1 className="text-2xl font-bold text-gray-900">
              Prescription #{data.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created:{" "}
              {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
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
            {downloadingPdf ? "Downloading..." : "Download PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printThermal}
            disabled={downloadingThermal}
          >
            <Printer className="h-4 w-4 mr-1" />
            {downloadingThermal ? "Generating..." : "Thermal Print"}
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
              <p className="font-medium">{data.patient?.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient ID</p>
              <p className="font-medium">{data.patientId || "—"}</p>
            </div>
            {data.patient?.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{data.patient.phone}</p>
              </div>
            )}
            {data.patient?.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-sm">{data.patient.address}</p>
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
              {data.rightEye?.type && (
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium text-lg">{data.rightEye.type}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Sphere (SPH)</p>
                <p className="font-medium text-lg">
                  {data.rightEye?.sph || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cylinder (CYL)</p>
                <p className="font-medium text-lg">
                  {data.rightEye?.cyl || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Axis</p>
                <p className="font-medium text-lg">
                  {data.rightEye?.axis || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add</p>
                <p className="font-medium text-lg">
                  {data.rightEye?.add || "—"}
                </p>
              </div>
              {data.rightEye?.pd && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pupil Distance (PD)
                  </p>
                  <p className="font-medium text-lg">{data.rightEye.pd}</p>
                </div>
              )}
              {data.rightEye?.bc && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Base Curve (BC)
                  </p>
                  <p className="font-medium text-lg">{data.rightEye.bc}</p>
                </div>
              )}
              {data.rightEye?.remarks && (
                <div className="md:col-span-4">
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="font-medium text-sm">{data.rightEye.remarks}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Left Eye */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Left Eye (OS)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.leftEye?.type && (
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium text-lg">{data.leftEye.type}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Sphere (SPH)</p>
                <p className="font-medium text-lg">
                  {data.leftEye?.sph || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cylinder (CYL)</p>
                <p className="font-medium text-lg">
                  {data.leftEye?.cyl || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Axis</p>
                <p className="font-medium text-lg">
                  {data.leftEye?.axis || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Add</p>
                <p className="font-medium text-lg">
                  {data.leftEye?.add || "—"}
                </p>
              </div>
              {data.leftEye?.pd && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pupil Distance (PD)
                  </p>
                  <p className="font-medium text-lg">{data.leftEye.pd}</p>
                </div>
              )}
              {data.leftEye?.bc && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Base Curve (BC)
                  </p>
                  <p className="font-medium text-lg">{data.leftEye.bc}</p>
                </div>
              )}
              {data.leftEye?.remarks && (
                <div className="md:col-span-4">
                  <p className="text-sm text-muted-foreground">Remarks</p>
                  <p className="font-medium text-sm">{data.leftEye.remarks}</p>
                </div>
              )}
            </div>
          </div>

          {data.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Doctor's Notes
                </p>
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
            <div>
              <p className="text-muted-foreground">Created At</p>
              <p className="font-medium">
                {data.createdAt
                  ? new Date(data.createdAt).toLocaleString()
                  : "—"}
              </p>
            </div>
            {data.updatedAt && (
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(data.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionDetail;
