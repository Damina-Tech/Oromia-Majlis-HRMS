import { StateCreator } from "zustand";

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: "contract" | "offer" | "policy" | "form" | "certificate" | "other";
  templateContent: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  required: boolean;
  options?: string[];
  defaultValue?: string;
}

export interface Document {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  employeeId: string;
  employeeName: string;
  status: "draft" | "generated" | "sent" | "signed" | "completed" | "archived";
  generatedContent?: string;
  pdfUrl?: string;
  signedPdfUrl?: string;
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  signedAt?: Date;
  expiryDate?: Date;
  tags: string[];
  version: number;
}

export interface DocumentSlice {
  documents: Document[];
  templates: DocumentTemplate[];
  addDocument: (
    document: Omit<
      Document,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "version"
      | "pdfUrl"
      | "signedPdfUrl"
      | "sentAt"
      | "signedAt"
      | "expiryDate"
    >
  ) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addTemplate: (
    template: Omit<DocumentTemplate, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateTemplate: (id: string, updates: Partial<DocumentTemplate>) => void;
  deleteTemplate: (id: string) => void;
  generateDocument: (
    templateId: string,
    variables: Record<string, any>,
    employeeId: string,
    employeeName: string
  ) => string;
  uploadSignedDocument: (documentId: string, signedPdfUrl: string) => void;
  sendDocument: (documentId: string) => void;
  archiveDocument: (documentId: string) => void;
  getDocumentsByEmployee: (employeeId: string) => Document[];
  getDocumentsByStatus: (status: Document["status"]) => Document[];
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const documentSlice: StateCreator<DocumentSlice> = (set, get) => ({
  documents: [
    {
      id: "1",
      templateId: "offer-letter",
      templateName: "Offer Letter",
      title: "Offer Letter - John Doe",
      employeeId: "emp-001",
      employeeName: "John Doe",
      status: "completed",
      generatedContent: "Generated offer letter content...",
      pdfUrl: "/documents/offer-letter-john-doe.pdf",
      signedPdfUrl: "/documents/offer-letter-john-doe-signed.pdf",
      variables: {
        employeeName: "John Doe",
        position: "Senior Developer",
        salary: "90000",
        startDate: "2024-02-01",
        department: "Engineering",
      },
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      sentAt: new Date("2024-01-16"),
      signedAt: new Date("2024-01-18"),
      tags: ["offer", "engineering"],
      version: 1,
    },
    {
      id: "2",
      templateId: "nda",
      templateName: "Non-Disclosure Agreement",
      title: "NDA - Jane Smith",
      employeeId: "emp-002",
      employeeName: "Jane Smith",
      status: "sent",
      generatedContent: "Generated NDA content...",
      pdfUrl: "/documents/nda-jane-smith.pdf",
      variables: {
        employeeName: "Jane Smith",
        effectiveDate: "2024-01-20",
      },
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
      sentAt: new Date("2024-01-20"),
      expiryDate: new Date("2024-02-20"),
      tags: ["nda", "legal"],
      version: 1,
    },
  ],

  templates: [
    {
      id: "offer-letter",
      name: "Offer Letter",
      description: "Standard job offer letter template",
      category: "offer",
      templateContent: `
        <div class="document">
          <h1>Job Offer Letter</h1>
          <p>Dear {{employeeName}},</p>
          <p>We are pleased to offer you the position of {{position}} at our company.</p>
          <p>Starting Salary: \$\{{ salary }} per year</p>
          <p>Start Date: {{startDate}}</p>
          <p>Department: {{department}}</p>
          <p>Please sign and return this letter to confirm your acceptance.</p>
          <p>Sincerely,<br>HR Department</p>
        </div>
      `,
      variables: [
        {
          name: "employeeName",
          label: "Employee Name",
          type: "text",
          required: true,
        },
        { name: "position", label: "Position", type: "text", required: true },
        {
          name: "salary",
          label: "Annual Salary",
          type: "number",
          required: true,
        },
        {
          name: "startDate",
          label: "Start Date",
          type: "date",
          required: true,
        },
        {
          name: "department",
          label: "Department",
          type: "select",
          required: true,
          options: ["Engineering", "HR", "Finance", "Marketing", "Sales"],
        },
      ],
      isActive: true,
      createdAt: new Date("2023-12-01"),
      updatedAt: new Date("2023-12-01"),
      createdBy: "admin-001",
    },
    {
      id: "nda",
      name: "Non-Disclosure Agreement",
      description: "Standard NDA template for employees",
      category: "contract",
      templateContent: `
        <div class="document">
          <h1>Non-Disclosure Agreement</h1>
          <p>This agreement is between {{employeeName}} and the Company.</p>
          <p>Effective Date: {{effectiveDate}}</p>
          <p>The employee agrees to maintain confidentiality of all proprietary information.</p>
          <p>This agreement remains in effect during and after employment.</p>
        </div>
      `,
      variables: [
        {
          name: "employeeName",
          label: "Employee Name",
          type: "text",
          required: true,
        },
        {
          name: "effectiveDate",
          label: "Effective Date",
          type: "date",
          required: true,
        },
      ],
      isActive: true,
      createdAt: new Date("2023-12-01"),
      updatedAt: new Date("2023-12-01"),
      createdBy: "admin-001",
    },
  ],

  addDocument: (documentData) => {
    const document: Document = {
      ...documentData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      pdfUrl: undefined,
      signedPdfUrl: undefined,
      sentAt: undefined,
      signedAt: undefined,
      expiryDate: undefined,
      version: 1,
    };

    set((state) => ({
      documents: [...state.documents, document],
    }));
  },

  updateDocument: (id, updates) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date() } : doc
      ),
    }));
  },

  deleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
    }));
  },

  addTemplate: (templateData) => {
    const template: DocumentTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      templates: [...state.templates, template],
    }));
  },

  updateTemplate: (id, updates) => {
    set((state) => ({
      templates: state.templates.map((template) =>
        template.id === id
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      ),
    }));
  },

  deleteTemplate: (id) => {
    set((state) => ({
      templates: state.templates.filter((template) => template.id !== id),
    }));
  },

  generateDocument: (templateId, variables, employeeId, employeeName) => {
    const template = get().templates.find((t) => t.id === templateId);
    if (!template) throw new Error("Template not found");

    let content = template.templateContent;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${escapeRegExp(key)}}}`, "g");
      content = content.replace(regex, String(value));
    });

    const documentId = crypto.randomUUID();

    const document: Document = {
      id: documentId,
      templateId,
      templateName: template.name,
      title: `${template.name} - ${employeeName}`,
      employeeId,
      employeeName,
      status: "generated",
      generatedContent: content,
      pdfUrl: undefined,
      signedPdfUrl: undefined,
      sentAt: undefined,
      signedAt: undefined,
      expiryDate: undefined,
      variables,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [template.category],
      version: 1,
    };

    set((state) => ({
      documents: [...state.documents, document],
    }));

    return documentId;
  },

  uploadSignedDocument: (documentId, signedPdfUrl) => {
    get().updateDocument(documentId, {
      signedPdfUrl,
      status: "signed",
      signedAt: new Date(),
    });
  },

  sendDocument: (documentId) => {
    get().updateDocument(documentId, {
      status: "sent",
      sentAt: new Date(),
    });
  },

  archiveDocument: (documentId) => {
    get().updateDocument(documentId, {
      status: "archived",
    });
  },

  getDocumentsByEmployee: (employeeId) => {
    return get().documents.filter((doc) => doc.employeeId === employeeId);
  },

  getDocumentsByStatus: (status) => {
    return get().documents.filter((doc) => doc.status === status);
  },
});
