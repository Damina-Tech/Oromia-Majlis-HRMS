/** Majlis manual bank transfer options (membership, institution recognition, etc.) */
export type MajlisBank = {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  swiftCode: string;
};

export const MAJLIS_MANUAL_PAYMENT_BANKS: MajlisBank[] = [
  { id: "cbe", name: "Commercial Bank of Ethiopia", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1000600162447", swiftCode: "" },
  { id: "coop", name: "Cooperative Bank of Oromia", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1042200124748", swiftCode: "" },
  { id: "oromia", name: "Oromia Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1371866200002", swiftCode: "" },
  { id: "awash", name: "Awash Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "014100449821400", swiftCode: "" },
  { id: "hijra", name: "Hijra Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1000044440001", swiftCode: "" },
  { id: "ramis", name: "Ramis Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1030000551101", swiftCode: "" },
  { id: "sinqee", name: "Sinqee Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "1058169471818", swiftCode: "" },
  { id: "zemzem", name: "Zemzem Bank", accountName: "Oromia Islamic Affairs Supreme Council", accountNumber: "0006692210301", swiftCode: "" },
];
