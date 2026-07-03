import React, { useState, useRef, useEffect } from "react";
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, FileText, Phone, MapPin } from "lucide-react";
import SuccessToast from "../../ui/SuccessToast";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const PASSWORD_RULES = [
  { re: /.{8,}/, label: "Mínimo 8 caracteres" },
  { re: /[A-Z]/, label: "Una mayúscula" },
  { re: /[0-9]/, label: "Un número" },
  { re: /[!@#$%^&*()_+\-={}\[\]:;<>,.?~\\/]/, label: "Un carácter especial (*, -, #, etc.)" },
];

const RegisterModal = ({ isOpen, onClose, onSwitchToLogin, onRegisterSuccess }) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const emailTimer = useRef(null);

  const [toast, setToast] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success"
  });

  // Campos adicionales para cliente
  const [documentTypes, setDocumentTypes] = useState([]);
  const [idTipoDocumento, setIdTipoDocumento] = useState("1"); // Default CC
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [personaContacto, setPersonaContacto] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Marca un campo como tocado
  const markTouched = (field) =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  // Ubicación geógrafica
  const [departments, setDepartments] = useState([]);
  const [idDepartamento, setIdDepartamento] = useState("");
  const [municipalities, setMunicipalities] = useState([]);
  const [municipioId, setMunicipioId] = useState("");

  // Estado de validación del documento
  const [documentStatus, setDocumentStatus] = useState(null); // 'checking' | 'available' | 'taken'
  const [documentOwner, setDocumentOwner] = useState("");
  const documentTimer = useRef(null);

  const passwordErrors = PASSWORD_RULES.filter((r) => !r.re.test(password));
  const passwordValid = passwordErrors.length === 0 && password.length > 0;

  // ─── Helpers de éxito por campo ──────────────────────────────────────────
  const fieldSuccess = {
    razonSocial:     touched.razonSocial     && razonSocial.trim().length > 0         && !errors.razonSocial,
    personaContacto: touched.personaContacto && personaContacto.trim().length > 0     && !errors.personaContacto,
    telefono:        touched.telefono        && (telefono.trim().length === 7 || telefono.trim().length === 10) && !errors.telefono,
    direccion:       touched.direccion       && direccion.trim().length > 0            && !errors.direccion,
    idDepartamento:  touched.idDepartamento  && !!idDepartamento                       && !errors.idDepartamento,
    municipioId:     touched.municipioId     && !!municipioId                          && !errors.municipioId,
    nombre:          touched.nombre          && nombre.trim().length > 0               && !errors.nombre,
    confirmPassword: touched.confirmPassword && confirmPassword.length > 0 && password === confirmPassword && !errors.confirmPassword,
  };

  // Clase de borde dinámica (error → rojo | success → verde suave | neutral)
  const borderClass = (field, extraCondition = true) => {
    if (errors[field]) return "border-red-500/60 focus:ring-red-500/10 bg-red-50/30";
    if (fieldSuccess[field] && extraCondition) return "border-emerald-400/60 focus:ring-emerald-400/10 bg-emerald-50/20";
    return "border-[#DEE2E6] focus:border-red-600/50 focus:ring-red-600/10";
  };

  // Cargar tipos de documentos
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/tipo-documento`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data && data.data) || [];
        setDocumentTypes(list);
        if (list.length > 0 && list[0]) {
          const firstId = list[0].idTipoDocumento || list[0].id || list[0].id_tipo_documento;
          if (firstId !== undefined && firstId !== null) {
            setIdTipoDocumento(firstId.toString());
          }
        }
      })
      .catch((err) => console.error("Error cargando tipos de documento:", err));
  }, [isOpen]);

  // Cargar departamentos
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API}/departments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data && data.data) || [];
        setDepartments(list);
      })
      .catch((err) => console.error("Error cargando departamentos:", err));
  }, [isOpen]);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (!idDepartamento) {
      setMunicipalities([]);
      setMunicipioId("");
      return;
    }
    fetch(`${API}/municipalities/department/${idDepartamento}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data && data.data) || [];
        setMunicipalities(list);
        if (list.length > 0 && list[0]) {
          const firstId = list[0].municipioId || list[0].id;
          setMunicipioId(firstId ? firstId.toString() : "");
        } else {
          setMunicipioId("");
        }
      })
      .catch((err) => console.error("Error cargando municipios:", err));
  }, [idDepartamento]);

  const checkDocumentAvailability = (docNum, docType) => {
    clearTimeout(documentTimer.current);
    if (!docNum || !docType) {
      setDocumentStatus(null);
      setDocumentOwner("");
      return;
    }
    setDocumentStatus("checking");
    setDocumentOwner("");
    documentTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/users/check-document?idTipoDocumento=${docType}&numeroDocumento=${encodeURIComponent(docNum)}`);
        const data = await res.json();
        if (data.disponible) {
          setDocumentStatus("available");
        } else {
          setDocumentStatus("taken");
          setDocumentOwner(data.razonSocial || "");
        }
      } catch {
        setDocumentStatus(null);
      }
    }, 500);
  };

  const handleDocTypeChange = (val) => {
    setIdTipoDocumento(val);
    checkDocumentAvailability(numeroDocumento, val);
    if (val) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.idTipoDocumento;
        return next;
      });
    }
  };

  const handleDocNumChange = (val) => {
    if (!/^[0-9]*$/.test(val)) return;
    setNumeroDocumento(val);
    checkDocumentAvailability(val, idTipoDocumento);
    if (val.trim().length >= 7) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.numeroDocumento;
        return next;
      });
    }
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const checkEmailAvailability = (value) => {
    clearTimeout(emailTimer.current);
    if (!value || !EMAIL_REGEX.test(value)) { setEmailStatus(null); return; }
    setEmailStatus("checking");
    emailTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/users/check-email/${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.disponible) {
          setEmailStatus("available");
        } else {
          setEmailStatus(data.isActive === false ? "inactive" : "taken");
        }
      } catch { setEmailStatus(null); }
    }, 500);
  };

  if (!isOpen) return null;

  const showToast = (message, type = "error") => {
    setToast({
      visible: true,
      title: type === "error" ? "Error de Validación" : "Registro exitoso",
      message,
      type
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!nombre.trim()) {
      newErrors.nombre = "El nombre de usuario es obligatorio";
    } else if (!/^[a-zA-Z0-9 ]*$/.test(nombre)) {
      newErrors.nombre = "El nombre de usuario solo puede contener letras, números y espacios";
    }
    if (!razonSocial.trim()) {
      newErrors.razonSocial = "La Razón Social / Nombre Comercial es obligatorio";
    } else if (razonSocial.length > 50) {
      newErrors.razonSocial = "Máximo 50 caracteres permitidos";
    }
    if (!personaContacto.trim()) newErrors.personaContacto = "La Persona de Contacto es obligatoria";
    
    if (!numeroDocumento.trim()) {
      newErrors.numeroDocumento = "El número de documento es obligatorio";
    } else if (numeroDocumento.trim().length < 7) {
      newErrors.numeroDocumento = "El documento debe tener al menos 7 dígitos";
    }

    if (documentStatus === "taken") newErrors.numeroDocumento = `El documento ya está registrado a nombre de ${documentOwner || "otro cliente"}.`;
    if (!idDepartamento) newErrors.idDepartamento = "El departamento es obligatorio";
    if (!municipioId) newErrors.municipioId = "El municipio es obligatorio";

    if (!telefono.trim()) {
      newErrors.telefono = "El teléfono de contacto es obligatorio";
    } else if (telefono.trim().length !== 7 && telefono.trim().length !== 10) {
      newErrors.telefono = "El teléfono debe tener 7 o 10 dígitos";
    }

    if (!direccion.trim()) newErrors.direccion = "La dirección es obligatoria";
    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio";
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = "Por favor, ingresa un correo electrónico válido (ej: usuario@dominio.com)";
    }
    if (emailStatus === "taken") newErrors.email = "Este correo ya está registrado";
    
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (!passwordValid) {
      newErrors.password = "La contraseña no cumple los requisitos de seguridad";
    }

    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast("Por favor, corrige los errores en el formulario");
      return;
    }

    setErrors({});

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreUsuario: nombre.trim(),
          nombre_usuario: nombre.trim(),
          email,
          emailCliente: email,
          email_cliente: email,
          clienteEmail: email,
          cliente_email: email,
          password,
          password_hash: password,
          idRol: 4,
          idEstado: 1,
          id_estado: 1,
          idTipoDocumento: parseInt(idTipoDocumento, 10),
          numeroDocumento: numeroDocumento.trim(),
          direccion: direccion.trim(),
          telefono: telefono.trim(),
          municipioId: parseInt(municipioId, 10),
          razonSocial: razonSocial.trim(),
          razon_social: razonSocial.trim(),
          personaContacto: personaContacto.trim(),
          persona_contacto: personaContacto.trim(),
          cupoCredito: 0.0,
          cupo_credito: 0.0,
          tipoCliente: "Consumidor final",
          tipo_cliente: "Consumidor final"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      showToast("Registro exitoso. Redirigiendo...", "success");

      setNombre("");
      setRazonSocial("");
      setPersonaContacto("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setNumeroDocumento("");
      setTelefono("");
      setDireccion("");
      setIdDepartamento("");
      setMunicipalities([]);
      setMunicipioId("");
      setDocumentStatus(null);
      setDocumentOwner("");
      setEmailStatus(null);

      setTimeout(() => {
        if (onRegisterSuccess) onRegisterSuccess(data);
        onSwitchToLogin();
      }, 1500);

    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes shine { from { transform:translateX(-100%) skewX(-15deg); } to { transform:translateX(200%) skewX(-15deg); } }
        .btn-nitro { position:relative; overflow:hidden; }
        .btn-nitro::after { content:""; position:absolute; top:0; left:0; width:50%; height:100%; background:linear-gradient(to right,transparent,rgba(255,255,255,0.2),transparent); animation:shine 3s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>

      <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden relative animate-slide-up border border-[#DEE2E6] max-h-[90vh] flex flex-col">
        <div className="h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 shrink-0"></div>

        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-[#343A40] hover:bg-black/5 rounded-full transition-all z-20">
          <X size={20} />
        </button>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">
          <header className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative p-1 rounded-xl bg-gray-50 border border-gray-100">
                <img src="/imagen/logocuadrado.png" alt="Logo MSG" className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
              </div>
            </div>
            <h2 className="text-[#343A40] text-xl font-bold tracking-tight">Crea tu cuenta</h2>
            <p className="text-[#6C757D] text-sm mt-1 px-2">Únete a la comunidad líder en repuestos y accesorios</p>
          </header>

          <form className="bg-[#F8F9FA] p-6 rounded-2xl border border-[#DEE2E6] flex flex-col gap-5" onSubmit={handleSubmit} noValidate>

            {/* --- DATOS DE FACTURACIÓN (Cliente) --- */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-red-600 border-b border-[#DEE2E6] pb-1 tracking-wider">Datos de Facturación</p>

              {/* Fila 1: Razón Social / Nombre Comercial & Persona de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-[#343A40] tracking-wider">Razón Social / Nombre Comercial</label>
                    <span className={`text-[10px] font-medium ${razonSocial.length >= 50 ? "text-red-500" : "text-[#6C757D]"}`}>
                      {razonSocial.length}/50
                    </span>
                  </div>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.razonSocial ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type="text"
                      value={razonSocial}
                      onFocus={() => markTouched("razonSocial")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 50) {
                          setRazonSocial(val);
                          markTouched("razonSocial");
                          if (val.length === 50) {
                            setErrors((prev) => ({ ...prev, razonSocial: "Has alcanzado el límite de 50 caracteres." }));
                          } else if (val.trim()) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.razonSocial;
                              return next;
                            });
                          } else {
                            setErrors((prev) => ({ ...prev, razonSocial: "La Razón Social / Nombre Comercial es obligatorio" }));
                          }
                        }
                      }}
                      maxLength={50}
                      placeholder="Ej: Repuestos El Motor"
                      className={`w-full pl-12 pr-10 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${borderClass("razonSocial")}`}
                    />
                    {fieldSuccess.razonSocial && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </span>
                    )}
                  </div>
                  {errors.razonSocial && <p aria-live="polite" className="text-[10px] text-red-500 mt-1 ml-1">{errors.razonSocial}</p>}
                  {fieldSuccess.razonSocial && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Razón social válida</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Persona de Contacto</label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.personaContacto ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type="text"
                      value={personaContacto}
                      onFocus={() => markTouched("personaContacto")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/.test(val)) {
                          setPersonaContacto(val);
                          markTouched("personaContacto");
                          if (val.trim()) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.personaContacto;
                              return next;
                            });
                          }
                        }
                      }}
                      maxLength={70}
                      placeholder="Ej: Juan Pérez"
                      className={`w-full pl-12 pr-10 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${borderClass("personaContacto")}`}
                    />
                    {fieldSuccess.personaContacto && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </span>
                    )}
                  </div>
                  {errors.personaContacto && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.personaContacto}</p>}
                  {fieldSuccess.personaContacto && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Persona de contacto válida</p>}
                </div>
              </div>

              {/* Fila 2: Teléfono de contacto y Dirección de entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Teléfono de contacto</label>
                  <div className="relative group">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.telefono ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type="text"
                      value={telefono}
                      onFocus={() => markTouched("telefono")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9]*$/.test(val)) {
                          setTelefono(val);
                          markTouched("telefono");
                          if (val.trim().length === 7 || val.trim().length === 10) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.telefono;
                              return next;
                            });
                          }
                        }
                      }}
                      maxLength={15}
                      placeholder="Ej: 3001234567"
                      className={`w-full pl-12 pr-10 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${borderClass("telefono")}`}
                    />
                    {fieldSuccess.telefono && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </span>
                    )}
                  </div>
                  {errors.telefono && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.telefono}</p>}
                  {fieldSuccess.telefono && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Teléfono válido</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Dirección de entrega</label>
                  <div className="relative group">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.direccion ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type="text"
                      value={direccion}
                      onFocus={() => markTouched("direccion")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDireccion(val);
                        markTouched("direccion");
                        if (val.trim()) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.direccion;
                            return next;
                          });
                        }
                      }}
                      maxLength={150}
                      placeholder="Ej: Calle 50 #10-20"
                      className={`w-full pl-12 pr-10 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${borderClass("direccion")}`}
                    />
                    {fieldSuccess.direccion && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </span>
                    )}
                  </div>
                  {errors.direccion && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.direccion}</p>}
                  {fieldSuccess.direccion && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Dirección válida</p>}
                </div>
              </div>

              {/* Fila 3: Tipo de Documento y Número de Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Tipo de documento</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C757D] group-focus-within:text-red-500 transition-colors" size={18} />
                    <select
                      value={idTipoDocumento}
                      onChange={(e) => handleDocTypeChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-[#FFFFFF] border border-[#DEE2E6] rounded-xl outline-none focus:border-red-600/50 focus:ring-4 focus:ring-red-600/10 text-[#343A40] shadow-sm transition-all text-sm appearance-none"
                    >
                      {documentTypes && documentTypes.length > 0 ? (
                        documentTypes?.map((dt) => {
                          const val = dt.idTipoDocumento || dt.id || dt.id_tipo_documento;
                          return (
                            <option key={val} value={val}>
                              {dt.descripcion} ({dt.sigla})
                            </option>
                          );
                        })
                      ) : (
                        <>
                          <option value="1">Cédula de Ciudadanía (C.C.)</option>
                          <option value="2">NIT (Número de Identificación Tributaria)</option>
                          <option value="3">Cédula de Extranjería (C.E.)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Número de documento</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C757D] group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                      type="text"
                      value={numeroDocumento}
                      onChange={(e) => handleDocNumChange(e.target.value)}
                      maxLength={15}
                      placeholder="Ej: 10203040"
                      className={`w-full pl-12 pr-10 py-3.5 bg-[#FFFFFF] border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${
                        documentStatus === "taken" || errors.numeroDocumento ? "border-red-600/50 focus:ring-red-600/10" : documentStatus === "available" ? "border-emerald-500/50 focus:ring-emerald-600/10" : "border-[#DEE2E6] focus:border-red-600/50 focus:ring-red-600/10"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {documentStatus === "checking" && <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />}
                      {documentStatus === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {documentStatus === "taken" && <XCircle className="h-4 w-4 text-red-500" />}
                    </span>
                  </div>
                  {errors.numeroDocumento && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.numeroDocumento}</p>}
                  {documentStatus === "taken" && !errors.numeroDocumento && <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 ml-1"><AlertCircle size={10} /> Documento registrado a nombre de {documentOwner || "otro cliente"}</p>}
                  {documentStatus === "available" && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Documento disponible</p>}
                </div>
              </div>

              {/* Fila 4: Departamento y Municipio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Departamento</label>
                  <div className="relative group">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.idDepartamento ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <select
                      value={idDepartamento}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIdDepartamento(val);
                        markTouched("idDepartamento");
                        if (val) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.idDepartamento;
                            return next;
                          });
                        }
                      }}
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] shadow-sm transition-all text-sm appearance-none ${borderClass("idDepartamento")}`}
                    >
                      <option value="">Selecciona un departamento</option>
                      {departments.map((d) => {
                        const val = d.idDepartamento || d.id;
                        return (
                          <option key={val} value={val}>
                            {d.name || d.nombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {errors.idDepartamento && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.idDepartamento}</p>}
                  {fieldSuccess.idDepartamento && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Departamento seleccionado</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Municipio / Ciudad</label>
                  <div className="relative group">
                    <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.municipioId ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <select
                      value={municipioId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMunicipioId(val);
                        markTouched("municipioId");
                        if (val) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.municipioId;
                            return next;
                          });
                        }
                      }}
                      disabled={!idDepartamento}
                      className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] shadow-sm transition-all text-sm appearance-none disabled:bg-gray-100 disabled:text-gray-400 ${borderClass("municipioId")}`}
                    >
                      <option value="">Selecciona un municipio</option>
                      {municipalities.map((m) => {
                        const val = m.municipioId || m.id;
                        return (
                          <option key={val} value={val}>
                            {m.name || m.nombre}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {errors.municipioId && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.municipioId}</p>}
                  {fieldSuccess.municipioId && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Ciudad seleccionada</p>}
                </div>
              </div>
            </div>

            {/* --- CREDENCIALES DE USUARIO (Usuario) --- */}
            <div className="border-t border-[#DEE2E6] pt-6 mt-2 bg-gray-50/70 -mx-6 px-6 pb-2 rounded-b-2xl">
              <p className="text-[11px] font-bold text-red-600 pb-3 tracking-wider">Credenciales de Usuario</p>

              {/* Fila 1: Nombre de usuario & Correo electrónico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Nombre de usuario</label>
                  <div className="relative group">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.nombre ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type="text"
                      value={nombre}
                      onFocus={() => markTouched("nombre")}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[a-zA-Z0-9 ]*$/.test(val)) {
                          setNombre(val);
                          markTouched("nombre");
                          if (val.trim()) {
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.nombre;
                              return next;
                            });
                          }
                        }
                      }}
                      maxLength={30}
                      placeholder="Ej: juanperez12"
                      className={`w-full pl-12 pr-10 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${borderClass("nombre")}`}
                    />
                    {fieldSuccess.nombre && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </span>
                    )}
                  </div>
                  {errors.nombre && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.nombre}</p>}
                  {fieldSuccess.nombre && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Nombre de usuario disponible</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Correo electrónico</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C757D] group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setEmail(val);
                        checkEmailAvailability(val);
                        
                        if (val && EMAIL_REGEX.test(val)) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.email;
                            return next;
                          });
                        } else if (val) {
                          // Mostrar error dinámico de estructura si el usuario ya tocó o está intentando validar
                          setErrors((prev) => ({ ...prev, email: "Por favor, ingresa un correo electrónico válido (ej: usuario@dominio.com)" }));
                        } else {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.email;
                            return next;
                          });
                        }
                      }}
                      maxLength={100}
                      placeholder="tu@email.com"
                      className={`w-full pl-12 pr-10 py-3.5 bg-[#FFFFFF] border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${
                        emailStatus === "taken" || errors.email ? "border-red-600/50 focus:ring-red-600/10" : emailStatus === "inactive" ? "border-amber-500/50 focus:ring-amber-600/10" : emailStatus === "available" ? "border-emerald-500/50 focus:ring-emerald-600/10" : "border-[#DEE2E6] focus:border-red-600/50 focus:ring-red-600/10"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      {emailStatus === "checking" && <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />}
                      {emailStatus === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {emailStatus === "taken" && <XCircle className="h-4 w-4 text-red-500" />}
                      {emailStatus === "inactive" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    </span>
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.email}</p>}
                  {emailStatus === "taken" && !errors.email && <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1 ml-1"><AlertCircle size={10} /> Este correo ya está registrado</p>}
                  {emailStatus === "inactive" && <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 ml-1"><AlertCircle size={10} /> Registrado pero sin activar. Regístrate para recibir otro enlace.</p>}
                  {emailStatus === "available" && <p className="text-[10px] text-emerald-400 mt-1 ml-1">Correo disponible</p>}
                </div>
              </div>

              {/* Fila 2: Contraseña & Confirmar contraseña */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6C757D] group-focus-within:text-red-500 transition-colors" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassword(val);
                        const errorsList = PASSWORD_RULES.filter((r) => !r.re.test(val));
                        if (val.length > 0 && errorsList.length === 0) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.password;
                            return next;
                          });
                        }
                      }}
                      maxLength={50}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3.5 bg-[#FFFFFF] border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${
                        password && !passwordValid || errors.password ? "border-amber-500/50 focus:ring-amber-600/10" : passwordValid ? "border-emerald-500/50 focus:ring-emerald-600/10" : "border-[#DEE2E6] focus:border-red-600/50 focus:ring-red-600/10"
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-red-500 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#343A40] tracking-wider ml-1">Confirmar contraseña</label>
                  <div className="relative group">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldSuccess.confirmPassword ? "text-emerald-500" : "text-[#6C757D] group-focus-within:text-red-500"}`} size={18} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onFocus={() => markTouched("confirmPassword")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfirmPassword(val);
                        markTouched("confirmPassword");
                        if (password === val) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.confirmPassword;
                            return next;
                          });
                        }
                      }}
                      maxLength={50}
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-12 py-3.5 border rounded-xl outline-none focus:ring-4 text-[#343A40] placeholder-[#6C757D] shadow-sm transition-all text-sm ${
                        confirmPassword && password !== confirmPassword || errors.confirmPassword
                          ? "border-red-500/60 focus:ring-red-500/10 bg-red-50/30"
                          : fieldSuccess.confirmPassword
                          ? "border-emerald-400/60 focus:ring-emerald-400/10 bg-emerald-50/20"
                          : "border-[#DEE2E6] focus:border-red-600/50 focus:ring-red-600/10"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6C757D] hover:text-red-500 transition-colors" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.confirmPassword}</p>}
                  {confirmPassword && password !== confirmPassword && !errors.confirmPassword && <p className="text-[10px] text-red-400 mt-1 ml-1">Las contraseñas no coinciden</p>}
                  {fieldSuccess.confirmPassword && <p className="text-[10px] text-emerald-500 mt-1 ml-1">Las contraseñas coinciden</p>}
                </div>
              </div>

              {/* Indicador de fortaleza */}
              {password && (
                <div className="bg-[#FFFFFF] rounded-xl border border-[#DEE2E6] p-3 mt-4 space-y-1.5">
                  <p className="text-[10px] font-bold text-[#343A40] tracking-wider">Requisitos de seguridad</p>
                  {PASSWORD_RULES.map((rule, i) => {
                    const ok = rule.re.test(password);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        {ok ? <CheckCircle2 size={10} className="text-emerald-500 shrink-0" /> : <XCircle size={10} className="text-amber-500 shrink-0" />}
                        <span className={`text-[10px] ${ok ? "text-emerald-500" : "text-[#6C757D]"}`}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Términos */}
            <div className="flex items-start gap-3 px-1 py-1">
              <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-[#DEE2E6] bg-[#FFFFFF] text-red-600 focus:ring-red-500/50 cursor-pointer" />
              <p className="text-[10px] text-[#343A40] leading-tight">
                Acepto los <span className="text-red-600 cursor-pointer hover:text-red-500 transition-colors font-bold">Términos de servicio</span> y la{" "}
                <span className="text-red-600 cursor-pointer hover:text-red-500 transition-colors font-bold">Política de privacidad</span>.
              </p>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting || emailStatus === "taken" || (email.length > 0 && !EMAIL_REGEX.test(email))}
              className={`w-full rounded-xl font-black uppercase tracking-widest py-4 flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer ${
                submitting ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "btn-nitro bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-[0_10px_20px_rgba(220,38,38,0.2)]"
              }`}
            >
              {submitting ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" /> Registrando...</>
              ) : (
                <><span className="relative z-10">Registrarse</span> <ArrowRight size={20} className="relative z-10" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-[#DEE2E6]">
            <p className="text-[#343A40] text-sm">
              ¿Ya tienes una cuenta?{" "}
              <button onClick={onSwitchToLogin} className="text-red-600 hover:text-red-500 font-bold transition-all underline-offset-4 hover:underline">
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
      <SuccessToast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default RegisterModal;