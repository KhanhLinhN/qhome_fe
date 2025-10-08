"use client";
import React, {useState} from "react";
import {useTranslations} from "next-intl";
import {useNotifications} from "@/src/hooks/useNotifications";
import {login} from "@/src/services/auth";

export default function LoginForm(){
  const t = useTranslations();
  const {show} = useNotifications();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault(); setLoading(true);
    try { await login({username, password, remember}); show(t("login.success"), "success");
      // router.push("/dashboard")
    } catch (e:any) {
      show(e?.response?.data?.message || t("login.error"), "error");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <h1 className="text-lg font-semibold">{t("Login.title")}</h1>
        <p className="text-xs text-slate-500">{t("Login.subtitle")}</p>
      </div>

      <label className="text-sm block">
        {t("Login.username")}
        <input value={username} onChange={e=>setUsername(e.target.value)}
               placeholder="you@example.com"
               className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"/>
      </label>

      <div className="text-sm">
        <div className="flex items-center justify-between">
          <label>{t("Login.password")}</label>
          <a href="#" className="text-xs text-indigo-600 hover:underline">{t("Login.forgot")}</a>
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
               placeholder="••••••••"
               className="mt-1 w-full border rounded-xl px-3 py-2 text-sm"/>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
        {t("Login.remember")}
      </label>

      <button type="submit" disabled={loading}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60">
        {loading ? t("Login.loading") : t("Login.submit")}
      </button>

      <div className="text-center text-xs text-slate-500">{t("Login.contact_support")}</div>
    </form>
  );
}
