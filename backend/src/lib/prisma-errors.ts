import { Prisma } from "@prisma/client";

const FK_TABLE_LABELS: Record<string, string> = {
  DocumentTemplate: "document templates",
  HalalCertificateTemplate: "certificate templates",
  InstitutionRecognition: "institution recognitions",
  MembershipSubscription: "membership subscriptions",
};

function labelFromConstraintMessage(message: string): string | null {
  for (const [table, label] of Object.entries(FK_TABLE_LABELS)) {
    if (message.includes(table)) return label;
  }
  const quoted = message.match(/table "([^"]+)"/);
  if (quoted?.[1]) {
    return quoted[1].replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  }
  return null;
}

/** User-facing message when a delete hits a foreign-key RESTRICT constraint. */
export function foreignKeyDeleteMessage(error: unknown, context = "record"): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003" || error.code === "P2014") {
      const field = typeof error.meta?.field_name === "string" ? error.meta.field_name : null;
      if (field) {
        return `Cannot delete this ${context} because it is still referenced by ${field.replace(/_fkey$/, "").replace(/_/g, " ")}.`;
      }
      return `Cannot delete this ${context} because it is still referenced by other system records.`;
    }
  }

  if (!(error instanceof Error)) return null;
  const message = error.message;
  if (!/foreign key constraint|RESTRICT|violates/i.test(message)) return null;

  const related = labelFromConstraintMessage(message);
  if (related) {
    return `Cannot delete this ${context} because the linked login account is still referenced by ${related}. Remove or reassign those records first.`;
  }

  return `Cannot delete this ${context} because the linked login account is still referenced by other system records.`;
}

export function membershipDeleteErrorMessage(error: unknown): string | null {
  return foreignKeyDeleteMessage(error, "member");
}
