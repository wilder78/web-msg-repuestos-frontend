import { Search } from "lucide-react";

export const SearchBar = () => (
  <div className="flex items-center w-full bg-gray-100 rounded-full px-3 py-1.5 gap-2">
    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
    <input
      type="text"
      placeholder="Buscar..."
      className="bg-transparent outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
    />
  </div>
);
