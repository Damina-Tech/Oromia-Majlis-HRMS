import { z } from "zod";
export declare const LeadStageSchema: z.ZodEnum<{
    NEW: "NEW";
    CONTACTED: "CONTACTED";
    QUALIFIED: "QUALIFIED";
    ENGAGED: "ENGAGED";
    PROPOSAL_SENT: "PROPOSAL_SENT";
    NEGOTIATION: "NEGOTIATION";
    READY_TO_CONVERT: "READY_TO_CONVERT";
    CONVERTED: "CONVERTED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const LeadStatusSchema: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    CONVERTED: "CONVERTED";
    ARCHIVED: "ARCHIVED";
}>;
export declare const LeadPrioritySchema: z.ZodEnum<{
    LOW: "LOW";
    MEDIUM: "MEDIUM";
    HIGH: "HIGH";
}>;
export declare const LeadDispositionReasonSchema: z.ZodEnum<{
    PRICE: "PRICE";
    NOT_INTERESTED: "NOT_INTERESTED";
    WRONG_CONTACT: "WRONG_CONTACT";
    COMPETITOR: "COMPETITOR";
    POSTPONED: "POSTPONED";
    OTHER: "OTHER";
}>;
export declare const CreateLeadDto: z.ZodObject<{
    fullName: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
    location: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    education: z.ZodOptional<z.ZodString>;
    interest: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    assignedDepartmentId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
    assignedToUserId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>>;
    stage: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        CONTACTED: "CONTACTED";
        QUALIFIED: "QUALIFIED";
        ENGAGED: "ENGAGED";
        PROPOSAL_SENT: "PROPOSAL_SENT";
        NEGOTIATION: "NEGOTIATION";
        READY_TO_CONVERT: "READY_TO_CONVERT";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    timezone: z.ZodOptional<z.ZodString>;
    potentialValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    allowDuplicate: z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>;
}, z.core.$strip>;
export declare const UpdateLeadDto: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    education: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    interest: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    companyName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedDepartmentId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    assignedToUserId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodPipe<z.ZodLiteral<"">, z.ZodTransform<undefined, "">>]>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>>>;
    stage: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        CONTACTED: "CONTACTED";
        QUALIFIED: "QUALIFIED";
        ENGAGED: "ENGAGED";
        PROPOSAL_SENT: "PROPOSAL_SENT";
        NEGOTIATION: "NEGOTIATION";
        READY_TO_CONVERT: "READY_TO_CONVERT";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    timezone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    potentialValue: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    allowDuplicate: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodCoercedBoolean<unknown>>>>;
    lastContactedAt: z.ZodOptional<z.ZodString>;
    nextFollowUpAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const LeadFilterDto: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    pageSize: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    search: z.ZodOptional<z.ZodString>;
    stage: z.ZodOptional<z.ZodEnum<{
        NEW: "NEW";
        CONTACTED: "CONTACTED";
        QUALIFIED: "QUALIFIED";
        ENGAGED: "ENGAGED";
        PROPOSAL_SENT: "PROPOSAL_SENT";
        NEGOTIATION: "NEGOTIATION";
        READY_TO_CONVERT: "READY_TO_CONVERT";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>;
    assignedToUserId: z.ZodOptional<z.ZodString>;
    assignedDepartmentId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    createdFrom: z.ZodOptional<z.ZodString>;
    createdTo: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const LeadStageChangeDto: z.ZodObject<{
    stage: z.ZodEnum<{
        NEW: "NEW";
        CONTACTED: "CONTACTED";
        QUALIFIED: "QUALIFIED";
        ENGAGED: "ENGAGED";
        PROPOSAL_SENT: "PROPOSAL_SENT";
        NEGOTIATION: "NEGOTIATION";
        READY_TO_CONVERT: "READY_TO_CONVERT";
        CONVERTED: "CONVERTED";
        ARCHIVED: "ARCHIVED";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const LeadAssignDto: z.ZodObject<{
    assignedToUserId: z.ZodString;
    assignedDepartmentId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>;
}, z.core.$strip>;
export declare const LeadNoteDto: z.ZodObject<{
    content: z.ZodString;
    attachments: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, z.core.$strip>>>>;
}, z.core.$strip>;
export declare const LeadDispositionDto: z.ZodObject<{
    reason: z.ZodEnum<{
        PRICE: "PRICE";
        NOT_INTERESTED: "NOT_INTERESTED";
        WRONG_CONTACT: "WRONG_CONTACT";
        COMPETITOR: "COMPETITOR";
        POSTPONED: "POSTPONED";
        OTHER: "OTHER";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const LeadKanbanQueryDto: z.ZodObject<{
    assignedToUserId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<{
        LOW: "LOW";
        MEDIUM: "MEDIUM";
        HIGH: "HIGH";
    }>>;
}, z.core.$strip>;
export type CreateLeadInput = z.infer<typeof CreateLeadDto>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadDto>;
export type LeadFilterInput = z.infer<typeof LeadFilterDto>;
export type LeadStageChangeInput = z.infer<typeof LeadStageChangeDto>;
export type LeadAssignInput = z.infer<typeof LeadAssignDto>;
export type LeadNoteInput = z.infer<typeof LeadNoteDto>;
export type LeadDispositionInput = z.infer<typeof LeadDispositionDto>;
export type LeadKanbanQueryInput = z.infer<typeof LeadKanbanQueryDto>;
//# sourceMappingURL=lead.dto.d.ts.map