import { z } from "zod";

export const CreateInstitutionRecognitionDto = z.object({
  institutionNameOnCert: z.string().min(1, "Institution name is required"),
  zoneCityAdmin: z.string().min(1, "Zone / city administration is required"),
  districtSubcity: z.string().min(1, "District / sub-city is required"),
  gandaKebele: z.string().min(1, "Ganda / kebele is required"),
  issueDate: z.coerce.date(),
  questionnaire: z.object({
    applicantRole: z.string().min(1, "Your role is required"),
    operatingWithCommunityConsent: z.enum(["yes", "no"], {
      message: "Please indicate whether the institution operates with community consent",
    }),
    informationAccurate: z
      .boolean()
      .refine((v) => v === true, { message: "You must confirm that the information is accurate" }),
  }),
});

export type CreateInstitutionRecognitionInput = z.infer<typeof CreateInstitutionRecognitionDto>;
