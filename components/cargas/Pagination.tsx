'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  language: string;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  language 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const translations: Record<string, string> = {
    pt: 'Página número',
    en: 'Page number',
    fr: 'Numéro de page',
    es: 'Número de página'
  };

  return (
    <div className="flex items-center gap-3 mt-6">
      <label className="text-sm text-gray-700">
        {translations[language] || translations.pt}
      </label>
      <select
        value={currentPage}
        onChange={(e) => onPageChange(parseInt(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        {Array.from({ length: totalPages }, (_, i) => (
          <option key={i} value={i}>
            {i + 1}
          </option>
        ))}
      </select>
    </div>
  );
}