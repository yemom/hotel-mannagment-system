import React from 'react';

const DataTable = ({ columns, data, actions, loading = false }) => {
  if (loading) {
    return (
      <div className="empty-card">
        <span className="material-symbols-outlined">progress_activity</span>
        <p>Loading property data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-card">
        <span className="material-symbols-outlined">inbox</span>
        <h2>No records yet</h2>
        <p>Create a record or adjust the filters to see results.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.label}
                </th>
              ))}
              {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className={column.numeric ? 'numeric' : ''}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {actions.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => action.onClick(row)}
                          className={action.variant === 'danger' ? 'danger-button' : 'secondary-button'}
                        >
                          {action.icon && <span className="material-symbols-outlined">{action.icon}</span>}
                          {action.label}
                        </button>
                      ))}
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
