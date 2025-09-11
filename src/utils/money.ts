import Decimal from "decimal.js";

export const computeFees = (gross: Decimal) => {
  const brokerage = Decimal.max(new Decimal(5), gross.mul(0.002));
  const stt = gross.mul(0.001);
  const gst = brokerage.mul(0.18);
  const totalFees = brokerage.plus(stt).plus(gst);
  return {
    brokerage,
    stt,
    gst,
    totalFees,
  };
};
