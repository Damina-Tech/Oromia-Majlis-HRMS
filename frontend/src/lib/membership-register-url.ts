export type MembershipRegisterQueryParams = {
  step: string | null;
  draftToken: string | null;
  subscriptionId: string | null;
  trxRef: string | null;
  refId: string | null;
  chapaStatus: string | null;
};

/** Parse success redirect params; Chapa sometimes returns `&amp;` instead of `&`. */
export function parseMembershipRegisterQueryParams(search: string): MembershipRegisterQueryParams {
  const normalized = search.replace(/&amp;/gi, "&");
  const params = new URLSearchParams(normalized.startsWith("?") ? normalized.slice(1) : normalized);

  let draftToken = params.get("draftToken");
  if (!draftToken) {
    draftToken = params.get("amp;draftToken");
  }
  if (!draftToken) {
    const match = normalized.match(/[?&]draftToken=([^&]+)/);
    if (match?.[1]) draftToken = decodeURIComponent(match[1]);
  }

  let step = params.get("step");
  if (step?.startsWith("success")) {
    step = "success";
  }

  return {
    step,
    draftToken,
    subscriptionId: params.get("subscriptionId"),
    trxRef: params.get("trx_ref"),
    refId: params.get("ref_id"),
    chapaStatus: params.get("status"),
  };
}

export function isMembershipRegisterSuccessRoute(params: MembershipRegisterQueryParams): boolean {
  return params.step === "success";
}
