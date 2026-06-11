import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchParamValue = searchParams.get("search") || "";
  
  const [searchTerm, setSearchTerm] = useState(searchParamValue);
  const debounceTimerRef = useRef(null);

  // Sync state if URL changes (e.g. filters cleared or updated externally)
  useEffect(() => {
    setSearchTerm(searchParamValue);
  }, [searchParamValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const triggerSearch = (value) => {
    const trimmed = value.trim();
    if (trimmed) {
      navigate(`/repuestos?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/repuestos");
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Cancel existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      triggerSearch(value);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Cancel debounce timer to prevent duplicate triggers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      triggerSearch(searchTerm);
    }
  };

  return (
    <div className="flex items-center w-full bg-gray-100 rounded-full px-3 py-1.5 gap-2">
      <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <input
        type="text"
        placeholder="Buscar..."
        value={searchTerm}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
      />
    </div>
  );
};
