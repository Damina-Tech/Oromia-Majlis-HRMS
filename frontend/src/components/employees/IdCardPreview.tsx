import React, { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { IdCardTemplateSettings } from "@/services/employeeId";
import { cn } from "@/lib/utils";
import { resolveFileUrl } from "@/config/api";

type PreviewEmployee = {
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation?: string | null;
  department?: { name?: string | null } | null;
  avatarUrl?: string | null;
};

interface IdCardPreviewProps {
  template: IdCardTemplateSettings;
  employee: PreviewEmployee;
  issueDate?: string;
  expiryDate?: string;
  className?: string;
  side?: "front" | "back";
}

const CARD_DIMENSIONS = {
  ID1: { width: 1011, height: 638 },
  ID2: { width: 1030, height: 650 },
  ID3: { width: 638, height: 1011 },
};

const PREVIEW_WIDTH = 320;

const formatDate = (value?: string) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
};

const resolveAssetUrl = resolveFileUrl;

const IdCardPreview: React.FC<IdCardPreviewProps> = ({ template, employee, issueDate, expiryDate, className, side = "front" }) => {
  const dims = CARD_DIMENSIONS[template.size] ?? CARD_DIMENSIONS.ID1;
  const aspectRatio = dims.height / dims.width;
  const width = PREVIEW_WIDTH;
  const height = width * aspectRatio;
  
  const isBack = side === "back";

  const fieldVisibility = template.fieldVisibility ?? {
    showEmployeeName: true,
    showJobTitle: true,
    showDepartment: true,
    showEmployeeCode: true,
    showPhoto: true,
    showCompanyLogo: true,
    showIssueDate: true,
    showExpiryDate: false,
    showBarcode: true,
    showSignature: false,
    showStamp: false,
  };

  const employeeName = `${employee.firstName} ${employee.lastName}`.trim() || employee.employeeCode;

  const layout = template.layout ?? "PHOTO_LEFT";

  const photoSection = useMemo(() => {
    if (!fieldVisibility.showPhoto) return null;
    const photoSrc = resolveAssetUrl(employee.avatarUrl);
    const photoContent = photoSrc ? (
      <img src={photoSrc} alt={employeeName} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-600">
        <span className="text-3xl font-semibold">
          {(employee.firstName?.[0] ?? "").toUpperCase()}
          {(employee.lastName?.[0] ?? "").toUpperCase()}
        </span>
      </div>
    );
    return (
      <div className="overflow-hidden rounded-xl border border-white/40 shadow-inner">
        {photoContent}
      </div>
    );
  }, [employee.avatarUrl, employee.firstName, employee.lastName, employeeName, fieldVisibility.showPhoto]);

  const renderBarcode = () => {
    if (!fieldVisibility.showBarcode) return null;
    if (template.codeType === "BARCODE") {
      return (
        <div className="flex h-12 w-full items-end gap-1 overflow-hidden">
          {Array.from({ length: 20 }).map((_x, idx) => (
            <span
              key={idx}
              className="bg-slate-800"
              style={{ width: idx % 2 === 0 ? 2 : 1, height: `${40 + (idx % 3) * 4}%` }}
            />
          ))}
        </div>
      );
    }
    return (
      <div className="rounded-lg bg-white/80 p-2 shadow-inner">
        <QRCodeCanvas value={employee.employeeCode} size={84} level="H" bgColor="transparent" />
      </div>
    );
  };

  const infoLines: string[] = [];
  if (fieldVisibility.showJobTitle && employee.designation) {
    infoLines.push(employee.designation);
  }
  if (fieldVisibility.showDepartment && employee.department?.name) {
    infoLines.push(employee.department.name);
  }
  if (fieldVisibility.showEmployeeCode) {
    infoLines.push(`ID: ${employee.employeeCode}`);
  }

  const extraLines = template.extraLines ?? [];

  const resolveLine = (line: string) =>
    line
      .replace(/{{\s*name\s*}}/gi, employeeName)
      .replace(/{{\s*employeeCode\s*}}/gi, employee.employeeCode)
      .replace(/{{\s*department\s*}}/gi, employee.department?.name ?? "")
      .replace(/{{\s*issueDate\s*}}/gi, formatDate(issueDate))
      .replace(/{{\s*expiryDate\s*}}/gi, formatDate(expiryDate));

  const headerLogo = fieldVisibility.showCompanyLogo && template.assets?.logoUrl && (
    <img
      src={resolveAssetUrl(template.assets.logoUrl)}
      alt="Logo"
      className="h-10 w-auto object-contain"
      draggable={false}
    />
  );

  const signature = fieldVisibility.showSignature && template.assets?.signatureUrl && (
    <div className="mt-auto">
      <img
        src={resolveAssetUrl(template.assets.signatureUrl)}
        alt="Signature"
        className="h-12 w-auto object-contain"
        draggable={false}
      />
      <p className="text-[10px] text-slate-600">Authorized Signature</p>
    </div>
  );

  const stamp = fieldVisibility.showStamp && template.assets?.stampUrl && (
    <img
      src={resolveAssetUrl(template.assets.stampUrl)}
      alt="Stamp"
      className="absolute bottom-3 right-3 h-16 w-16 opacity-80"
      draggable={false}
    />
  );

  const backgroundStyle =
    template.background?.type === "image"
      ? {
          backgroundImage: `url(${resolveAssetUrl(template.background.value)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { backgroundColor: template.background?.value ?? "#ffffff" };

  if (isBack) {
    // Back side of ID card
    return (
      <div
        className={cn("rounded-3xl border shadow-xl overflow-hidden", className)}
        style={{
          width,
          height,
          borderColor: template.border?.color ?? "#111827",
          borderWidth: template.border?.width ?? 2,
          borderRadius: template.border?.radius ?? 18,
          ...backgroundStyle,
        }}
      >
        <div className="flex h-full w-full flex-col p-4 text-xs text-slate-800 relative">
          {/* Back side content - typically includes terms, contact info, or additional details */}
          <div className="flex-1 flex flex-col justify-center items-center space-y-3">
            {fieldVisibility.showCompanyLogo && template.assets?.logoUrl && (
              <img
                src={resolveAssetUrl(template.assets.logoUrl)}
                alt="Logo"
                className="h-12 w-auto object-contain opacity-80"
                draggable={false}
              />
            )}
            <div className="text-center space-y-2">
              <p className="text-[10px] text-slate-600 font-medium">TERMS & CONDITIONS</p>
              <p className="text-[9px] text-slate-500 leading-relaxed px-2">
                This card is the property of the organization. It must be returned upon termination of employment.
                Unauthorized use is prohibited.
              </p>
            </div>
            {fieldVisibility.showBarcode && (
              <div className="mt-4">{renderBarcode()}</div>
            )}
            {fieldVisibility.showEmployeeCode && (
              <p className="text-[10px] text-slate-600 font-mono">ID: {employee.employeeCode}</p>
            )}
          </div>
          {fieldVisibility.showStamp && template.assets?.stampUrl && (
            <div className="absolute bottom-3 right-3">
              <img
                src={resolveAssetUrl(template.assets.stampUrl)}
                alt="Stamp"
                className="h-16 w-16 opacity-70"
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Front side of ID card
  return (
    <div
      className={cn("rounded-3xl border shadow-xl overflow-hidden", className)}
      style={{
        width,
        height,
        borderColor: template.border?.color ?? "#111827",
        borderWidth: template.border?.width ?? 2,
        borderRadius: template.border?.radius ?? 18,
        ...backgroundStyle,
      }}
    >
      <div className="flex h-full w-full flex-col p-4 text-xs text-slate-800 relative" style={{ fontFamily: template.text?.fontFamily }}>
        {/* Header with logo */}
        {fieldVisibility.showCompanyLogo && template.assets?.logoUrl && (
          <div className="mb-2 flex items-center justify-start">
            <img
              src={resolveAssetUrl(template.assets.logoUrl)}
              alt="Logo"
              className="h-8 w-auto object-contain"
              draggable={false}
            />
          </div>
        )}

        {/* Main content area */}
        <div
          className={cn("flex gap-3 flex-1 min-h-0", {
            "flex-col": layout === "PHOTO_TOP",
            "flex-row-reverse": layout === "PHOTO_RIGHT",
            "flex-row": layout === "PHOTO_LEFT",
          })}
        >
          {/* Photo section */}
          {photoSection && fieldVisibility.showPhoto && (
            <div className={cn("flex-shrink-0", {
              "w-full max-h-32 mb-2": layout === "PHOTO_TOP",
              "w-24": layout === "PHOTO_LEFT" || layout === "PHOTO_RIGHT",
            })}>
              {photoSection}
            </div>
          )}

          {/* Info section */}
          <div className="flex-1 flex flex-col min-w-0 rounded-lg bg-white/80 p-3 shadow-sm backdrop-blur">
            {fieldVisibility.showEmployeeName && (
              <p
                className="font-semibold text-slate-900 truncate mb-1"
                style={{
                  color: template.text?.color,
                  fontSize: `${template.text?.headingSize ?? 18}px`,
                }}
              >
                {employeeName}
              </p>
            )}
            
            {infoLines.length > 0 && (
              <div className="mb-2 space-y-0.5 min-w-0">
                {infoLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-slate-600 truncate"
                    style={{
                      fontSize: `${template.text?.fontSize ?? 12}px`,
                      color: template.text?.color,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {/* Dates */}
            {(fieldVisibility.showIssueDate || fieldVisibility.showExpiryDate) && (
              <div className="space-y-0.5 mb-2">
                {fieldVisibility.showIssueDate && (
                  <p
                    className="text-slate-600"
                    style={{
                      fontSize: `${(template.text?.fontSize ?? 12) - 1}px`,
                    }}
                  >
                    Issued: {formatDate(issueDate)}
                  </p>
                )}
                {fieldVisibility.showExpiryDate && (
                  <p
                    className="text-slate-600"
                    style={{
                      fontSize: `${(template.text?.fontSize ?? 12) - 1}px`,
                    }}
                  >
                    Expires: {formatDate(expiryDate)}
                  </p>
                )}
              </div>
            )}

            {/* Extra lines */}
            {extraLines.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {extraLines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-slate-500"
                    style={{
                      fontSize: `${(template.text?.fontSize ?? 12) - 1}px`,
                    }}
                  >
                    {resolveLine(line)}
                  </p>
                ))}
              </div>
            )}

            {/* Barcode/QR Code */}
            {fieldVisibility.showBarcode && (
              <div className="mt-2 flex justify-center">{renderBarcode()}</div>
            )}
          </div>
        </div>

        {/* Footer with signature and stamp */}
        <div className="mt-2 flex items-end justify-between min-h-[3rem]">
          {fieldVisibility.showSignature && template.assets?.signatureUrl && (
            <div className="flex flex-col items-start">
              <img
                src={resolveAssetUrl(template.assets.signatureUrl)}
                alt="Signature"
                className="h-10 w-auto object-contain"
                draggable={false}
              />
              <p className="text-[9px] text-slate-600 mt-1">Authorized Signature</p>
            </div>
          )}
          {fieldVisibility.showStamp && template.assets?.stampUrl && (
            <div className="flex-shrink-0">
              <img
                src={resolveAssetUrl(template.assets.stampUrl)}
                alt="Stamp"
                className="h-12 w-12 object-contain opacity-90"
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdCardPreview;

