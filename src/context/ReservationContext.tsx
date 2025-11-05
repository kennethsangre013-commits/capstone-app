import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ReservationPack = { name: string; price: string } | null;
export type ReservationVenue = { mobile: string; address: string } | null;

export type ReservationData = {
  date: Date | null;
  occasions: string[];
  foods: string[];
  pack: ReservationPack;
  venue: ReservationVenue;
};

type ReservationContextType = {
  data: ReservationData;
  setDate: (d: Date | null) => void;
  setOccasions: (o: string[]) => void;
  setFoods: (f: string[]) => void;
  setPack: (p: ReservationPack) => void;
  setVenue: (v: ReservationVenue) => void;
  reset: () => void;
};

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

const initialData: ReservationData = {
  date: null,
  occasions: [],
  foods: [],
  pack: null,
  venue: null,
};

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ReservationData>(initialData);

  const setDate = useCallback((d: Date | null) => setData((prev) => ({ ...prev, date: d })), []);
  const setOccasions = useCallback((o: string[]) => setData((prev) => ({ ...prev, occasions: o })), []);
  const setFoods = useCallback((f: string[]) => setData((prev) => ({ ...prev, foods: f })), []);
  const setPack = useCallback((p: ReservationPack) => setData((prev) => ({ ...prev, pack: p })), []);
  const setVenue = useCallback((v: ReservationVenue) => setData((prev) => ({ ...prev, venue: v })), []);
  const reset = useCallback(() => setData(initialData), []);

  const value = useMemo(() => ({ data, setDate, setOccasions, setFoods, setPack, setVenue, reset }), [data, setDate, setOccasions, setFoods, setPack, setVenue, reset]);

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

export function useReservation() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservation must be used within ReservationProvider");
  return ctx;
}
