import api from "../api/axios";

export const loginUser = async (email, password) => {
  try {
    // Ruta exacta de tu Postman: /users/login
    const response = await api.post("/users/login", { email, password });

    const payload = response.data?.data || response.data || {};
    const token = payload.token || response.data?.token;
    const user = payload.user || response.data?.user || payload;

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // Notifica al AuthContext en la misma pestaña para reactividad inmediata
      window.dispatchEvent(new Event("auth-changed"));
    }

    return { ...response.data, token, user };
  } catch (error) {
    // Si el backend envía un mensaje de error, lo capturamos
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error al conectar con el servidor";
    throw new Error(message);
  }
};

export const forgotPasswordService = async (email) => {
  try {
    const response = await api.post("/users/forgot-password", { email });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error al conectar con el servidor";
    throw new Error(message);
  }
};

export const resetPasswordService = async (token, nuevaContrasena) => {
  try {
    const response = await api.post("/users/reset-password", { token, nuevaContrasena });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error al conectar con el servidor";
    throw new Error(message);
  }
};

