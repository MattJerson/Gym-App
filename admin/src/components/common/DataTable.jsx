// Reusable Data Table Component
import { Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { useState } from 'react';

const DataTable = ({ 
  columns, 
  data, 
  loading = false,
  onEdit,
  onDelete,
  onView,
  actions = ['edit', 'delete'], // Available: 'edit', 'delete', 'view'
  emptyMessage = "No data found",
  customActions
}) => {
  const [expandedRow, setExpandedRow] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="animate-pulse">
          <div className="h-14 bg-gray-100"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 border-t border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
              {(actions.length > 0 || customActions) && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm text-gray-900">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
                {(actions.length > 0 || customActions) && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {customActions && customActions(row)}
                      
                      {actions.includes('view') && onView && (
                        <button
                          onClick={() => onView(row)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {actions.includes('edit') && onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {actions.includes('delete') && onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
