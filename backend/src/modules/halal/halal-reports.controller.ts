import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../db/client.js";

function num(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0;
  return Number(d);
}

function monthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Three certificate kinds in the module (+ ALL). Competency renewals roll up under COMPETENCY. */
export type HalalReportCertificateType = "ALL" | "BUSINESS_CERTIFICATION" | "PRODUCT_CERTIFICATE" | "COMPETENCY";

export async function listBusinessesWithActiveHalalCertificate(_req: Request, res: Response) {
  try {
    const now = new Date();
    const certs = await prisma.halalCertificate.findMany({
      where: { status: "VALID", expiresAt: { gt: now } },
      select: {
        businessId: true,
        certificateId: true,
        expiresAt: true,
        issuedAt: true,
        business: { select: { id: true, name: true } },
      },
      orderBy: { expiresAt: "desc" },
    });
    const seen = new Set<string>();
    const items: { id: string; name: string; halalCertificateNumber: string; expiresAt: string; issuedAt: string }[] = [];
    for (const c of certs) {
      if (seen.has(c.businessId)) continue;
      seen.add(c.businessId);
      items.push({
        id: c.business.id,
        name: c.business.name,
        halalCertificateNumber: c.certificateId,
        expiresAt: c.expiresAt.toISOString(),
        issuedAt: c.issuedAt.toISOString(),
      });
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to list businesses";
    res.status(500).json({ message: msg });
  }
}

function parseCertificateType(raw: string | undefined): HalalReportCertificateType {
  const u = (raw ?? "ALL").toUpperCase();
  if (u === "COMPETENCY_RENEWAL") return "COMPETENCY";
  if (u === "BUSINESS_CERTIFICATION" || u === "PRODUCT_CERTIFICATE" || u === "COMPETENCY") return u;
  return "ALL";
}

export async function getHalalReportsOverview(req: Request, res: Response) {
  try {
    const q = req.query;
    const dateFromStr = typeof q.dateFrom === "string" ? q.dateFrom : undefined;
    const dateToStr = typeof q.dateTo === "string" ? q.dateTo : undefined;
    const businessId = typeof q.businessId === "string" && q.businessId.trim() ? q.businessId.trim() : undefined;
    const certificateType = parseCertificateType(typeof q.certificateType === "string" ? q.certificateType : undefined);

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;
    if (dateFromStr) {
      dateFrom = new Date(dateFromStr);
      if (Number.isNaN(dateFrom.getTime())) return res.status(400).json({ message: "Invalid dateFrom" });
    }
    if (dateToStr) {
      dateTo = new Date(dateToStr);
      if (Number.isNaN(dateTo.getTime())) return res.status(400).json({ message: "Invalid dateTo" });
      dateTo.setUTCHours(23, 59, 59, 999);
    }

    const range = (): Prisma.DateTimeFilter | undefined => {
      if (!dateFrom && !dateTo) return undefined;
      return {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    };

    const paidRange = range();
    const activityRange = range();

    const includeType = (t: HalalReportCertificateType) => certificateType === "ALL" || certificateType === t;

    const applicationWherePeriod: Prisma.HalalApplicationWhereInput = businessId
      ? { businessId, ...(activityRange ? { createdAt: activityRange } : {}) }
      : activityRange
        ? { createdAt: activityRange }
        : {};

    const inspectionWhere: Prisma.HalalInspectionWhereInput = {
      completedAt: { not: null, ...(activityRange ?? {}) },
      ...(businessId ? { application: { businessId } } : {}),
    };

    const certificateWhereIssued: Prisma.HalalCertificateWhereInput = {
      ...(businessId ? { businessId } : {}),
      ...(activityRange ? { issuedAt: activityRange } : {}),
    };

    const productIssuedWhere: Prisma.HalalProductCertificateWhereInput = {
      status: "ISSUED",
      ...(businessId ? { businessId } : {}),
      ...(activityRange ? { issuedAt: { not: null, ...activityRange } } : {}),
    };

    const violationWhere: Prisma.HalalViolationWhereInput = {
      ...(businessId ? { certificate: { businessId } } : {}),
      ...(activityRange ? { recordedAt: activityRange } : {}),
    };

    const [
      paidApplications,
      paidProducts,
      paidCompetency,
      paidCompRenewals,
      businessesInPeriod,
      applicationsInPeriod,
      inspectionsCompleted,
      certsIssued,
      productIssued,
      competencyIssued,
      violationsInPeriod,
      appStatusSnapshot,
      competencyStatusSnapshot,
      businessesApprovedTotal,
      productPendingPayment,
      competencyPaymentPending,
    ] = await Promise.all([
      includeType("BUSINESS_CERTIFICATION")
        ? prisma.halalApplication.findMany({
            where: {
              feePaidAt: { not: null, ...(paidRange ?? {}) },
              ...(businessId ? { businessId } : {}),
            },
            select: {
              id: true,
              businessId: true,
              feeAmount: true,
              feePaidAt: true,
              paymentMethod: true,
              business: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      includeType("PRODUCT_CERTIFICATE")
        ? prisma.halalProductCertificate.findMany({
            where: {
              feePaidAt: { not: null, ...(paidRange ?? {}) },
              ...(businessId ? { businessId } : {}),
            },
            select: {
              id: true,
              businessId: true,
              feeAmount: true,
              feePaidAt: true,
              paymentMethod: true,
              business: { select: { id: true, name: true } },
            },
          })
        : Promise.resolve([]),
      includeType("COMPETENCY") && !businessId
        ? prisma.halalCompetencyCertificate.findMany({
            where: {
              feePaidAt: { not: null, ...(paidRange ?? {}) },
            },
            select: {
              id: true,
              feeAmount: true,
              feePaidAt: true,
              paymentMethod: true,
              employerName: true,
              fullName: true,
            },
          })
        : Promise.resolve([]),
      includeType("COMPETENCY") && !businessId
        ? prisma.halalCompetencyRenewal.findMany({
            where: {
              feePaidAt: { not: null, ...(paidRange ?? {}) },
              status: "COMPLETED",
            },
            select: {
              id: true,
              feeAmount: true,
              feePaidAt: true,
              paymentMethod: true,
              competencyId: true,
            },
          })
        : Promise.resolve([]),
      businessId
        ? prisma.halalBusiness.count({
            where: { id: businessId, ...(activityRange ? { createdAt: activityRange } : {}) },
          })
        : activityRange
          ? prisma.halalBusiness.count({ where: { createdAt: activityRange } })
          : prisma.halalBusiness.count(),
      prisma.halalApplication.groupBy({
        by: ["status"],
        where: applicationWherePeriod,
        _count: true,
      }),
      prisma.halalInspection.count({ where: inspectionWhere }),
      prisma.halalCertificate.count({ where: certificateWhereIssued }),
      prisma.halalProductCertificate.count({ where: productIssuedWhere }),
      businessId
        ? Promise.resolve(0)
        : activityRange
          ? prisma.halalCompetencyCertificate.count({
              where: { status: "ISSUED", issuedAt: { not: null, ...activityRange } },
            })
          : prisma.halalCompetencyCertificate.count({ where: { status: "ISSUED" } }),
      prisma.halalViolation.count({ where: violationWhere }),
      prisma.halalApplication.groupBy({
        by: ["status"],
        where: businessId ? { businessId } : {},
        _count: true,
      }),
      businessId
        ? Promise.resolve([] as { status: string; _count: number }[])
        : prisma.halalCompetencyCertificate.groupBy({ by: ["status"], _count: true }),
      prisma.halalBusiness.count({ where: { status: "APPROVED" } }),
      prisma.halalProductCertificate.count({
        where: { status: "PAYMENT_PENDING", ...(businessId ? { businessId } : {}) },
      }),
      businessId
        ? Promise.resolve(0)
        : prisma.halalCompetencyCertificate.count({ where: { status: "PAYMENT_PENDING" } }),
    ]);

    type PayRow = {
      type: HalalReportCertificateType;
      amount: number;
      feePaidAt: Date;
      paymentMethod: string | null;
      businessId?: string;
      businessName?: string;
      label?: string;
    };

    const rows: PayRow[] = [];
    for (const a of paidApplications) {
      if (!a.feePaidAt) continue;
      rows.push({
        type: "BUSINESS_CERTIFICATION",
        amount: num(a.feeAmount),
        feePaidAt: a.feePaidAt,
        paymentMethod: a.paymentMethod ?? null,
        businessId: a.businessId,
        businessName: a.business?.name,
      });
    }
    for (const p of paidProducts) {
      if (!p.feePaidAt) continue;
      rows.push({
        type: "PRODUCT_CERTIFICATE",
        amount: num(p.feeAmount),
        feePaidAt: p.feePaidAt,
        paymentMethod: p.paymentMethod ?? null,
        businessId: p.businessId,
        businessName: p.business?.name,
      });
    }
    for (const c of paidCompetency) {
      if (!c.feePaidAt) continue;
      rows.push({
        type: "COMPETENCY",
        amount: num(c.feeAmount),
        feePaidAt: c.feePaidAt,
        paymentMethod: c.paymentMethod ?? null,
        label: c.employerName || c.fullName,
      });
    }
    for (const r of paidCompRenewals) {
      if (!r.feePaidAt) continue;
      rows.push({
        type: "COMPETENCY",
        amount: num(r.feeAmount),
        feePaidAt: r.feePaidAt,
        paymentMethod: r.paymentMethod ?? null,
        label: "Competency renewal",
      });
    }

    const totalPaymentAmount = rows.reduce((s, r) => s + r.amount, 0);
    const totalPaymentCount = rows.length;

    const byCertificateTypeMap = new Map<string, { amount: number; count: number }>();
    for (const r of rows) {
      const cur = byCertificateTypeMap.get(r.type) ?? { amount: 0, count: 0 };
      cur.amount += r.amount;
      cur.count += 1;
      byCertificateTypeMap.set(r.type, cur);
    }
    const byCertificateType = Array.from(byCertificateTypeMap.entries()).map(([type, v]) => ({
      type,
      amount: Math.round(v.amount * 100) / 100,
      count: v.count,
    }));

    const byMethodMap = new Map<string, { amount: number; count: number }>();
    for (const r of rows) {
      const m = (r.paymentMethod || "UNKNOWN").toUpperCase();
      const cur = byMethodMap.get(m) ?? { amount: 0, count: 0 };
      cur.amount += r.amount;
      cur.count += 1;
      byMethodMap.set(m, cur);
    }
    const byPaymentMethod = Array.from(byMethodMap.entries()).map(([method, v]) => ({
      method,
      amount: Math.round(v.amount * 100) / 100,
      count: v.count,
    }));

    const byBusinessMap = new Map<string, { businessId: string; businessName: string; amount: number; count: number }>();
    for (const r of rows) {
      if (!r.businessId) continue;
      const name = r.businessName || r.businessId;
      const cur = byBusinessMap.get(r.businessId) ?? { businessId: r.businessId, businessName: name, amount: 0, count: 0 };
      cur.amount += r.amount;
      cur.count += 1;
      cur.businessName = name;
      byBusinessMap.set(r.businessId, cur);
    }
    const byBusiness = Array.from(byBusinessMap.values())
      .map((b) => ({ ...b, amount: Math.round(b.amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20);

    const typeKeys = ["BUSINESS_CERTIFICATION", "PRODUCT_CERTIFICATE", "COMPETENCY"] as const;
    const monthlyMap = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const mk = monthKey(r.feePaidAt);
      let bucket = monthlyMap.get(mk);
      if (!bucket) {
        bucket = Object.fromEntries(typeKeys.map((k) => [k, 0])) as Record<string, number>;
        monthlyMap.set(mk, bucket);
      }
      bucket[r.type] = (bucket[r.type] ?? 0) + r.amount;
    }
    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amounts]) => ({
        month,
        BUSINESS_CERTIFICATION: Math.round((amounts.BUSINESS_CERTIFICATION ?? 0) * 100) / 100,
        PRODUCT_CERTIFICATE: Math.round((amounts.PRODUCT_CERTIFICATE ?? 0) * 100) / 100,
        COMPETENCY: Math.round((amounts.COMPETENCY ?? 0) * 100) / 100,
      }));

    const applicationsByStatus = Object.fromEntries(applicationsInPeriod.map((g) => [g.status, g._count])) as Record<
      string,
      number
    >;
    const workflowApplications = Object.fromEntries(appStatusSnapshot.map((g) => [g.status, g._count])) as Record<string, number>;
    const workflowCompetency = Object.fromEntries(
      competencyStatusSnapshot.map((g) => [g.status, g._count]),
    ) as Record<string, number>;

    let businessDetail: {
      businessId: string;
      businessName: string;
      halalBusinessCertificate: {
        id: string;
        certificateId: string;
        issuedAt: string;
        expiresAt: string;
        status: string;
      } | null;
      productCertificates: {
        totalCount: number;
        issuedCount: number;
        paymentPendingCount: number;
        cancelledCount: number;
        paidInPeriodAmount: number;
        paidInPeriodTransactionCount: number;
      };
      businessCertification: {
        certificationFeesPaidInPeriodAmount: number;
        certificationFeesPaidInPeriodCount: number;
      };
      combinedBusinessScopedPaidInPeriod: {
        amount: number;
        transactionCount: number;
      };
    } | null = null;

    if (businessId) {
      const now = new Date();
      const b = await prisma.halalBusiness.findUnique({
        where: { id: businessId },
        select: { id: true, name: true },
      });
      if (b) {
        const activeCert = await prisma.halalCertificate.findFirst({
          where: { businessId, status: "VALID", expiresAt: { gt: now } },
          orderBy: { expiresAt: "desc" },
          select: { id: true, certificateId: true, issuedAt: true, expiresAt: true, status: true },
        });

        const [pcTotal, pcIssued, pcPending, pcCancelled, pcPaidInPeriod, bizFeesInPeriod] = await Promise.all([
          prisma.halalProductCertificate.count({ where: { businessId } }),
          prisma.halalProductCertificate.count({ where: { businessId, status: "ISSUED" } }),
          prisma.halalProductCertificate.count({ where: { businessId, status: "PAYMENT_PENDING" } }),
          prisma.halalProductCertificate.count({ where: { businessId, status: "CANCELLED" } }),
          prisma.halalProductCertificate.findMany({
            where: { businessId, feePaidAt: { not: null, ...(paidRange ?? {}) } },
            select: { feeAmount: true },
          }),
          prisma.halalApplication.findMany({
            where: { businessId, feePaidAt: { not: null, ...(paidRange ?? {}) } },
            select: { feeAmount: true },
          }),
        ]);

        const productPaidAmount = pcPaidInPeriod.reduce((s, r) => s + num(r.feeAmount), 0);
        const bizPaidAmount = bizFeesInPeriod.reduce((s, r) => s + num(r.feeAmount), 0);
        const productTx = pcPaidInPeriod.length;
        const bizTx = bizFeesInPeriod.length;

        businessDetail = {
          businessId: b.id,
          businessName: b.name,
          halalBusinessCertificate: activeCert
            ? {
                id: activeCert.id,
                certificateId: activeCert.certificateId,
                issuedAt: activeCert.issuedAt.toISOString(),
                expiresAt: activeCert.expiresAt.toISOString(),
                status: activeCert.status,
              }
            : null,
          productCertificates: {
            totalCount: pcTotal,
            issuedCount: pcIssued,
            paymentPendingCount: pcPending,
            cancelledCount: pcCancelled,
            paidInPeriodAmount: Math.round(productPaidAmount * 100) / 100,
            paidInPeriodTransactionCount: productTx,
          },
          businessCertification: {
            certificationFeesPaidInPeriodAmount: Math.round(bizPaidAmount * 100) / 100,
            certificationFeesPaidInPeriodCount: bizTx,
          },
          combinedBusinessScopedPaidInPeriod: {
            amount: Math.round((productPaidAmount + bizPaidAmount) * 100) / 100,
            transactionCount: productTx + bizTx,
          },
        };
      }
    }

    res.json({
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo?.toISOString() ?? null,
        businessId: businessId ?? null,
        certificateType,
        individualPaymentsIncluded: !businessId,
      },
      businessDetail,
      activity: {
        businessesRegisteredInPeriod: businessesInPeriod,
        applicationsByStatusInPeriod: applicationsByStatus,
        inspectionsCompletedInPeriod: inspectionsCompleted,
        businessCertificatesIssuedInPeriod: certsIssued,
        productCertificatesIssuedInPeriod: productIssued,
        competencyCertificatesIssuedInPeriod: competencyIssued,
        violationsRecordedInPeriod: violationsInPeriod,
      },
      snapshot: {
        approvedBusinessesTotal: businessesApprovedTotal,
        productCertificatesAwaitingPayment: productPendingPayment,
        competencyAwaitingPayment: competencyPaymentPending,
      },
      workflow: {
        applicationsByStatus: workflowApplications,
        competencyByStatus: workflowCompetency,
      },
      payments: {
        currency: "ETB",
        totalAmount: Math.round(totalPaymentAmount * 100) / 100,
        transactionCount: totalPaymentCount,
        byCertificateType,
        byPaymentMethod,
        byBusiness,
        monthlyTrend,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to build halal report";
    res.status(500).json({ message: msg });
  }
}
