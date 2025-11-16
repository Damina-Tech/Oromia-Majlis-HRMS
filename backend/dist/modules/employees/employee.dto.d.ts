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
//# sourceMappingURL=employee.dto.d.ts.map