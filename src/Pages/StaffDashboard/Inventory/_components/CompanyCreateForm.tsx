import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { StaffAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CompanyCreateFormProps {
  onCreated?: (company: any) => void;
}

const CompanyCreateForm: React.FC<CompanyCreateFormProps> = ({ onCreated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const data = await StaffAPI.inventory.getCompanies();
        setCompanies(Array.isArray(data) ? data : data?.items || []);
      } catch {
        /* ignore */
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const duplicate = useMemo(() => {
    if (!name.trim()) return false;
    return companies.some(
      (c) => (c.name || "").toLowerCase() === name.trim().toLowerCase()
    );
  }, [companies, name]);

  const valid = name.trim().length >= 2 && !duplicate;

  const submit = async () => {
    if (!valid) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      const payload: any = { name: name.trim() };
      if (description.trim()) payload.description = description.trim();
      const res = await StaffAPI.inventory.addCompany(payload);
      setSuccess(res);
      onCreated?.(res);
      setName("");
      setDescription("");
    } catch (e: any) {
      setError(e?.message || "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-redirect to companies list after 2 seconds on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate("/staff-dashboard/inventory/companies");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">New Company</h2>
        <p className="text-xs text-muted-foreground">
          Register a manufacturer/vendor for product association.
        </p>
      </div>
      {error && <Alert variant="destructive">{error}</Alert>}
      {success && (
        <Alert
          variant="default"
          className="flex flex-col items-start space-y-1"
        >
          <span className="font-medium">Company Created</span>
          <span className="text-xs text-muted-foreground">{success.name}</span>
          <span className="text-xs text-muted-foreground">
            Redirecting to companies list in 2 seconds...
          </span>
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(
                  `/staff-dashboard/inventory/products/create?companyId=${success.id}`
                )
              }
            >
              Add Product
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSuccess(null)}
            >
              Add Another
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/staff-dashboard/inventory/companies")}
            >
              Go to Companies
            </Button>
          </div>
        </Alert>
      )}
      <div className="space-y-3">
        <div>
          <label className="text-xs uppercase text-muted-foreground">
            Company Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Frames"
          />
          <div className="h-4">
            {!name.trim() && (
              <span className="text-[10px] text-muted-foreground">
                Enter a name (min 2 chars)
              </span>
            )}
            {name.trim() && duplicate && (
              <span className="text-[10px] text-red-600">
                Name already exists
              </span>
            )}
            {name.trim() && !duplicate && name.trim().length < 2 && (
              <span className="text-[10px] text-red-600">Too short</span>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs uppercase text-muted-foreground">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
            rows={3}
          />
        </div>
      </div>
      <Separator />
      <div className="flex gap-2 flex-wrap">
        <Button onClick={submit} disabled={!valid || submitting}>
          {submitting ? "Creating..." : "Create Company"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setName("");
            setDescription("");
            setError(null);
            setSuccess(null);
          }}
          disabled={submitting}
        >
          Reset
        </Button>
      </div>
      <div className="pt-2">
        <p className="text-[11px] text-muted-foreground">
          Existing companies loaded
          {loadingCompanies ? "..." : `: ${companies.length}`}
        </p>
      </div>
    </Card>
  );
};

export default CompanyCreateForm;
