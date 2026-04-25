"use client";

import { useActionState, useState } from "react";
import { updateBillingInfo } from "../actions";

const s = {
  error: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e05252", marginBottom: 16 } as const,
  success: { background: "#0e2a1a", border: "1px solid #1e5a3a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#52c07a", marginBottom: 16 } as const,
  label: { display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 } as const,
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 14px", color: "#e5e5e5", fontSize: 14, outline: "none", boxSizing: "border-box" as const },
  fieldWrap: { marginBottom: 16 } as const,
  btn: { background: "#8fa4c0", color: "#090909", border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" } as const,
  toggle: { display: "flex", gap: 0, marginBottom: 24 } as const,
  toggleBtn: (active: boolean) => ({
    flex: 1,
    padding: "9px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid #2a2a2a",
    background: active ? "#8fa4c0" : "#1a1a1a",
    color: active ? "#090909" : "#888",
  }),
  hint: { fontSize: 12, color: "#555", marginTop: 4 } as const,
};

type Profile = {
  is_corporate: boolean;
  tc_no: string | null;
  tax_no: string | null;
  tax_office: string | null;
};

export default function FaturaBilgileriForm({ profile }: { profile: Profile }) {
  const [isCorporate, setIsCorporate] = useState(profile.is_corporate);
  const [state, action, pending] = useActionState(updateBillingInfo, { error: null, success: false });

  return (
    <form action={action}>
      <input type="hidden" name="is_corporate" value={String(isCorporate)} />

      <div style={s.fieldWrap}>
        <label style={s.label}>Fatura Türü</label>
        <div style={s.toggle}>
          <button
            type="button"
            onClick={() => setIsCorporate(false)}
            style={{ ...s.toggleBtn(!isCorporate), borderRadius: "8px 0 0 8px" }}
          >
            Bireysel
          </button>
          <button
            type="button"
            onClick={() => setIsCorporate(true)}
            style={{ ...s.toggleBtn(isCorporate), borderRadius: "0 8px 8px 0", borderLeft: "none" }}
          >
            Kurumsal
          </button>
        </div>
      </div>

      {!isCorporate ? (
        <div style={s.fieldWrap}>
          <label style={s.label} htmlFor="tc_no">TC Kimlik No</label>
          <input style={s.input} id="tc_no" name="tc_no" type="text" maxLength={11} defaultValue={profile.tc_no ?? ""} placeholder="00000000000" />
        </div>
      ) : (
        <>
          <div style={s.fieldWrap}>
            <label style={s.label} htmlFor="tax_no">Vergi No</label>
            <input style={s.input} id="tax_no" name="tax_no" type="text" maxLength={10} defaultValue={profile.tax_no ?? ""} placeholder="0000000000" />
          </div>
          <div style={s.fieldWrap}>
            <label style={s.label} htmlFor="tax_office">Vergi Dairesi</label>
            <input style={s.input} id="tax_office" name="tax_office" type="text" defaultValue={profile.tax_office ?? ""} placeholder="Örn. Kadıköy" />
          </div>
        </>
      )}

      {state.error && <div style={s.error}>{state.error}</div>}
      {state.success && <div style={s.success}>Fatura bilgileri güncellendi.</div>}

      <button style={s.btn} type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
