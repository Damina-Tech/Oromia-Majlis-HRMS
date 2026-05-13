-- Committee-only fields on Halal certification applications
ALTER TABLE "HalalApplication" ADD COLUMN "committeeNotes" TEXT;
ALTER TABLE "HalalApplication" ADD COLUMN "meetingMinutesUrl" TEXT;
