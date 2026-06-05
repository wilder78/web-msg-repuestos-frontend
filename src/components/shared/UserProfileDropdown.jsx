import React, { useState } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ProfileModal } from "./ProfileModal";
import AccountSettingsModal from "./AccountSettingsModal";
import ProfileSectionErrorBoundary from "./ProfileSectionErrorBoundary";

export const UserProfileDropdown = ({ initials, name, email, role, roleId, onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const navigate = useNavigate();
  const normalizedRoleId = Number(roleId);
  const canViewOrderHistory = normalizedRoleId === 3 || normalizedRoleId === 4 || normalizedRoleId === 7;
  const orderHistoryLabel = normalizedRoleId === 3 ? "Mis Ventas" : "Historial de Pedidos";

  const toggleProfileMenu = () => setShowProfileMenu((prev) => !prev);
  const closeProfileMenu = () => setShowProfileMenu(false);

  const openProfileModal = () => {
    closeProfileMenu();
    setShowProfileModal(true);
  };

  const openAccountSettingsModal = () => {
    closeProfileMenu();
    setShowAccountSettingsModal(true);
  };

  const handleLogout = () => {
    closeProfileMenu();
    if (onLogout) onLogout();
  };

  const openOrderHistory = () => {
    closeProfileMenu();
    navigate("/mi-historial");
  };

  return (
    <ProfileSectionErrorBoundary>
      <div className="relative">
        <button
          type="button"
          onClick={toggleProfileMenu}
          className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarFallback className="bg-blue-600 text-white text-[11px] font-bold tracking-[0.08em]">
              <span>{initials || "U"}</span>
            </AvatarFallback>
          </Avatar>
          <span className="flex items-center">
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${
                showProfileMenu ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {showProfileMenu ? (
          <div className="contents">
            <div className="fixed inset-0 z-10" onClick={closeProfileMenu} />
            <div className="absolute right-0 z-20 mt-2 w-56 animate-in rounded-xl border border-slate-200 bg-white py-2 shadow-xl fade-in slide-in-from-top-2 duration-200">
              <div className="border-b border-slate-100 px-4 py-2">
                <p className="text-sm font-bold text-slate-900">
                  <span>{role || name || "Usuario"}</span>
                </p>
                <p className="truncate text-xs text-slate-500">
                  <span>{email || "Sin correo"}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={openProfileModal}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <User className="mr-3 h-4 w-4 text-slate-400" />
                <span>Mi Perfil</span>
              </button>

              <button
                type="button"
                onClick={openAccountSettingsModal}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings className="mr-3 h-4 w-4 text-slate-400" />
                <span>Ajustes de Cuenta</span>
              </button>

              {canViewOrderHistory ? (
                <button
                  type="button"
                  onClick={openOrderHistory}
                  className="flex w-full items-center px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <User className="mr-3 h-4 w-4 text-slate-400" />
                  <span>{orderHistoryLabel}</span>
                </button>
              ) : null}

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Cerrar Sesion</span>
              </button>
            </div>
          </div>
        ) : null}

        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

        <AccountSettingsModal
          isOpen={showAccountSettingsModal}
          onClose={() => setShowAccountSettingsModal(false)}
        />
      </div>
    </ProfileSectionErrorBoundary>
  );
};

export default UserProfileDropdown;
