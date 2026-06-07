import { Search } from "lucide-react";

export function SearchBox({ value, onChange, placeholder = "Search local data" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="search-box">
      <Search size={18} aria-hidden="true" />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}
