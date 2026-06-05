import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getUserInitials } from "../../../lib/user-initials";

export function useAdminNavbar() {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);
  const closeProfileMenu = () => setShowProfileMenu(false);

  return {
    user,
    showProfileMenu,
    handleLogout,
    toggleProfileMenu,
    closeProfileMenu,
    getInitials: getUserInitials,
  };
}
