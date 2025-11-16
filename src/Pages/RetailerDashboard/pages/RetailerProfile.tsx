import { useEffect, useState, useRef, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RetailerAPI } from "@/lib/api";
import { toast } from "sonner";

export default function RetailerProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Align with backend docs (endpoint 3 & 4). Backend returns { retailer: {...} }
  interface ProfileDoc {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    businessType?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  const [profile, setProfile] = useState<Partial<ProfileDoc>>({});
  const originalProfileRef = useRef<Partial<ProfileDoc>>({});
  // Local-only extension fields kept separate to avoid accidental send
  const [extended, setExtended] = useState<{
    companyName?: string;
    gstNo?: string;
    licenseNo?: string;
  }>({});
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null); // for screen readers
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const addressId = useId();
  const businessTypeId = useId();
  const createdId = useId();
  const updatedId = useId();
  const currentPwdId = useId();
  const newPwdId = useId();

  const extractError = (e: unknown) => {
    if (e && typeof e === "object" && "message" in e) {
      return String((e as Record<string, unknown>).message) || "";
    }
    return "";
  };

  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Weak", color: "text-red-500" };
    if (score === 2) return { label: "Fair", color: "text-amber-500" };
    if (score === 3) return { label: "Good", color: "text-emerald-600" };
    return { label: "Strong", color: "text-emerald-600" };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await RetailerAPI.profile.get();
        const core = (data as Record<string, unknown>)?.retailer
          ? (data as Record<string, unknown>).retailer
          : data;
        if (!mounted) return;
        setProfile(core || {});
        originalProfileRef.current = core || {};
      } catch (e) {
        const message = extractError(e) || "Failed to load profile";
        setError(message);
        setLastAction(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isUnchanged = () => {
    const orig = originalProfileRef.current;
    return ["name", "phone", "address"].every(
      (k) =>
        (profile as Record<string, unknown>)[k] ===
        (orig as Record<string, unknown>)[k]
    );
  };

  const validateProfile = () => {
    if (!profile.name?.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (profile.phone && !/^\+?[0-9\-() ]{7,20}$/.test(profile.phone.trim())) {
      toast.error("Phone format invalid");
      return false;
    }
    if (profile.address && profile.address.length > 250) {
      toast.error("Address too long (250 max)");
      return false;
    }
    return true;
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;
    setSaving(true);
    try {
      setError(null);
      const payload = {
        name: profile.name?.trim(),
        phone: profile.phone || undefined,
        address: profile.address || undefined,
      };
      const resp = await RetailerAPI.profile.update(payload);
      const core = (resp as Record<string, unknown>)?.retailer
        ? (resp as Record<string, unknown>).retailer
        : resp;
      setProfile(core || {});
      originalProfileRef.current = core || {};
      toast.success("Profile updated");
      setLastAction("Profile updated successfully");
    } catch (e) {
      const message = extractError(e) || "Failed to update profile";
      setError(message);
      setLastAction(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwd.currentPassword || !pwd.newPassword) {
      toast.error("Both password fields required");
      return;
    }
    if (pwd.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pwd.newPassword === pwd.currentPassword) {
      toast.error("New password must differ from current password");
      return;
    }
    setChangingPwd(true);
    try {
      setError(null);
      await RetailerAPI.profile.changePassword(pwd);
      setPwd({ currentPassword: "", newPassword: "" });
      toast.success("Password updated");
      setLastAction("Password updated successfully");
    } catch (e) {
      const message = extractError(e) || "Failed to change password";
      setError(message);
      setLastAction(message);
      toast.error(message);
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-gradient">Profile</h2>
        <p className="text-muted-foreground">
          Update your account and company details
        </p>
      </div>

      {/* Live region for screen readers (status & errors) */}
      <div className="sr-only" aria-live="polite" role="status">
        {lastAction || (error ? `Error: ${error}` : "")}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            noValidate
          >
            <div className="sm:col-span-1">
              <label htmlFor={nameId} className="text-xs text-muted-foreground">
                Name *
              </label>
              <Input
                id={nameId}
                required
                aria-invalid={!profile.name?.trim()}
                value={profile.name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor={phoneId}
                className="text-xs text-muted-foreground"
              >
                Phone
              </label>
              <Input
                id={phoneId}
                inputMode="tel"
                pattern="^\\+?[0-9\\-() ]{7,20}$"
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor={emailId}
                className="text-xs text-muted-foreground"
              >
                Email (read only)
              </label>
              <Input id={emailId} value={profile.email || ""} disabled />
            </div>
            <div className="sm:col-span-3">
              <label
                htmlFor={addressId}
                className="text-xs text-muted-foreground"
              >
                Address
              </label>
              <Input
                id={addressId}
                value={profile.address || ""}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor={businessTypeId}
                className="text-xs text-muted-foreground"
              >
                Business Type
              </label>
              <Input
                id={businessTypeId}
                value={profile.businessType || ""}
                disabled
              />
            </div>
            <div>
              <label
                htmlFor={createdId}
                className="text-xs text-muted-foreground"
              >
                Created
              </label>
              <Input
                id={createdId}
                value={
                  profile.createdAt
                    ? new Date(profile.createdAt).toLocaleString()
                    : ""
                }
                disabled
              />
            </div>
            <div>
              <label
                htmlFor={updatedId}
                className="text-xs text-muted-foreground"
              >
                Updated
              </label>
              <Input
                id={updatedId}
                value={
                  profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleString()
                    : ""
                }
                disabled
              />
            </div>
            <div className="sm:col-span-3 pt-2 flex justify-between flex-wrap gap-4">
              <div className="text-xs text-muted-foreground">
                ID: {profile.id}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving || isUnchanged()}
                  aria-disabled={saving || isUnchanged()}
                >
                  {saving ? "Saving..." : isUnchanged() ? "No Changes" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">
            Extended (Local Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">
              Company (local)
            </label>
            <Input
              value={extended.companyName || ""}
              onChange={(e) =>
                setExtended({ ...extended, companyName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              GST No (local)
            </label>
            <Input
              value={extended.gstNo || ""}
              onChange={(e) =>
                setExtended({ ...extended, gstNo: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              License No (local)
            </label>
            <Input
              value={extended.licenseNo || ""}
              onChange={(e) =>
                setExtended({ ...extended, licenseNo: e.target.value })
              }
            />
          </div>
          <div className="sm:col-span-3 text-xs text-muted-foreground">
            These fields are not sent to the backend profile endpoint.
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-brand-gradient">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              changePassword();
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            noValidate
          >
            <div>
              <label
                htmlFor={currentPwdId}
                className="text-xs text-muted-foreground"
              >
                Current Password
              </label>
              <Input
                id={currentPwdId}
                autoComplete="current-password"
                type="password"
                value={pwd.currentPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, currentPassword: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor={newPwdId}
                className="text-xs text-muted-foreground"
              >
                New Password
              </label>
              <Input
                id={newPwdId}
                autoComplete="new-password"
                type="password"
                minLength={8}
                value={pwd.newPassword}
                onChange={(e) =>
                  setPwd({ ...pwd, newPassword: e.target.value })
                }
              />
              {pwd.newPassword && (
                <p
                  className={`mt-1 text-[10px] ${
                    passwordStrength(pwd.newPassword).color
                  }`}
                >
                  Strength: {passwordStrength(pwd.newPassword).label}
                </p>
              )}
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={changingPwd}
                aria-disabled={changingPwd}
              >
                {changingPwd ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
