"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, User, Mail, Calendar, LogOut, Check, Loader2, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useLanguage();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === "google";

  const getInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || "";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(
        locale === "id" ? "id-ID" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : "-";

  const handleSaveName = async () => {
    if (!fullName.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    setSavingName(false);
    if (error) {
      toast.error(t.common.error);
    } else {
      toast.success(t.common.saved);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error(
        locale === "id"
          ? "Password baru tidak cocok"
          : "Passwords do not match"
      );
      return;
    }
    if (newPassword.length < 6) {
      toast.error(
        locale === "id"
          ? "Password minimal 6 karakter"
          : "Password must be at least 6 characters"
      );
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message || t.common.error);
    } else {
      toast.success(
        locale === "id" ? "Password berhasil diubah" : "Password updated!"
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white py-8 px-4">
      <div className="max-w-md mx-auto w-full space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t.settings.profile}</h1>
        </div>

        {/* Avatar + Info */}
        <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center gap-3 border border-purple-100">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200">
            <span className="text-3xl font-bold text-white">{getInitials()}</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {user?.user_metadata?.full_name || "—"}
            </p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-purple-500 bg-purple-50 px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {locale === "id" ? "Bergabung " : "Member since "}
              {memberSince}
            </span>
          </div>
        </div>

        {/* Edit Name */}
        <div className="bg-white rounded-3xl shadow-sm p-5 border border-purple-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t.settings.account}
          </h2>

          <div className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.settings.fullName}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.settings.fullName}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.settings.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              onClick={handleSaveName}
              disabled={savingName || !fullName.trim()}
              className="w-full bg-purple-600 text-white rounded-2xl py-3 text-sm font-medium hover:bg-purple-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingName ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t.settings.saveChanges}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Change Password (email users only) */}
        {!isGoogleUser && (
          <div className="bg-white rounded-3xl shadow-sm p-5 border border-purple-100">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              {locale === "id" ? "Ubah Password" : "Change Password"}
            </h2>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={locale === "id" ? "Password baru" : "New password"}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === "id" ? "Konfirmasi password baru" : "Confirm new password"}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="w-full bg-purple-600 text-white rounded-2xl py-3 text-sm font-medium hover:bg-purple-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  locale === "id" ? "Ubah Password" : "Update Password"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="bg-white rounded-3xl shadow-sm p-5 border border-purple-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t.settings.language}
          </h2>
          <p className="text-xs text-gray-400 mb-4">{t.settings.languageDesc}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setLocale("en")}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                locale === "en"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span>🇬🇧</span>
              {t.settings.english}
            </button>
            <button
              onClick={() => setLocale("id")}
              className={`flex-1 py-3 rounded-2xl text-sm font-medium border transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                locale === "id"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span>🇮🇩</span>
              {t.settings.indonesian}
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="bg-white rounded-3xl shadow-sm p-5 border border-red-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t.settings.dangerZone}
          </h2>
          <button
            onClick={signOut}
            className="w-full bg-red-50 text-red-600 border border-red-200 rounded-2xl py-3 text-sm font-medium hover:bg-red-100 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t.common.signOut}
          </button>
        </div>

        <div className="pb-4" />
      </div>
    </div>
  );
}
