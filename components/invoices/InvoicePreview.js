"use client";

import { forwardRef } from "react";
import { formatCurrency, formatDateHuman, cleanDeliverables } from "./utils";

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
  { invoice = {}, showStatus = true },
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
    <div className="invoice-preview" ref={ref}>
      <div className="invoice-preview__header">
        <div className="invoice-preview__logo">
          {logo ? (
            <img src={logo} alt="Invoice logo" />
          ) : (
            <div className="invoice-preview__logo-placeholder">Logo</div>
          )}
        </div>
        <div className="invoice-preview__meta">
          <h2 className="invoice-preview__title">Invoice</h2>
          <div className="invoice-preview__number">{invoiceNumber || "-"}</div>
          <div className="invoice-preview__dates">
            <div>
              <span className="label">Invoice Date</span>
              <strong>{formatDateHuman(invoiceDate)}</strong>
            </div>
            <div>
              <span className="label">Due Date</span>
              <strong>{formatDateHuman(dueDate)}</strong>
            </div>
          </div>
          {showStatus && status && (
            <div className="invoice-preview__status" aria-hidden="true"></div>
          )}
        </div>
      </div>

      <div className="invoice-preview__parties">
        <div>
          <h3>Billed By</h3>
          <p className="invoice-preview__party-name">{billedBy.name || "-"}</p>
          {billedBy.company && (
            <p className="invoice-preview__party-meta">{billedBy.company}</p>
          )}
          {billedBy.email && (
            <p className="invoice-preview__party-meta">{billedBy.email}</p>
          )}
          {billedBy.phone && (
            <p className="invoice-preview__party-meta">{billedBy.phone}</p>
          )}
          {billedBy.address && (
            <p className="invoice-preview__party-meta">{billedBy.address}</p>
          )}
        </div>
        <div>
          <h3>Billed To</h3>
          <p className="invoice-preview__party-name">
            {billedTo.name || billedTo.company || "-"}
          </p>
          {billedTo.company && (
            <p className="invoice-preview__party-meta">{billedTo.company}</p>
          )}
          {billedTo.email && (
            <p className="invoice-preview__party-meta">{billedTo.email}</p>
          )}
          {billedTo.phone && (
            <p className="invoice-preview__party-meta">{billedTo.phone}</p>
          )}
          {billedTo.address && (
            <p className="invoice-preview__party-meta">{billedTo.address}</p>
          )}
        </div>
      </div>

      <div className="invoice-preview__table">
        <table>
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Service ID</th>
              <th style={{ width: "40%" }}>Service</th>
              <th style={{ width: "10%", textAlign: "center" }}>Qty</th>
              <th style={{ width: "15%", textAlign: "right" }}>Price</th>
              <th style={{ width: "15%", textAlign: "right" }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={`${item.serviceId}-${idx}`}>
                <td>{item.serviceId}</td>
                <td>
                  <div className="invoice-preview__service-name">
                    {item.serviceName}
                  </div>
                  {item.deliverables && (
                    <div
                      className="invoice-preview__service-desc"
                      dangerouslySetInnerHTML={{ __html: item.deliverables }}
                    ></div>
                  )}
                </td>
                <td style={{ textAlign: "center" }}>{item.quantity}</td>
                <td style={{ textAlign: "right" }}>
                  {formatCurrency(item.price, currency)}
                </td>
                <td style={{ textAlign: "right" }}>
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

      <div className="invoice-preview__totals">
        <div>
          <span>Subtotal</span>
          <strong>{formatCurrency(subtotal ?? total, currency)}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{formatCurrency(total ?? subtotal, currency)}</strong>
        </div>
      </div>

      <div className="invoice-payment-card">
        <div className="invoice-payment-card__logo">
          {logoSrc ? (
            <img src={logoSrc} alt={`${providerName} logo`} />
          ) : (
            <span className="invoice-payment-card__logo-fallback">
              {fallbackInitials}
            </span>
          )}
        </div>
        <div className="invoice-payment-card__content">
          <div className="invoice-payment-card__provider">
            {type === "bank_transfer" ? "Bank Transfer" : "E-Wallet"}
          </div>
          <div className="invoice-payment-card__title">{providerName}</div>
          <div className="invoice-payment-card__details">
            {type === "bank_transfer" ? (
              <>
                <div className="invoice-payment-card__detail">
                  <span className="invoice-payment-card__label">
                    Account Name
                  </span>
                  <span className="invoice-payment-card__value">
                    {bank.accountName || "-"}
                  </span>
                </div>
                <div className="invoice-payment-card__detail">
                  <span className="invoice-payment-card__label">
                    Account Number
                  </span>
                  <span className="invoice-payment-card__value">
                    {displayAccountNumber || "-"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="invoice-payment-card__detail">
                  <span className="invoice-payment-card__label">
                    Account Name
                  </span>
                  <span className="invoice-payment-card__value">
                    {ewallet.accountName || "-"}
                  </span>
                </div>
                <div className="invoice-payment-card__detail">
                  <span className="invoice-payment-card__label">
                    Phone Number
                  </span>
                  <span className="invoice-payment-card__value">
                    {ewallet.phoneNumber || "-"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {(terms || footer) && (
        <div className="invoice-preview__footer">
          {terms && (
            <div className="invoice-preview__section">
              <h4>Terms &amp; Conditions</h4>
              <div
                className="invoice-preview__richtext"
            dangerouslySetInnerHTML={{ __html: terms }}
              ></div>
            </div>
          )}
          {footer && (
            <div className="invoice-preview__section">
              <div
                className="invoice-preview__richtext"
                style={{ textAlign: "center" }}
                dangerouslySetInnerHTML={{ __html: footer }}
              ></div>
            </div>
          )}
        </div>
      )}

      <div className="invoice-preview__footnote">
        <span>Smart invoicing powered by </span>
        <img
          src="/images/logo-freyn.png"
          alt="Freyn logo"
          className="invoice-preview__footnote-logo"
        />
        <span style={{ fontWeight: "bold" }}>Freyn</span>
      </div>
    </div>
  );
});

export default InvoicePreview;
