import React, { useState } from "react"; // 1. Importamos useState
import { useNavbar } from "./hooks/usePublicNavbar";
import { Logo } from "./components/Logo";
import { SearchBar } from "./components/SearchBar";
import { NavActions } from "./components/NavActions";
import { NavLinks } from "./components/NavLinks";
import { MobileMenu } from "./components/MobileMenu";
import { LoginModal } from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal"; // 2. Importamos el nuevo componente
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";

export default function Navbar() {
  const navbarData = useNavbar();

  // 3. Añadimos estado local para el Registro y Recuperación
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const {
    isMenuOpen = false,
    isLoginOpen = false,
    isScrolled = false,
    toggleMenu = () => {},
    closeMenu = () => {},
    toggleLogin = () => {},
  } = navbarData || {};

  // 3.5. Efecto para manejar redirecciones por token vencido
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "true") {
      // Abrimos el login después de un pequeño delay para asegurar que el resto de la UI cargó
      setTimeout(() => {
        if (typeof toggleLogin === "function") {
          toggleLogin();
        }
      }, 100);
      
      // Limpiamos la URL sin refrescar la página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toggleLogin]);

  // 4. Funciones de intercambio (Switchers)
  const openRegister = () => {
    if (isLoginOpen) toggleLogin(); // Cierra Login si está abierto
    setIsRegisterOpen(true);
  };

  const openForgotPassword = () => {
    if (isLoginOpen) toggleLogin(); // Cierra Login si está abierto
    setIsForgotPasswordOpen(true);
  };

  const openLogin = () => {
    if (isRegisterOpen) setIsRegisterOpen(false); // Cierra Registro
    if (isForgotPasswordOpen) setIsForgotPasswordOpen(false); // Cierra Recuperar Contraseña
    if (!isLoginOpen) toggleLogin(); // Abre Login
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const isEmployee = user && Number(user.idRol) !== 7;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 shadow-md"
          : "bg-white border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          <div className="hidden md:flex flex-1 justify-center max-w-xl">
            <div className="w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-6">
            <div className="hidden lg:block">
              <NavLinks isEmployee={isEmployee} />
            </div>

            <NavActions
              isMenuOpen={isMenuOpen}
              toggleMenu={toggleMenu}
              toggleLogin={toggleLogin}
              isEmployee={isEmployee}
            />
          </div>
        </div>

        <div className="md:hidden pb-4 px-2">
          <SearchBar />
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
        onLoginClick={toggleLogin}
        isEmployee={isEmployee}
      />

      {/* 5. PASAMOS LAS PROPS AL LOGIN */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={toggleLogin} 
        onSwitchToRegister={openRegister} 
        onSwitchToForgotPassword={openForgotPassword}
      />

      {/* 6. RENDERIZAMOS EL MODAL DE REGISTRO */}
      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onSwitchToLogin={openLogin}
      />

      {/* 7. RENDERIZAMOS EL MODAL DE RECUPERACIÓN */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSwitchToLogin={openLogin}
      />
    </nav>
  );
}