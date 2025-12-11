import { z } from "zod";
export declare const EmpStatusEnum: z.ZodEnum<{
    ACTIVE: "ACTIVE";
    INACTIVE: "INACTIVE";
    ON_LEAVE: "ON_LEAVE";
}>;
export declare const CreateEmployeeDto: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dateOfBirth: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    gender: z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        OTHER: "OTHER";
    }>>, z.ZodLiteral<"">]>;
    address: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    emergencyContact: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    designation: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    employmentType: z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        FULL_TIME: "FULL_TIME";
        PART_TIME: "PART_TIME";
        CONTRACT: "CONTRACT";
        INTERN: "INTERN";
        TEMPORARY: "TEMPORARY";
    }>>, z.ZodLiteral<"">]>;
    educationLevel: z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        GRADE_8: "GRADE_8";
        GRADE_10: "GRADE_10";
        GRADE_12: "GRADE_12";
        DEGREE: "DEGREE";
        MASTER: "MASTER";
        PHD: "PHD";
    }>>, z.ZodLiteral<"">]>;
    educationOther: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    educationField: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    marriageStatus: z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        SINGLE: "SINGLE";
        MARRIED: "MARRIED";
        DIVORCED: "DIVORCED";
        WIDOWED: "WIDOWED";
    }>>, z.ZodLiteral<"">]>;
    document: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    avatarUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    status: z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ON_LEAVE: "ON_LEAVE";
    }>>;
    joiningDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    salary: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    departmentId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    managerId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    createUserAccount: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    userPassword: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    userRoleId: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const UpdateEmployeeDto: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    dateOfBirth: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    gender: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        OTHER: "OTHER";
    }>>, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    emergencyContact: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    designation: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    employmentType: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        FULL_TIME: "FULL_TIME";
        PART_TIME: "PART_TIME";
        CONTRACT: "CONTRACT";
        INTERN: "INTERN";
        TEMPORARY: "TEMPORARY";
    }>>, z.ZodLiteral<"">]>>;
    educationLevel: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        OTHER: "OTHER";
        GRADE_8: "GRADE_8";
        GRADE_10: "GRADE_10";
        GRADE_12: "GRADE_12";
        DEGREE: "DEGREE";
        MASTER: "MASTER";
        PHD: "PHD";
    }>>, z.ZodLiteral<"">]>>;
    educationOther: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    educationField: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    marriageStatus: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodEnum<{
        SINGLE: "SINGLE";
        MARRIED: "MARRIED";
        DIVORCED: "DIVORCED";
        WIDOWED: "WIDOWED";
    }>>, z.ZodLiteral<"">]>>;
    document: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    avatarUrl: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ON_LEAVE: "ON_LEAVE";
    }>>>;
    joiningDate: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    departmentId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    managerId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    createUserAccount: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    userPassword: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    userRoleId: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
}, z.core.$strip>;
export declare const ListEmployeesQuery: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        INACTIVE: "INACTIVE";
        ON_LEAVE: "ON_LEAVE";
    }>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const IdCardCodeTypeEnum: z.ZodEnum<{
    QR: "QR";
    BARCODE: "BARCODE";
    NONE: "NONE";
}>;
export declare const IdCardSizeEnum: z.ZodEnum<{
    ID1: "ID1";
    ID2: "ID2";
    ID3: "ID3";
    CUSTOM: "CUSTOM";
}>;
export declare const IdCardLayoutEnum: z.ZodEnum<{
    PHOTO_LEFT: "PHOTO_LEFT";
    PHOTO_RIGHT: "PHOTO_RIGHT";
    PHOTO_TOP: "PHOTO_TOP";
}>;
export declare const IdCardTemplateSettingsSchema: z.ZodObject<{
    size: z.ZodDefault<z.ZodEnum<{
        ID1: "ID1";
        ID2: "ID2";
        ID3: "ID3";
        CUSTOM: "CUSTOM";
    }>>;
    customDimensions: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>>;
    background: z.ZodDefault<z.ZodObject<{
        type: z.ZodDefault<z.ZodEnum<{
            color: "color";
            image: "image";
        }>>;
        value: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    border: z.ZodDefault<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        color: z.ZodDefault<z.ZodString>;
        radius: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    text: z.ZodDefault<z.ZodObject<{
        color: z.ZodDefault<z.ZodString>;
        fontFamily: z.ZodDefault<z.ZodString>;
        fontSize: z.ZodDefault<z.ZodNumber>;
        headingSize: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    layout: z.ZodDefault<z.ZodEnum<{
        PHOTO_LEFT: "PHOTO_LEFT";
        PHOTO_RIGHT: "PHOTO_RIGHT";
        PHOTO_TOP: "PHOTO_TOP";
    }>>;
    fieldVisibility: z.ZodDefault<z.ZodObject<{
        showEmployeeName: z.ZodDefault<z.ZodBoolean>;
        showJobTitle: z.ZodDefault<z.ZodBoolean>;
        showDepartment: z.ZodDefault<z.ZodBoolean>;
        showEmployeeCode: z.ZodDefault<z.ZodBoolean>;
        showPhoto: z.ZodDefault<z.ZodBoolean>;
        showCompanyLogo: z.ZodDefault<z.ZodBoolean>;
        showIssueDate: z.ZodDefault<z.ZodBoolean>;
        showExpiryDate: z.ZodDefault<z.ZodBoolean>;
        showBarcode: z.ZodDefault<z.ZodBoolean>;
        showSignature: z.ZodDefault<z.ZodBoolean>;
        showStamp: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    assets: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        logoUrl: z.ZodOptional<z.ZodString>;
        signatureUrl: z.ZodOptional<z.ZodString>;
        stampUrl: z.ZodOptional<z.ZodString>;
        backgroundUrl: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    extraLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
    codeType: z.ZodDefault<z.ZodEnum<{
        QR: "QR";
        BARCODE: "BARCODE";
        NONE: "NONE";
    }>>;
    placement: z.ZodOptional<z.ZodObject<{
        photo: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
        content: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CreateIdCardTemplateDto: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    settings: z.ZodObject<{
        size: z.ZodDefault<z.ZodEnum<{
            ID1: "ID1";
            ID2: "ID2";
            ID3: "ID3";
            CUSTOM: "CUSTOM";
        }>>;
        customDimensions: z.ZodOptional<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
        background: z.ZodDefault<z.ZodObject<{
            type: z.ZodDefault<z.ZodEnum<{
                color: "color";
                image: "image";
            }>>;
            value: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        border: z.ZodDefault<z.ZodObject<{
            width: z.ZodDefault<z.ZodNumber>;
            color: z.ZodDefault<z.ZodString>;
            radius: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        text: z.ZodDefault<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            fontFamily: z.ZodDefault<z.ZodString>;
            fontSize: z.ZodDefault<z.ZodNumber>;
            headingSize: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        layout: z.ZodDefault<z.ZodEnum<{
            PHOTO_LEFT: "PHOTO_LEFT";
            PHOTO_RIGHT: "PHOTO_RIGHT";
            PHOTO_TOP: "PHOTO_TOP";
        }>>;
        fieldVisibility: z.ZodDefault<z.ZodObject<{
            showEmployeeName: z.ZodDefault<z.ZodBoolean>;
            showJobTitle: z.ZodDefault<z.ZodBoolean>;
            showDepartment: z.ZodDefault<z.ZodBoolean>;
            showEmployeeCode: z.ZodDefault<z.ZodBoolean>;
            showPhoto: z.ZodDefault<z.ZodBoolean>;
            showCompanyLogo: z.ZodDefault<z.ZodBoolean>;
            showIssueDate: z.ZodDefault<z.ZodBoolean>;
            showExpiryDate: z.ZodDefault<z.ZodBoolean>;
            showBarcode: z.ZodDefault<z.ZodBoolean>;
            showSignature: z.ZodDefault<z.ZodBoolean>;
            showStamp: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        assets: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            signatureUrl: z.ZodOptional<z.ZodString>;
            stampUrl: z.ZodOptional<z.ZodString>;
            backgroundUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        extraLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        codeType: z.ZodDefault<z.ZodEnum<{
            QR: "QR";
            BARCODE: "BARCODE";
            NONE: "NONE";
        }>>;
        placement: z.ZodOptional<z.ZodObject<{
            photo: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            content: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const UpdateIdCardTemplateDto: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    settings: z.ZodOptional<z.ZodObject<{
        size: z.ZodDefault<z.ZodEnum<{
            ID1: "ID1";
            ID2: "ID2";
            ID3: "ID3";
            CUSTOM: "CUSTOM";
        }>>;
        customDimensions: z.ZodOptional<z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, z.core.$strip>>;
        background: z.ZodDefault<z.ZodObject<{
            type: z.ZodDefault<z.ZodEnum<{
                color: "color";
                image: "image";
            }>>;
            value: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        border: z.ZodDefault<z.ZodObject<{
            width: z.ZodDefault<z.ZodNumber>;
            color: z.ZodDefault<z.ZodString>;
            radius: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        text: z.ZodDefault<z.ZodObject<{
            color: z.ZodDefault<z.ZodString>;
            fontFamily: z.ZodDefault<z.ZodString>;
            fontSize: z.ZodDefault<z.ZodNumber>;
            headingSize: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        layout: z.ZodDefault<z.ZodEnum<{
            PHOTO_LEFT: "PHOTO_LEFT";
            PHOTO_RIGHT: "PHOTO_RIGHT";
            PHOTO_TOP: "PHOTO_TOP";
        }>>;
        fieldVisibility: z.ZodDefault<z.ZodObject<{
            showEmployeeName: z.ZodDefault<z.ZodBoolean>;
            showJobTitle: z.ZodDefault<z.ZodBoolean>;
            showDepartment: z.ZodDefault<z.ZodBoolean>;
            showEmployeeCode: z.ZodDefault<z.ZodBoolean>;
            showPhoto: z.ZodDefault<z.ZodBoolean>;
            showCompanyLogo: z.ZodDefault<z.ZodBoolean>;
            showIssueDate: z.ZodDefault<z.ZodBoolean>;
            showExpiryDate: z.ZodDefault<z.ZodBoolean>;
            showBarcode: z.ZodDefault<z.ZodBoolean>;
            showSignature: z.ZodDefault<z.ZodBoolean>;
            showStamp: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strip>>;
        assets: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            logoUrl: z.ZodOptional<z.ZodString>;
            signatureUrl: z.ZodOptional<z.ZodString>;
            stampUrl: z.ZodOptional<z.ZodString>;
            backgroundUrl: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        extraLines: z.ZodDefault<z.ZodArray<z.ZodString>>;
        codeType: z.ZodDefault<z.ZodEnum<{
            QR: "QR";
            BARCODE: "BARCODE";
            NONE: "NONE";
        }>>;
        placement: z.ZodOptional<z.ZodObject<{
            photo: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, z.core.$strip>>;
            content: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    isDefault: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, z.core.$strip>;
export declare const GenerateIdCardDto: z.ZodObject<{
    templateId: z.ZodOptional<z.ZodString>;
    issueDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    expiryDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    codeType: z.ZodOptional<z.ZodEnum<{
        QR: "QR";
        BARCODE: "BARCODE";
        NONE: "NONE";
    }>>;
    forceRegenerate: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const BatchGenerateIdCardDto: z.ZodObject<{
    templateId: z.ZodString;
    employeeIds: z.ZodArray<z.ZodString>;
    issueDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    expiryDate: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export type IdCardTemplateSettings = z.infer<typeof IdCardTemplateSettingsSchema>;
//# sourceMappingURL=employee.dto.d.ts.map