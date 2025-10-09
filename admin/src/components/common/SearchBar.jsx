// Reusable Search Bar Component
import { Search, Filter, Download } from 'lucide-react';

const SearchBar = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Search...",
  showFilter = false,
  onFilterClick,
  showExport = false,
  onExportClick,
  filterCount = 0
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>
      
      {/* Filter Button */}
      {showFilter && (
        <button
          onClick={onFilterClick}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors relative"
        >
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="text-gray-700 font-medium">Filter</span>
          {filterCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </button>
      )}
      
      {/* Export Button */}
      {showExport && (
        <button
          onClick={onExportClick}
          className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5" />
          <span className="font-medium">Export</span>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
