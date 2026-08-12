import React, { useState, useEffect, useMemo } from 'react';
import {
  FaTable, FaSearch, FaDownload, FaExpand, FaCompress,
  FaFileCsv, FaFileExcel, FaInfoCircle, FaChevronLeft, FaChevronRight,
  FaRedo
} from 'react-icons/fa';

// Helper to convert column index to Excel column letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
const getColumnLetter = (colIdx) => {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

// Fallback CSV parser in case XLSX library is loading or for pure CSV text
const parseCSVText = (text) => {
  const lines = text.split(/\r\n|\n/);
  return lines.map(line => {
    // Simple CSV parser handling quotes
    const result = [];
    let startValueIdx = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === ',' || char === ';') && !inQuotes) {
        let val = line.substring(startValueIdx, i).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        result.push(val);
        startValueIdx = i + 1;
      }
    }
    let lastVal = line.substring(startValueIdx).trim();
    if (lastVal.startsWith('"') && lastVal.endsWith('"')) {
      lastVal = lastVal.substring(1, lastVal.length - 1).replace(/""/g, '"');
    }
    result.push(lastVal);
    return result;
  }).filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
};

const SpreadsheetViewer = ({ fileUrl, fileName, isCsv = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sheets, setSheets] = useState({}); // { sheetName: 2DArrayMatrix }
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load and parse file
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Impossible de charger le fichier.');

        // Try using XLSX library dynamically
        let XLSXLib = window.XLSX;
        if (!XLSXLib) {
          try {
            XLSXLib = await import('xlsx');
          } catch (e) {
            console.warn('SheetJS/xlsx module standard non disponible, utilisation du parseur texte fallback.', e);
          }
        }

        if (XLSXLib) {
          const buffer = await response.arrayBuffer();
          const workbook = XLSXLib.read(buffer, { type: 'array' });
          const parsedSheets = {};
          
          workbook.SheetNames.forEach((name) => {
            const worksheet = workbook.Sheets[name];
            // Convert to 2D array matrix with empty default values
            const jsonMatrix = XLSXLib.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            parsedSheets[name] = jsonMatrix;
          });

          if (isMounted) {
            setSheets(parsedSheets);
            setSheetNames(workbook.SheetNames);
            setActiveSheet(workbook.SheetNames[0] || 'Feuille 1');
            setLoading(false);
          }
        } else {
          // Fallback parsing (works great for CSV / TSV text files)
          const textData = await response.text();
          const matrix = parseCSVText(textData);
          if (isMounted) {
            const sheetName = fileName || 'Données';
            setSheets({ [sheetName]: matrix });
            setSheetNames([sheetName]);
            setActiveSheet(sheetName);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Erreur lors du traitement du fichier tableur:', err);
        if (isMounted) {
          setError('Erreur lors de la lecture du tableau. Veuillez réessayer ou télécharger le fichier.');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, fileName, isCsv]);

  // Current sheet matrix
  const currentMatrix = useMemo(() => {
    return sheets[activeSheet] || [];
  }, [sheets, activeSheet]);

  // Calculate max columns to normalize table size
  const maxCols = useMemo(() => {
    if (!currentMatrix.length) return 0;
    return Math.max(...currentMatrix.map(row => row ? row.length : 0));
  }, [currentMatrix]);

  // Active cell content & address (e.g. B3)
  const cellAddress = `${getColumnLetter(selectedCell.col)}${selectedCell.row + 1}`;
  const cellValue = currentMatrix[selectedCell.row]?.[selectedCell.col] ?? '';

  // Calculate statistics for numeric cells
  const stats = useMemo(() => {
    let count = 0;
    let sum = 0;
    let numCount = 0;

    currentMatrix.forEach(row => {
      if (!row) return;
      row.forEach(val => {
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          count++;
          const num = Number(val);
          if (!isNaN(num) && typeof val !== 'boolean') {
            sum += num;
            numCount++;
          }
        }
      });
    });

    return {
      count,
      sum: numCount > 0 ? sum : null,
      avg: numCount > 0 ? (sum / numCount).toFixed(2) : null
    };
  }, [currentMatrix]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-emerald-50/50 dark:bg-gray-800/50 rounded-xl min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <FaTable className="absolute inset-0 m-auto text-emerald-600 text-xl animate-pulse" />
        </div>
        <p className="mt-4 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
          Chargement du tableur style Google Sheets…
        </p>
        <p className="text-xs text-gray-500 mt-1">Analyse des feuilles et des cellules en cours</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <FaInfoCircle className="mx-auto text-red-500 text-3xl mb-3" />
        <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
        <a
          href={fileUrl}
          download
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
        >
          <FaDownload /> Télécharger le fichier original
        </a>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full min-h-[550px]'
    }`}>
      {/* ── Top Header Toolbar (Google Sheets Style) ──────────────── */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: App Logo & Document Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <FaFileExcel className="text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100 truncate max-w-xs">{fileName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                Google Sheets View
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {currentMatrix.length} lignes × {maxCols} colonnes
            </p>
          </div>
        </div>

        {/* Center: Search & Actions */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-center">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-2.5 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans la feuille…"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right: Zoom & Fullscreen */}
        <div className="flex items-center gap-2">
          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
          >
            <option value={80}>80%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
            <option value={150}>150%</option>
          </select>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
            title={isFullscreen ? "Quitter le mode plein écran" : "Mode plein écran"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* ── Formula Bar (Cell Selector & Value Viewer) ─────────────── */}
      <div className="bg-slate-850 bg-slate-900/90 border-b border-slate-700 px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-slate-300">
        <div className="w-12 py-1 px-2 bg-slate-800 border border-slate-700 rounded text-center text-emerald-400 font-bold">
          {cellAddress}
        </div>
        <div className="text-slate-500 font-bold">fx</div>
        <div className="flex-1 py-1 px-3 bg-slate-950 border border-slate-800 rounded truncate text-slate-200 min-h-[26px]">
          {String(cellValue)}
        </div>
      </div>

      {/* ── Main Interactive Table Grid ─────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-slate-950 relative" style={{ zoom: `${zoomLevel}%` }}>
        {currentMatrix.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Feuille vide ou sans contenu.</div>
        ) : (
          <table className="w-full border-collapse text-xs text-slate-200 select-text">
            <thead>
              <tr className="bg-slate-850 bg-slate-900 sticky top-0 z-20 shadow">
                {/* Top-Left Empty Corner Header */}
                <th className="w-12 h-7 min-w-12 bg-slate-800 border border-slate-700 text-slate-400 font-normal text-center text-[10px] sticky left-0 z-30">
                  #
                </th>
                {/* Column Headers A, B, C... */}
                {Array.from({ length: maxCols }).map((_, colIdx) => (
                  <th
                    key={colIdx}
                    className={`h-7 px-3 border border-slate-700 font-medium text-slate-300 min-w-[100px] text-center bg-slate-850 hover:bg-slate-800 transition-colors ${
                      selectedCell.col === colIdx ? 'bg-emerald-950/60 text-emerald-300 border-b-2 border-b-emerald-500' : ''
                    }`}
                  >
                    {getColumnLetter(colIdx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMatrix.map((row, rowIdx) => {
                const isRowSelected = selectedCell.row === rowIdx;
                return (
                  <tr
                    key={rowIdx}
                    className={`hover:bg-slate-900/60 transition-colors ${
                      isRowSelected ? 'bg-slate-900' : rowIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'
                    }`}
                  >
                    {/* Row Index Header 1, 2, 3... */}
                    <td className={`w-12 h-6 min-w-12 border border-slate-800 text-slate-500 text-center font-mono text-[10px] bg-slate-900 sticky left-0 z-10 ${
                      isRowSelected ? 'bg-emerald-950/60 text-emerald-400 font-bold border-r-2 border-r-emerald-500' : ''
                    }`}>
                      {rowIdx + 1}
                    </td>

                    {/* Row Cells */}
                    {Array.from({ length: maxCols }).map((_, colIdx) => {
                      const rawVal = row ? row[colIdx] : '';
                      const displayVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
                      const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx;
                      const matchesSearch = searchTerm && displayVal.toLowerCase().includes(searchTerm.toLowerCase());

                      return (
                        <td
                          key={colIdx}
                          onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                          className={`px-2 py-1.5 border border-slate-800/80 truncate max-w-[250px] cursor-cell transition-all ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 bg-emerald-950/50 text-white font-medium z-10 relative'
                              : matchesSearch
                              ? 'bg-amber-500/30 text-amber-200 font-bold'
                              : 'text-slate-300'
                          }`}
                          title={displayVal}
                        >
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom Bar: Google Sheets Tabs & Stats Summary ──────────── */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {sheetNames.map((name) => {
            const isActive = name === activeSheet;
            return (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1.5 rounded-t-lg font-medium text-xs flex items-center gap-1.5 transition-all border-t-2 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-transparent'
                }`}
              >
                <FaTable className="text-[10px]" />
                <span>{name}</span>
              </button>
            );
          })}
        </div>

        {/* Statistics Bar */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          <span>Valeurs : <strong className="text-slate-200">{stats.count}</strong></span>
          {stats.sum !== null && (
            <>
              <span className="border-l border-slate-800 pl-3">Somme : <strong className="text-emerald-400">{stats.sum}</strong></span>
              <span className="border-l border-slate-800 pl-3">Moyenne : <strong className="text-cyan-400">{stats.avg}</strong></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetViewer;
