import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
  FaFileExcel, FaSave, FaDownload, FaUsers, FaArrowLeft,
  FaBold, FaItalic, FaStrikethrough, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaPlus, FaTrash, FaSearch, FaCheck, FaSpinner, FaTable, FaGlobe,
  FaChevronDown, FaUndo, FaRedo, FaShare, FaEye, FaComment
} from 'react-icons/fa';
import AccessPanel from '@/Components/Files/AccessPanel';

const COLLAB_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#7c3aed',
  '#db2777', '#0891b2', '#ea580c', '#4f46e5'
];

const getColumnLetter = (colIdx) => {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

const columnLetterToIndex = (colLetter) => {
  let col = 0;
  for (let i = 0; i < colLetter.length; i++) {
    col = col * 26 + (colLetter.charCodeAt(i) - 64);
  }
  return col - 1;
};

// Évalue une formule simple (ex: =SUM(A1:A5), =A1+B1, =AVERAGE(B1:B10))
const evaluateFormula = (rawVal, matrix) => {
  if (typeof rawVal !== 'string' || !rawVal.startsWith('=')) {
    return rawVal;
  }

  const formula = rawVal.substring(1).trim().toUpperCase();

  try {
    // 1. =SUM(A1:A5)
    const sumMatch = formula.match(/^SUM\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
    if (sumMatch) {
      const startCol = columnLetterToIndex(sumMatch[1]);
      const startRow = parseInt(sumMatch[2], 10) - 1;
      const endCol = columnLetterToIndex(sumMatch[3]);
      const endRow = parseInt(sumMatch[4], 10) - 1;

      let sum = 0;
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          const v = Number(matrix[r]?.[c] ?? 0);
          if (!isNaN(v)) sum += v;
        }
      }
      return sum;
    }

    // 2. =AVERAGE(A1:A5)
    const avgMatch = formula.match(/^AVERAGE\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
    if (avgMatch) {
      const startCol = columnLetterToIndex(avgMatch[1]);
      const startRow = parseInt(avgMatch[2], 10) - 1;
      const endCol = columnLetterToIndex(avgMatch[3]);
      const endRow = parseInt(avgMatch[4], 10) - 1;

      let sum = 0;
      let count = 0;
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          const v = Number(matrix[r]?.[c] ?? 0);
          if (!isNaN(v)) {
            sum += v;
            count++;
          }
        }
      }
      return count > 0 ? (sum / count).toFixed(2) : 0;
    }

    // 3. =COUNT(A1:A5)
    const countMatch = formula.match(/^COUNT\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)$/);
    if (countMatch) {
      const startCol = columnLetterToIndex(countMatch[1]);
      const startRow = parseInt(countMatch[2], 10) - 1;
      const endCol = columnLetterToIndex(countMatch[3]);
      const endRow = parseInt(countMatch[4], 10) - 1;

      let count = 0;
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          const v = matrix[r]?.[c];
          if (v !== '' && v !== null && v !== undefined) count++;
        }
      }
      return count;
    }

    // 4. Arithmetic with cell coordinates (ex: =A1+B1, =A1*2)
    const replaced = formula.replace(/([A-Z]+)(\d+)/g, (match, colLetters, rowNumber) => {
      const c = columnLetterToIndex(colLetters);
      const r = parseInt(rowNumber, 10) - 1;
      const v = Number(matrix[r]?.[c] ?? 0);
      return isNaN(v) ? 0 : v;
    });

    if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${replaced})`)();
      return typeof res === 'number' ? (Number.isInteger(res) ? res : res.toFixed(2)) : res;
    }
  } catch {
    return '#VALEUR!';
  }

  return rawVal;
};

export default function EditSpreadsheet({
  file,
  auth,
  myPermission = 'edit',
  collaborators = [],
  canManageAccess = false,
  share_url = '',
  public_permission = 'none',
}) {
  const isReadOnly = myPermission === 'view' || myPermission === 'none';

  // Parser les données initiales
  const initialData = useMemo(() => {
    try {
      if (typeof file.content === 'string') {
        const parsed = JSON.parse(file.content);
        if (parsed.sheets && parsed.sheetNames) return parsed;
      }
    } catch {}
    const defaultRows = Array.from({ length: 40 }, () => Array.from({ length: 16 }, () => ''));
    return {
      sheets: { 'Feuille 1': defaultRows },
      sheetNames: ['Feuille 1'],
    };
  }, [file.content]);

  const [sheets, setSheets] = useState(initialData.sheets);
  const [sheetNames, setSheetNames] = useState(initialData.sheetNames);
  const [activeSheet, setActiveSheet] = useState(initialData.sheetNames[0] || 'Feuille 1');
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [isEditingCell, setIsEditingCell] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const [cellStyles, setCellStyles] = useState({}); // { 'Sheet!R_C': { bold, italic, align, color, bg } }

  // États de l'interface
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Enregistré');
  const [sidePanel, setSidePanel] = useState(null); // 'access' | null
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Collaborateurs en ligne et curseurs distants
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [remoteSelections, setRemoteSelections] = useState({}); // { userId: { row, col, name, color } }

  const channelRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const formulaInputRef = useRef(null);

  const currentMatrix = useMemo(() => {
    return sheets[activeSheet] || [];
  }, [sheets, activeSheet]);

  const currentCols = useMemo(() => {
    if (!currentMatrix.length) return 15;
    return Math.max(15, ...currentMatrix.map(r => r ? r.length : 0));
  }, [currentMatrix]);

  const cellCoord = `${getColumnLetter(selectedCell.col)}${selectedCell.row + 1}`;
  const rawCellValue = currentMatrix[selectedCell.row]?.[selectedCell.col] ?? '';

  // Synchroniser la barre de formule avec la cellule sélectionnée
  useEffect(() => {
    setFormulaInput(rawCellValue !== null && rawCellValue !== undefined ? String(rawCellValue) : '');
  }, [selectedCell, rawCellValue]);

  // ─── Pusher Presence & Collaboration en temps réel ───
  useEffect(() => {
    if (!window.Echo) return;

    const channelName = `presence-document.${file.id}`;
    const channel = window.Echo.join(channelName);
    channelRef.current = channel;

    channel
      .here((users) => {
        setOnlineUsers(users.map((u, i) => ({
          ...u,
          color: u.color || COLLAB_COLORS[i % COLLAB_COLORS.length],
        })));
      })
      .joining((user) => {
        setOnlineUsers(prev => {
          if (prev.some(u => u.id === user.id)) return prev;
          const color = user.color || COLLAB_COLORS[prev.length % COLLAB_COLORS.length];
          return [...prev, { ...user, color }];
        });
      })
      .leaving((user) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== user.id));
        setRemoteSelections(prev => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
      })
      .listenForWhisper('cell-select', (data) => {
        if (!data || !data.user) return;
        setRemoteSelections(prev => ({
          ...prev,
          [data.user.id]: {
            row: data.row,
            col: data.col,
            sheet: data.sheet,
            name: data.user.name,
            color: data.user.color,
          },
        }));
      })
      .listenForWhisper('cell-change', (data) => {
        if (!data || !data.sheet) return;
        setSheets(prev => {
          const nextSheet = prev[data.sheet] ? prev[data.sheet].map(r => [...r]) : [];
          if (!nextSheet[data.row]) {
            while (nextSheet.length <= data.row) nextSheet.push([]);
          }
          nextSheet[data.row][data.col] = data.value;
          return { ...prev, [data.sheet]: nextSheet };
        });
      })
      .listenForWhisper('sheet-add', (data) => {
        if (!data || !data.sheetName) return;
        setSheetNames(prev => prev.includes(data.sheetName) ? prev : [...prev, data.sheetName]);
        setSheets(prev => ({
          ...prev,
          [data.sheetName]: prev[data.sheetName] || Array.from({ length: 35 }, () => Array.from({ length: 15 }, () => '')),
        }));
      });

    return () => {
      window.Echo.leave(channelName);
    };
  }, [file.id]);

  // Diffuser notre sélection de cellule aux collaborateurs
  const broadcastCellSelect = useCallback((row, col) => {
    if (!channelRef.current || isReadOnly) return;
    channelRef.current.whisper('cell-select', {
      row,
      col,
      sheet: activeSheet,
      user: {
        id: auth.user.id,
        name: auth.user.name,
        color: COLLAB_COLORS[auth.user.id % COLLAB_COLORS.length],
      },
    });
  }, [activeSheet, auth.user, isReadOnly]);

  // Diffuser un changement de cellule aux collaborateurs
  const broadcastCellChange = useCallback((row, col, value) => {
    if (!channelRef.current || isReadOnly) return;
    channelRef.current.whisper('cell-change', {
      row,
      col,
      value,
      sheet: activeSheet,
    });
  }, [activeSheet, isReadOnly]);

  // Enregistrement sur le serveur
  const saveSpreadsheetData = useCallback(async (currentSheets, currentSheetNames) => {
    if (isReadOnly) return;
    setIsSaving(true);
    setSaveStatus('Enregistrement…');

    try {
      const payload = JSON.stringify({
        sheets: currentSheets,
        sheetNames: currentSheetNames,
        cellStyles,
      });

      const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
      await axios.put(`/files/${file.id}/content`, {
        content: payload,
      }, {
        headers: { 'X-CSRF-TOKEN': csrf },
      });

      setSaveStatus('Modifications enregistrées');
    } catch {
      setSaveStatus('Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [file.id, isReadOnly, cellStyles]);

  // Mise à jour de la cellule active
  const updateCellValue = useCallback((row, col, value) => {
    if (isReadOnly) return;

    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(r => [...r]) : [];
      while (matrix.length <= row) matrix.push(Array.from({ length: currentCols }, () => ''));
      matrix[row][col] = value;
      const updated = { ...prev, [activeSheet]: matrix };

      // Auto-save debounced
      clearTimeout(autoSaveTimerRef.current);
      setSaveStatus('Modifications en attente…');
      autoSaveTimerRef.current = setTimeout(() => {
        saveSpreadsheetData(updated, sheetNames);
      }, 1500);

      return updated;
    });

    broadcastCellChange(row, col, value);
  }, [activeSheet, currentCols, isReadOnly, sheetNames, saveSpreadsheetData, broadcastCellChange]);

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
    setIsEditingCell(false);
    broadcastCellSelect(row, col);
  };

  const handleCellDoubleClick = (row, col) => {
    if (isReadOnly) return;
    setSelectedCell({ row, col });
    setIsEditingCell(true);
    broadcastCellSelect(row, col);
  };

  // Ajout / Suppression de lignes et colonnes
  const addRow = () => {
    if (isReadOnly) return;
    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(r => [...r]) : [];
      const newRow = Array.from({ length: currentCols }, () => '');
      matrix.splice(selectedCell.row + 1, 0, newRow);
      const updated = { ...prev, [activeSheet]: matrix };
      saveSpreadsheetData(updated, sheetNames);
      return updated;
    });
  };

  const deleteRow = () => {
    if (isReadOnly || currentMatrix.length <= 1) return;
    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(r => [...r]) : [];
      matrix.splice(selectedCell.row, 1);
      const updated = { ...prev, [activeSheet]: matrix };
      saveSpreadsheetData(updated, sheetNames);
      return updated;
    });
  };

  const addColumn = () => {
    if (isReadOnly) return;
    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(r => {
        const nextRow = [...r];
        nextRow.splice(selectedCell.col + 1, 0, '');
        return nextRow;
      }) : [];
      const updated = { ...prev, [activeSheet]: matrix };
      saveSpreadsheetData(updated, sheetNames);
      return updated;
    });
  };

  const deleteColumn = () => {
    if (isReadOnly || currentCols <= 1) return;
    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(r => {
        const nextRow = [...r];
        nextRow.splice(selectedCell.col, 1);
        return nextRow;
      }) : [];
      const updated = { ...prev, [activeSheet]: matrix };
      saveSpreadsheetData(updated, sheetNames);
      return updated;
    });
  };

  // Ajout de nouvelle feuille
  const addNewSheet = () => {
    if (isReadOnly) return;
    const newName = `Feuille ${sheetNames.length + 1}`;
    const newRows = Array.from({ length: 35 }, () => Array.from({ length: 15 }, () => ''));
    const nextSheets = { ...sheets, [newName]: newRows };
    const nextNames = [...sheetNames, newName];

    setSheets(nextSheets);
    setSheetNames(nextNames);
    setActiveSheet(newName);
    saveSpreadsheetData(nextSheets, nextNames);

    if (channelRef.current) {
      channelRef.current.whisper('sheet-add', { sheetName: newName });
    }
  };

  // Export Excel (.xlsx) avec SheetJS
  const exportToExcel = async () => {
    try {
      let XLSX = window.XLSX;
      if (!XLSX) XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();
      sheetNames.forEach(sName => {
        const matrix = sheets[sName] || [];
        // Évaluer les formules pour l'export
        const calculatedMatrix = matrix.map(row =>
          row.map(val => evaluateFormula(val, matrix))
        );
        const ws = XLSX.utils.aoa_to_sheet(calculatedMatrix);
        XLSX.utils.book_append_sheet(wb, ws, sName);
      });

      const fileName = file.name.endsWith('.xlsx') ? file.name : `${file.name}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error("Erreur lors de l'export Excel:", err);
      alert("Erreur lors de l'exportation du fichier Excel.");
    }
  };

  // Statistiques de la feuille active
  const stats = useMemo(() => {
    let count = 0;
    let sum = 0;
    let numCount = 0;

    currentMatrix.forEach(row => {
      if (!row) return;
      row.forEach(cell => {
        if (cell !== '' && cell !== null && cell !== undefined) {
          count++;
          const evalVal = evaluateFormula(cell, currentMatrix);
          const num = Number(evalVal);
          if (!isNaN(num) && typeof evalVal !== 'boolean') {
            sum += num;
            numCount++;
          }
        }
      });
    });

    return {
      count,
      sum: numCount > 0 ? (Number.isInteger(sum) ? sum : sum.toFixed(2)) : null,
      avg: numCount > 0 ? (sum / numCount).toFixed(2) : null,
    };
  }, [currentMatrix]);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 select-none overflow-hidden font-sans">
      <Head title={`${file.name} - Tableur collaboratif ProJA`} />

      {/* ─── 1. TOP BAR GOOGLE SHEETS STYLE ─── */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Retour"
          >
            <FaArrowLeft className="text-sm" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-md shrink-0">
            <FaFileExcel />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate max-w-xs">{file.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                Excel Temps Réel
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{saveStatus}</span>
              <span>•</span>
              <span>{isReadOnly ? 'Lecture seule' : 'Édition collaborative'}</span>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center relative max-w-xs w-full">
          <FaSearch className="absolute left-3 top-2.5 text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="Rechercher dans les cellules…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Right: Collaborators & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Active Collaborators Online */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {onlineUsers.map(u => (
              <div
                key={u.id}
                title={`En ligne : ${u.name}`}
                className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-slate-950 shadow-sm cursor-default"
                style={{ backgroundColor: u.color || '#10b981' }}
              >
                {(u.name || '?')[0].toUpperCase()}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={exportToExcel}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Télécharger au format .xlsx pour Microsoft Excel"
          >
            <FaDownload className="text-[11px] text-emerald-400" />
            <span>Exporter XLSX</span>
          </button>

          <button
            type="button"
            onClick={() => setSidePanel(sidePanel === 'access' ? null : 'access')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <FaUsers className="text-xs" />
            <span>Partager</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => saveSpreadsheetData(sheets, sheetNames)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isSaving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. TOOLBAR (Formatting & Row/Col Actions) ─── */}
      <div className="bg-slate-850 bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex flex-wrap items-center gap-1 text-xs shrink-0">
        <button
          onClick={addRow}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Ajouter une ligne"
        >
          <FaPlus className="text-[10px] text-emerald-400" /> Ligne
        </button>

        <button
          onClick={addColumn}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Ajouter une colonne"
        >
          <FaPlus className="text-[10px] text-blue-400" /> Colonne
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1.5" />

        <button
          onClick={deleteRow}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Supprimer la ligne sélectionnée"
        >
          <FaTrash className="text-[9px]" /> Ligne
        </button>

        <button
          onClick={deleteColumn}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Supprimer la colonne sélectionnée"
        >
          <FaTrash className="text-[9px]" /> Colonne
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1.5" />

        <select
          value={zoomLevel}
          onChange={e => setZoomLevel(Number(e.target.value))}
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
        >
          <option value={80}>80%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
        </select>
      </div>

      {/* ─── 3. FORMULA BAR ─── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center gap-2 font-mono text-xs shrink-0">
        <div className="w-14 py-1 px-2 bg-slate-950 border border-slate-700 rounded text-center text-emerald-400 font-bold shrink-0">
          {cellCoord}
        </div>
        <div className="text-slate-500 font-bold italic select-none">fx</div>
        <input
          ref={formulaInputRef}
          type="text"
          disabled={isReadOnly}
          value={formulaInput}
          onChange={e => {
            setFormulaInput(e.target.value);
            updateCellValue(selectedCell.row, selectedCell.col, e.target.value);
          }}
          placeholder="Entrez une valeur ou formule (ex: =SUM(A1:A5), =A1+B1)…"
          className="flex-1 py-1 px-3 bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* ─── 4. MAIN CONTENT AREA WITH SIDEBAR IF OPEN ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Grid Table */}
        <div className="flex-1 overflow-auto bg-slate-950 relative" style={{ zoom: `${zoomLevel}%` }}>
          <table className="w-full border-collapse text-xs select-text">
            <thead>
              <tr className="sticky top-0 z-20 shadow bg-slate-900">
                <th className="w-12 h-7 min-w-12 bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[10px] text-center sticky left-0 z-30">
                  #
                </th>
                {Array.from({ length: currentCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    className={`h-7 px-3 border border-slate-700 font-semibold text-slate-300 min-w-[110px] text-center bg-slate-850 hover:bg-slate-800 transition ${
                      selectedCell.col === cIdx ? 'bg-emerald-950/70 text-emerald-300 border-b-2 border-b-emerald-500' : ''
                    }`}
                  >
                    {getColumnLetter(cIdx)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: Math.max(35, currentMatrix.length) }).map((_, rIdx) => {
                const row = currentMatrix[rIdx] || [];
                const isRowSelected = selectedCell.row === rIdx;

                return (
                  <tr
                    key={rIdx}
                    className={`hover:bg-slate-900/60 transition ${
                      isRowSelected ? 'bg-slate-900/80' : rIdx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'
                    }`}
                  >
                    {/* Row header 1, 2, 3... */}
                    <td className={`w-12 h-6 min-w-12 border border-slate-800 text-center font-mono text-[10px] sticky left-0 z-10 ${
                      isRowSelected ? 'bg-emerald-950/60 text-emerald-400 font-bold border-r-2 border-r-emerald-500' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {rIdx + 1}
                    </td>

                    {/* Cells */}
                    {Array.from({ length: currentCols }).map((_, cIdx) => {
                      const rawVal = row[cIdx] ?? '';
                      const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                      const displayVal = evaluateFormula(rawVal, currentMatrix);
                      const isSearching = searchTerm && String(displayVal).toLowerCase().includes(searchTerm.toLowerCase());

                      // Collaborateur distant ayant sélectionné cette cellule
                      const remoteUser = Object.values(remoteSelections).find(
                        sel => sel.sheet === activeSheet && sel.row === rIdx && sel.col === cIdx
                      );

                      return (
                        <td
                          key={cIdx}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          onDoubleClick={() => handleCellDoubleClick(rIdx, cIdx)}
                          className={`px-2.5 py-1.5 border border-slate-800/80 truncate max-w-[250px] cursor-cell transition-all relative font-mono ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 bg-emerald-950/40 text-white font-medium z-10'
                              : isSearching
                              ? 'bg-amber-500/30 text-amber-200 font-bold'
                              : 'text-slate-300'
                          }`}
                          style={
                            remoteUser
                              ? { outline: `2px solid ${remoteUser.color}`, outlineOffset: '-1px' }
                              : {}
                          }
                          title={String(rawVal)}
                        >
                          {/* Tag de nom du collaborateur distant sur la cellule */}
                          {remoteUser && (
                            <span
                              className="absolute -top-3.5 left-0 px-1 py-0.2 rounded text-[9px] font-bold text-white z-30 whitespace-nowrap shadow-sm pointer-events-none"
                              style={{ backgroundColor: remoteUser.color }}
                            >
                              {remoteUser.name}
                            </span>
                          )}

                          {isSelected && isEditingCell && !isReadOnly ? (
                            <input
                              autoFocus
                              type="text"
                              value={rawVal}
                              onChange={e => updateCellValue(rIdx, cIdx, e.target.value)}
                              onBlur={() => setIsEditingCell(false)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  setIsEditingCell(false);
                                  setSelectedCell(prev => ({ ...prev, row: prev.row + 1 }));
                                }
                              }}
                              className="w-full bg-slate-900 text-white outline-none px-1 py-0.5 rounded"
                            />
                          ) : (
                            <span>{String(displayVal ?? '')}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panneau de partage coulissant */}
        {sidePanel === 'access' && (
          <AccessPanel
            fileId={file.id}
            initialCollaborators={collaborators}
            canManage={canManageAccess}
            initialShareUrl={share_url}
            initialPublicPermission={public_permission}
            onClose={() => setSidePanel(null)}
          />
        )}
      </div>

      {/* ─── 5. BOTTOM BAR (Tabs & Summary Statistics) ─── */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Sheet Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {sheetNames.map(name => {
            const isActive = name === activeSheet;
            return (
              <button
                key={name}
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1 rounded-t-lg font-medium text-xs flex items-center gap-1.5 transition border-b-2 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border-transparent'
                }`}
              >
                <FaTable className="text-[10px]" />
                <span>{name}</span>
              </button>
            );
          })}

          {!isReadOnly && (
            <button
              onClick={addNewSheet}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Ajouter une nouvelle feuille"
            >
              <FaPlus className="text-xs" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
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
}
