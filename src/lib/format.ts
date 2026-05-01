import { format } from "date-fns";

export function formatEventStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    archived: "Archived",
  };
  return map[status] ?? status;
}

export function formatEventType(type: string): string {
  const map: Record<string, string> = {
    onsite: "On-site",
    online: "Online",
    hybrid: "Hybrid",
  };
  return map[type] ?? type;
}

export function formatPaymentStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    under_review: "Under Review",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    waived: "Waived",
  };
  return map[status] ?? status;
}

export function formatRegistrationStatus(status: string): string {
  const map: Record<string, string> = {
    submitted: "Submitted",
    confirmed: "Confirmed",
    cancelled_by_user: "Cancelled by User",
    cancelled_by_admin: "Cancelled by Admin",
    waitlisted: "Waitlisted",
    attended: "Attended",
    no_show: "No-show",
  };
  return map[status] ?? status;
}

export function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    card: "Card",
    bank: "Bank Transfer",
    both: "Card & Bank",
    free: "Free",
  };
  return map[method] ?? method;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy, HH:mm");
}
