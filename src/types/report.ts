export type AuditStatus = "PASS" | "WARN" | "FAIL" | "MANUAL_CHECK_REQUIRED";

export interface DomainAuditCheck {
  id: string;
  title: string;
  status: AuditStatus;
  summary: string;
  details?: Record<string, unknown>;
  evidence?: string[];
}

export interface DomainSecurityReport {
  type: "OrgAnchorDomainSecurityReport";
  version: "1.0";
  domain: string;
  audited_at: string;
  generated_by: "organchor";
  summary: Record<AuditStatus, number>;
  checks: DomainAuditCheck[];
}
