export function nextEmployeeCode(sequence: number) {
    return `EMP-${String(sequence).padStart(6, "0")}`;
  }
  