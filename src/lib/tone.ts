export function getEventStatusTone(status: string): string {
  if (status === "published") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  if (status === "draft") {
    return "border-status-warning/40 bg-status-warning/18 text-status-warning";
  }
  return "border-status-danger/40 bg-status-danger/18 text-status-danger";
}

export function getPaymentStatusTone(status: string): string {
  if (status === "paid") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  if (status === "under_review") {
    return "border-status-warning/40 bg-status-warning/18 text-status-warning";
  }
  if (status === "pending") {
    return "border-status-info/40 bg-status-info/18 text-status-info";
  }
  if (status === "refunded") {
    return "border-status-warning/40 bg-status-warning/18 text-status-warning";
  }
  if (status === "waived") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  return "border-status-danger/40 bg-status-danger/18 text-status-danger";
}

export function getRegistrationStatusTone(status: string): string {
  if (status === "confirmed" || status === "attended") {
    return "border-status-success/40 bg-status-success/18 text-status-success";
  }
  if (status === "submitted" || status === "waitlisted") {
    return "border-status-info/40 bg-status-info/18 text-status-info";
  }
  if (status === "cancelled_by_user" || status === "cancelled_by_admin" || status === "no_show") {
    return "border-status-danger/40 bg-status-danger/18 text-status-danger";
  }
  return "border-status-warning/40 bg-status-warning/18 text-status-warning";
}

export function getEventTypeTone(type: string): string {
  if (type === "online") {
    return "border-status-info/40 bg-status-info/18 text-status-info";
  }
  return "border-status-success/40 bg-status-success/18 text-status-success";
}
