"use client";

import Image from "next/image";
import { forwardRef } from "react";
import { formatCurrency, formatDateHuman } from "./utils";

const BANK_LOGOS = {
  bca: "/images/payment-providers/bank-bca.svg",
  bri: "/images/payment-providers/bank-bri.svg",
  mandiri: "/images/payment-providers/bank-mandiri.svg",
  bni: "/images/payment-providers/bank-bni.svg",
  "cimb-niaga": "/images/payment-providers/bank-cimb.svg",
  permata: "/images/payment-providers/bank-permata.svg",
  "ocbc-nisp": "/images/payment-providers/bank-ocbc.svg",
  danamon: "/images/payment-providers/bank-danamon.svg",
  others: "/images/payment-providers/bank-generic.svg",
  default: "/images/payment-providers/bank-generic.svg",
};

const EWALLET_LOGOS = {
  dana: "/images/payment-providers/ewallet-dana.svg",
  ovo: "/images/payment-providers/ewallet-ovo.svg",
  shopeepay: "/images/payment-providers/ewallet-shopeepay.svg",
  gopay: "/images/payment-providers/ewallet-gopay.svg",
  linkaja: "/images/payment-providers/ewallet-linkaja.svg",
  "jenius-pay": "/images/payment-providers/ewallet-jenius-pay.svg",
  default: "/images/payment-providers/ewallet-generic.svg",
};

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatAccountNumber = (value = "") =>
  value
    .toString()
    .replace(/\s+/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();

const InvoicePreview = forwardRef(function InvoicePreview(
  { invoice = {}, showStatus = true, constrained = true },
  ref
) {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
    logo,
    billedBy = {},
    billedTo = {},
    items = [],
    terms,
    footer,
    subtotal,
    total,
    currency = "IDR",
    status = "draft",
    paymentMethod = {},
  } = invoice;

  const type = paymentMethod.type === "e_wallet" ? "e_wallet" : "bank_transfer";
  const bank = paymentMethod.bank || {};
  const ewallet = paymentMethod.ewallet || {};
  const providerName =
    type === "bank_transfer"
      ? bank.name || "Bank Transfer"
      : ewallet.provider || "E-Wallet";
  const logoMap = type === "bank_transfer" ? BANK_LOGOS : EWALLET_LOGOS;
  const logoKey = slugify(providerName) || "default";
  const logoSrc = logoMap[logoKey] || logoMap.default;
  const fallbackInitials =
    providerName
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PM";
  const displayAccountNumber =
    type === "bank_transfer" && bank.accountNumber
      ? formatAccountNumber(bank.accountNumber)
      : bank.accountNumber || "";

  return (
    <div
      ref={ref}
      className={`invoice-preview bg-white flex flex-col gap-6 p-5 border-0 rounded-lg sm:gap-8 sm:p-8 sm:rounded-2xl sm:border sm:border-slate-200 ${constrained ? "max-w-[900px] mx-auto" : "w-full"
        }`}
    >
      <div className="flex items-center justify-between gap-3 sm:items-start sm:gap-8">
        <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-100 bg-slate-100 w-14 h-14 sm:w-[140px] sm:h-[140px] [&>span]:!flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:justify-center">
          {logo ? (
            <Image
              src={logo}
              alt="Invoice logo"
              fill
              sizes="140px"
              className="!static !h-auto !w-auto !max-w-full !max-h-full !min-w-0 !min-h-0 !object-contain"
              unoptimized
              style={{ objectFit: "contain", padding: 8 }}
            />
          ) : (
            <div className="text-sm text-slate-500 uppercase tracking-[1px]">
              Logo
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-end gap-1 sm:gap-3">
          <h2 className="m-0 text-slate-900 text-base sm:text-[28px]">
            Invoice
          </h2>
          <div className="text-[11px] sm:text-sm text-slate-500">
            {invoiceNumber || "-"}
          </div>
          <div className="flex gap-2.5 sm:gap-6">
            <div>
              <span className="block uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                Invoice Date
              </span>
              <strong className="text-[11px] sm:text-sm">
                {formatDateHuman(invoiceDate)}
              </strong>
            </div>
            <div>
              <span className="block uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                Due Date
              </span>
              <strong className="text-[11px] sm:text-sm">
                {formatDateHuman(dueDate)}
              </strong>
            </div>
          </div>
          {showStatus && status && (
            <div className="self-start sm:self-end" aria-hidden="true"></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-6">
        <div>
          <h3 className="uppercase text-slate-500 text-[11px] mb-2 sm:text-sm sm:mb-3">
            Billed By
          </h3>
          <p className="font-semibold mb-1 text-[13px] sm:text-base">
            {billedBy.name || "-"}
          </p>
          {billedBy.company && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedBy.company}
            </p>
          )}
          {billedBy.email && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedBy.email}
            </p>
          )}
          {billedBy.phone && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedBy.phone}
            </p>
          )}
          {billedBy.address && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedBy.address}
            </p>
          )}
        </div>
        <div>
          <h3 className="uppercase text-slate-500 text-[11px] mb-2 sm:text-sm sm:mb-3">
            Billed To
          </h3>
          <p className="font-semibold mb-1 text-[13px] sm:text-base">
            {billedTo.name || billedTo.company || "-"}
          </p>
          {billedTo.company && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedTo.company}
            </p>
          )}
          {billedTo.email && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedTo.email}
            </p>
          )}
          {billedTo.phone && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedTo.phone}
            </p>
          )}
          {billedTo.address && (
            <p className="text-slate-500 mb-0.5 text-[10px] sm:text-xs">
              {billedTo.address}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-[13px] border border-slate-100 sm:overflow-hidden">
        <table className="w-full border-collapse text-xs rounded-xl overflow-hidden min-w-[480px] sm:min-w-0">
          <thead>
            <tr>
              <th
                className="text-left bg-slate-100 p-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.5px] text-slate-500"
                style={{ width: "20%" }}
              >
                Service ID
              </th>
              <th
                className="text-left bg-slate-100 p-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.5px] text-slate-500"
                style={{ width: "40%" }}
              >
                Service
              </th>
              <th
                className="text-left bg-slate-100 p-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.5px] text-slate-500"
                style={{ width: "10%", textAlign: "center" }}
              >
                Qty
              </th>
              <th
                className="text-left bg-slate-100 p-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.5px] text-slate-500"
                style={{ width: "15%", textAlign: "right" }}
              >
                Price
              </th>
              <th
                className="text-left bg-slate-100 p-3 border-b border-slate-100 text-[11px] uppercase tracking-[0.5px] text-slate-500"
                style={{ width: "15%", textAlign: "right" }}
              >
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.serviceId}-${idx}`}>
                <td className="py-3.5 px-3 border-b border-slate-100 align-top">
                  {item.serviceId}
                </td>
                <td className="py-3.5 px-3 border-b border-slate-100 align-top">
                  <div className="font-semibold mb-1 text-slate-900">
                    {item.serviceName}
                  </div>
                  {item.deliverables && (
                    <div
                      className="text-slate-500 text-[11px] leading-[1.4] [&_p]:my-1 [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4 [&_li]:my-0.5"
                      dangerouslySetInnerHTML={{ __html: item.deliverables }}
                    ></div>
                  )}
                </td>
                <td
                  className="py-3.5 px-3 border-b border-slate-100 align-top"
                  style={{ textAlign: "center" }}
                >
                  {item.quantity}
                </td>
                <td
                  className="py-3.5 px-3 border-b border-slate-100 align-top"
                  style={{ textAlign: "right" }}
                >
                  {formatCurrency(item.price, currency)}
                </td>
                <td
                  className="py-3.5 px-3 border-b border-slate-100 align-top"
                  style={{ textAlign: "right" }}
                >
                  {formatCurrency(
                    item.subtotal || item.quantity * item.price,
                    currency
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center justify-between gap-4 min-w-0 sm:gap-20 sm:min-w-[240px]">
          <span className="text-slate-500 text-xs uppercase">Subtotal</span>
          <strong className="text-base text-slate-900">
            {formatCurrency(subtotal ?? total, currency)}
          </strong>
        </div>
        <div className="flex items-center justify-between gap-4 min-w-0 sm:gap-20 sm:min-w-[240px]">
          <span className="text-slate-500 text-xs uppercase">Total</span>
          <strong className="text-base text-slate-900">
            {formatCurrency(total ?? subtotal, currency)}
          </strong>
        </div>
      </div>

      <div className="mt-6 border border-slate-100 rounded-[14px] bg-slate-100 flex items-center flex-wrap gap-3 p-3 sm:gap-6 sm:p-4">
        <div className="relative flex items-center justify-center overflow-hidden rounded-[18px] bg-white w-12 h-12 sm:w-16 sm:h-16">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={`${providerName} logo`}
              fill
              sizes="64px"
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="text-lg font-semibold text-slate-500">
              {fallbackInitials}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-[220px] flex flex-col gap-2">
          <div className="uppercase tracking-[0.6px] text-slate-500 text-[9px] sm:text-[11px]">
            {type === "bank_transfer" ? "Bank Transfer" : "E-Wallet"}
          </div>
          <div className="font-semibold text-slate-900 text-sm sm:text-lg">
            {providerName}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))] sm:gap-3">
            {type === "bank_transfer" ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                    Account Name
                  </span>
                  <span className="text-slate-900 break-words text-[11px] sm:text-[13px]">
                    {bank.accountName || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                    Account Number
                  </span>
                  <span className="text-slate-900 break-words text-[11px] sm:text-[13px]">
                    {displayAccountNumber || "-"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                    Account Name
                  </span>
                  <span className="text-slate-900 break-words text-[11px] sm:text-[13px]">
                    {ewallet.accountName || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="uppercase tracking-[0.5px] text-slate-500 text-[9px] sm:text-[11px]">
                    Phone Number
                  </span>
                  <span className="text-slate-900 break-words text-[11px] sm:text-[13px]">
                    {ewallet.phoneNumber || "-"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(terms || footer) && (
        <div className="grid grid-cols-1 gap-5 sm:gap-8">
          {terms && (
            <div className="flex flex-col gap-3">
              <h4 className="mb-2 text-[13px] uppercase text-slate-500">
                Terms &amp; Conditions
              </h4>
              <div
                className="text-slate-800 break-words text-[13px] sm:text-xs [&_p]:mb-2 [&_ul]:my-1.5 [&_ul]:pl-[18px] [&_ol]:my-1.5 [&_ol]:pl-[18px] [&_li]:mb-1"
                dangerouslySetInnerHTML={{ __html: terms }}
              ></div>
            </div>
          )}
          {footer && (
            <div className="flex flex-col gap-3">
              <div
                className="text-slate-800 break-words text-[13px] sm:text-xs text-center [&_p]:mb-2 [&_ul]:my-1.5 [&_ul]:pl-[18px] [&_ol]:my-1.5 [&_ol]:pl-[18px] [&_li]:mb-1"
                dangerouslySetInnerHTML={{ __html: footer }}
              ></div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 tracking-[0.5px]">
        <span>Smart invoicing powered by</span>
        <Image
          src="/images/logo-freyn.png"
          alt="Freyn logo"
          width={16}
          height={16}
          className="!w-4 !h-4 !object-contain block"
          unoptimized
        />
        <span className="font-bold text-slate-900">Freyn</span>
      </div>
    </div>
  );
});

export default InvoicePreview;
