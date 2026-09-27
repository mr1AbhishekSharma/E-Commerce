"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "INR" | "USD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amountInUSD: number | null | undefined) => string;
  convertPrice: (amountInUSD: number) => number;
  symbol: string;
  rate: number;
}

const EXCHANGE_RATE = 85; // 1 USD = 85 INR

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("INR");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vibe_currency") as Currency;
      if (saved === "INR" || saved === "USD") {
        setCurrencyState(saved);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("vibe_currency", c);
    } catch (e) {
      console.error(e);
    }
  };

  const convertPrice = (amount: number): number => {
    if (currency === "INR") {
      return Math.round(amount * EXCHANGE_RATE);
    }
    return amount;
  };

  const formatPrice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return "";
    if (currency === "INR") {
      const inrValue = Math.round(amount * EXCHANGE_RATE);
      return `₹${inrValue.toLocaleString("en-IN")}`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        symbol,
        rate: EXCHANGE_RATE,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
