import { useState, useEffect, useCallback } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(/\/$/, "");

const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

export const useDevoluciones = () => {
    const [devoluciones, setDevoluciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDevolucionesData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = getAuthHeaders();

            // Carga en paralelo: devoluciones + clientes
            const [returnsRes, customersRes] = await Promise.allSettled([
                fetch(`${API}/returns`, { headers }),
                fetch("/api/customers", { headers }).catch(() => fetch(`${API}/customers`, { headers })),
            ]);

            if (returnsRes.status === "rejected" || !returnsRes.value.ok) {
                throw new Error("Error al obtener las devoluciones");
            }

            const returnsData = await returnsRes.value.json();
            const resultList = Array.isArray(returnsData) ? returnsData : (returnsData.data || []);

            // Construir mapa de clientes id → objeto
            let customerMap = {};
            if (customersRes.status === "fulfilled" && customersRes.value.ok) {
                const customersData = await customersRes.value.json();
                const customerList = Array.isArray(customersData)
                    ? customersData
                    : (customersData.data || customersData.content || customersData.customers || customersData.clientes || []);
                customerMap = customerList.reduce((map, c) => {
                    const id = c.idCliente ?? c.id_cliente ?? c.id;
                    if (id != null) map[String(id)] = c;
                    return map;
                }, {});
            }

            // Enriquecer cada devolución con los datos del cliente
            const enriched = resultList.map((dev) => {
                const clienteId = String(dev.idCliente ?? dev.id_cliente ?? "");
                const clienteFromMap = customerMap[clienteId];
                if (clienteFromMap && !dev.cliente?.razonSocial && !dev.clienteNombre) {
                    return {
                        ...dev,
                        clienteNombre: clienteFromMap.razonSocial || clienteFromMap.razon_social || clienteFromMap.nombre || "",
                        cliente: dev.cliente
                            ? { ...dev.cliente, razonSocial: dev.cliente.razonSocial || clienteFromMap.razonSocial }
                            : {
                                razonSocial: clienteFromMap.razonSocial || clienteFromMap.razon_social || "",
                                telefono: clienteFromMap.telefono || "",
                                email: clienteFromMap.email || "",
                                numeroDocumento: clienteFromMap.numeroDocumento || clienteFromMap.numero_documento || "",
                                direccion: clienteFromMap.direccion || "",
                            },
                    };
                }
                return dev;
            });

            setDevoluciones(enriched);
        } catch {
            setError("Error interno al obtener el historial de devoluciones.");
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelReturn = async (id, body = {}) => {
        try {
            const headers = getAuthHeaders();
            const response = await fetch(`${API}/returns/${id}`, {
                method: "DELETE",
                headers,
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                let msg = "Error al cancelar la devolución";
                try {
                    const data = await response.json();
                    msg = data.message || msg;
                } catch (e) {
                    // Fail silently
                }
                throw new Error(msg);
            }
            await fetchDevolucionesData();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        fetchDevolucionesData();
    }, [fetchDevolucionesData]);

    return {
        devoluciones,
        setDevoluciones,
        loading,
        error,
        refresh: fetchDevolucionesData,
        cancelReturn
    };
};
