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

// Évalue les formules courantes sans quitter le tableur.
const evaluateFormula = (rawVal, matrix, visited = new Set()) => {
  if (typeof rawVal !== 'string' || !rawVal.startsWith('=')) {
    return rawVal;
  }

  const formula = rawVal.substring(1).trim().toUpperCase();
  const resolveCell = (row, col, seen = visited) => {
    const key = `${row}_${col}`;
    if (seen.has(key)) return '#REF!';
    const value = matrix[row]?.[col] ?? '';
    if (typeof value !== 'string' || !value.startsWith('=')) return value;
    return evaluateFormula(value, matrix, new Set([...seen, key]));
  };
  const getRangeValues = (range) => {
    const match = range.match(/^\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/);
    if (!match) return null;
    const startCol = columnLetterToIndex(match[1]);
    const startRow = parseInt(match[2], 10) - 1;
    const endCol = columnLetterToIndex(match[3]);
    const endRow = parseInt(match[4], 10) - 1;
    const values = [];
    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        values.push(resolveCell(row, col));
      }
    }
    return values;
  };

  try {
    const functionMatch = formula.match(/^(SUM|AVERAGE|COUNT|COUNTA|MIN|MAX)\((.+)\)$/);
    if (functionMatch) {
      const values = getRangeValues(functionMatch[2]);
      if (!values) return rawVal;
      const numbers = values
        .filter(value => value !== '' && value !== null && value !== undefined)
        .map(Number)
        .filter(Number.isFinite);
      switch (functionMatch[1]) {
        case 'SUM': return numbers.reduce((sum, value) => sum + value, 0);
        case 'AVERAGE': return numbers.length ? Number((numbers.reduce((sum, value) => sum + value, 0) / numbers.length).toFixed(2)) : 0;
        case 'COUNT': return numbers.length;
        case 'COUNTA': return values.filter(value => value !== '' && value !== null && value !== undefined).length;
        case 'MIN': return numbers.length ? Math.min(...numbers) : 0;
        case 'MAX': return numbers.length ? Math.max(...numbers) : 0;
        default: return rawVal;
      }
    }

    const replaced = formula.replace(/\$?([A-Z]+)\$?(\d+)/g, (match, colLetters, rowNumber) => {
      const c = columnLetterToIndex(colLetters);
      const r = parseInt(rowNumber, 10) - 1;
      const value = resolveCell(r, c);
      const number = Number(value);
      return Number.isFinite(number) ? number : 0;
    });

    if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
      const res = Function(`'use strict'; return (${replaced})`)();
      return typeof res === 'number' && Number.isFinite(res)
        ? (Number.isInteger(res) ? res : Number(res.toFixed(2)))
        : '#VALEUR!';
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
      cellStyles: {},
    };
  }, [file.content]);

  const [sheets, setSheets] = useState(initialData.sheets);
  const [sheetNames, setSheetNames] = useState(initialData.sheetNames);
  const [activeSheet, setActiveSheet] = useState(initialData.sheetNames[0] || 'Feuille 1');
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [isEditingCell, setIsEditingCell] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const [cellStyles, setCellStyles] = useState(initialData.cellStyles || {});

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
  const gridRef = useRef(null);

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

  useEffect(() => {
    if (isEditingCell) return;
    gridRef.current
      ?.querySelector(`[data-cell-row="${selectedCell.row}"][data-cell-col="${selectedCell.col}"]`)
      ?.focus({ preventScroll: true });
  }, [activeSheet, isEditingCell, selectedCell]);

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
      .listenForWhisper('cell-style', (data) => {
        if (!data?.sheet || !data.style) return;
        const key = `${data.sheet}!${data.row}_${data.col}`;
        setCellStyles(prev => ({ ...prev, [key]: data.style }));
      })
      .listenForWhisper('sheet-add', (data) => {
        if (!data || !data.sheetName) return;
        setSheetNames(prev => prev.includes(data.sheetName) ? prev : [...prev, data.sheetName]);
        setSheets(prev => ({
          ...prev,
          [data.sheetName]: prev[data.sheetName] || Array.from({ length: 35 }, () => Array.from({ length: 15 }, () => '')),
        }));
      })
      .listenForWhisper('sheet-rename', (data) => {
        if (!data?.oldName || !data?.newName) return;
        setSheetNames(prev => prev.map(name => name === data.oldName ? data.newName : name));
        setSheets(prev => {
          if (!prev[data.oldName]) return prev;
          const next = { ...prev, [data.newName]: prev[data.oldName] };
          delete next[data.oldName];
          return next;
        });
        setCellStyles(prev => Object.fromEntries(Object.entries(prev).map(([key, style]) => [
          key.startsWith(`${data.oldName}!`) ? `${data.newName}!${key.slice(data.oldName.length + 1)}` : key,
          style,
        ])));
        setActiveSheet(prev => prev === data.oldName ? data.newName : prev);
      })
      .listenForWhisper('sheet-delete', (data) => {
        if (!data?.sheetName) return;
        setSheetNames(prev => {
          const nextNames = prev.filter(name => name !== data.sheetName);
          setActiveSheet(current => current === data.sheetName ? (nextNames[0] || 'Feuille 1') : current);
          return nextNames.length ? nextNames : ['Feuille 1'];
        });
        setSheets(prev => {
          const next = { ...prev };
          delete next[data.sheetName];
          return next;
        });
        setCellStyles(prev => Object.fromEntries(
          Object.entries(prev).filter(([key]) => !key.startsWith(`${data.sheetName}!`))
        ));
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
  const saveSpreadsheetData = useCallback(async (currentSheets, currentSheetNames, currentCellStyles = cellStyles) => {
    if (isReadOnly) return;
    setIsSaving(true);
    setSaveStatus('Enregistrement…');

    try {
      const payload = JSON.stringify({
        sheets: currentSheets,
        sheetNames: currentSheetNames,
        cellStyles: currentCellStyles,
      });

      const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
      await axios.put(`/files/${file.id}/content`, {
        content: payload,
      }, {
        headers: { 'X-CSRF-TOKEN': csrf },
      });

      setSaveStatus('Modifications enregistrées');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du tableur:', error);
      setSaveStatus('Erreur de sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [file.id, isReadOnly, cellStyles]);

  const updateSelectedCellStyle = useCallback((updates) => {
    if (isReadOnly) return;
    const key = `${activeSheet}!${selectedCell.row}_${selectedCell.col}`;
    const nextStyles = {
      ...cellStyles,
      [key]: { ...(cellStyles[key] || {}), ...updates },
    };
    setCellStyles(nextStyles);
    setSaveStatus('Modifications en attente…');
    channelRef.current?.whisper('cell-style', {
      sheet: activeSheet,
      row: selectedCell.row,
      col: selectedCell.col,
      style: nextStyles[key],
    });
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(
      () => saveSpreadsheetData(sheets, sheetNames, nextStyles),
      500
    );
  }, [activeSheet, cellStyles, isReadOnly, saveSpreadsheetData, selectedCell, sheets, sheetNames]);

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

  const handleCellKeyDown = (event, row, col) => {
    if (event.target instanceof HTMLInputElement) return;
    const moves = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (moves[event.key]) {
      event.preventDefault();
      const [rowDelta, colDelta] = moves[event.key];
      const next = {
        row: Math.max(0, row + rowDelta),
        col: Math.max(0, col + colDelta),
      };
      setSelectedCell(next);
      setIsEditingCell(false);
      broadcastCellSelect(next.row, next.col);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      if (isReadOnly) return;
      event.preventDefault();
      setIsEditingCell(true);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (isReadOnly) return;
      event.preventDefault();
      updateCellValue(row, col, '');
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (isReadOnly) return;
      event.preventDefault();
      updateCellValue(row, col, event.key);
      setIsEditingCell(true);
    }
  };

  const handlePaste = (event) => {
    if (isReadOnly) return;
    const pastedText = event.clipboardData?.getData('text/plain');
    if (pastedText === undefined) return;
    event.preventDefault();

    const rows = pastedText.replace(/\r/g, '').split('\n');
    if (rows[rows.length - 1] === '') rows.pop();
    const values = rows.map(row => row.split('\t'));
    if (!values.length) return;

    const start = { ...selectedCell };
    setSheets(prev => {
      const matrix = prev[activeSheet] ? prev[activeSheet].map(row => [...row]) : [];
      values.forEach((rowValues, rowOffset) => {
        const rowIndex = start.row + rowOffset;
        while (matrix.length <= rowIndex) matrix.push([]);
        rowValues.forEach((value, colOffset) => {
          matrix[rowIndex][start.col + colOffset] = value;
        });
      });

      const updated = { ...prev, [activeSheet]: matrix };
      clearTimeout(autoSaveTimerRef.current);
      setSaveStatus('Modifications en attente…');
      autoSaveTimerRef.current = setTimeout(
        () => saveSpreadsheetData(updated, sheetNames),
        500
      );
      return updated;
    });

    values.forEach((rowValues, rowOffset) => {
      rowValues.forEach((value, colOffset) => {
        broadcastCellChange(start.row + rowOffset, start.col + colOffset, value);
      });
    });
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
    let number = sheetNames.length + 1;
    while (sheetNames.includes(`Feuille ${number}`)) number += 1;
    const newName = `Feuille ${number}`;
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

  const renameSheet = (oldName) => {
    if (isReadOnly) return;
    const requestedName = window.prompt('Nom de la feuille', oldName);
    if (requestedName === null) return;
    const newName = requestedName.trim();
    if (!newName || newName.length > 31 || /[\\/?*:\[\]]/.test(newName)) {
      window.alert('Le nom doit contenir entre 1 et 31 caractères et ne pas inclure : \\ / ? * [ ]');
      return;
    }
    if (newName !== oldName && sheetNames.includes(newName)) {
      window.alert('Une feuille porte déjà ce nom.');
      return;
    }

    const nextSheets = { ...sheets };
    nextSheets[newName] = nextSheets[oldName];
    delete nextSheets[oldName];
    const nextNames = sheetNames.map(name => name === oldName ? newName : name);
    const nextStyles = Object.fromEntries(Object.entries(cellStyles).map(([key, style]) => [
      key.startsWith(`${oldName}!`) ? `${newName}!${key.slice(oldName.length + 1)}` : key,
      style,
    ]));
    setSheets(nextSheets);
    setSheetNames(nextNames);
    setCellStyles(nextStyles);
    setActiveSheet(newName);
    saveSpreadsheetData(nextSheets, nextNames, nextStyles);
    channelRef.current?.whisper('sheet-rename', { oldName, newName });
  };

  const deleteActiveSheet = () => {
    if (isReadOnly || sheetNames.length <= 1) return;
    if (!window.confirm(`Supprimer la feuille « ${activeSheet} » ?`)) return;
    const nextNames = sheetNames.filter(name => name !== activeSheet);
    const nextSheets = { ...sheets };
    delete nextSheets[activeSheet];
    const nextStyles = Object.fromEntries(
      Object.entries(cellStyles).filter(([key]) => !key.startsWith(`${activeSheet}!`))
    );
    setSheetNames(nextNames);
    setSheets(nextSheets);
    setCellStyles(nextStyles);
    setActiveSheet(nextNames[0]);
    saveSpreadsheetData(nextSheets, nextNames, nextStyles);
    channelRef.current?.whisper('sheet-delete', { sheetName: activeSheet });
  };

  // Export Excel (.xlsx) avec SheetJS
  const exportToExcel = async () => {
    try {
      let XLSX = window.XLSX;
      if (!XLSX) XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();
      sheetNames.forEach(sName => {
        const matrix = sheets[sName] || [];
        const ws = XLSX.utils.aoa_to_sheet(matrix.map(row =>
          row.map(value => typeof value === 'string' && value.startsWith('=') ? null : value)
        ));
        matrix.forEach((row, rowIndex) => {
          row.forEach((value, colIndex) => {
            if (typeof value === 'string' && value.startsWith('=')) {
              const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
              ws[address] = { t: 'n', f: value.slice(1) };
            }
          });
        });
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
  const selectedCellStyle = cellStyles[`${activeSheet}!${selectedCell.row}_${selectedCell.col}`] || {};

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

        <button
          type="button"
          onClick={() => updateSelectedCellStyle({ bold: !selectedCellStyle.bold })}
          disabled={isReadOnly}
          aria-label="Mettre en gras"
          title="Gras"
          className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.bold ? 'bg-emerald-900 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <FaBold />
        </button>
        <button
          type="button"
          onClick={() => updateSelectedCellStyle({ italic: !selectedCellStyle.italic })}
          disabled={isReadOnly}
          aria-label="Mettre en italique"
          title="Italique"
          className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.italic ? 'bg-emerald-900 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <FaItalic />
        </button>
        {[
          ['left', FaAlignLeft],
          ['center', FaAlignCenter],
          ['right', FaAlignRight],
        ].map(([alignment, Icon]) => (
          <button
            key={alignment}
            type="button"
            onClick={() => updateSelectedCellStyle({ align: alignment })}
            disabled={isReadOnly}
            aria-label={`Aligner ${alignment === 'left' ? 'à gauche' : alignment === 'right' ? 'à droite' : 'au centre'}`}
            title={`Alignement ${alignment}`}
            className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.align === alignment ? 'bg-emerald-900 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Icon />
          </button>
        ))}
        <label className="flex items-center gap-1 px-1 text-[10px] text-slate-400" title="Couleur du texte">
          A
          <input
            type="color"
            value={selectedCellStyle.color || '#cbd5e1'}
            onChange={event => updateSelectedCellStyle({ color: event.target.value })}
            disabled={isReadOnly}
            aria-label="Couleur du texte"
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 disabled:opacity-40"
          />
        </label>
        <label className="flex items-center gap-1 px-1 text-[10px] text-slate-400" title="Couleur de fond">
          Fond
          <input
            type="color"
            value={selectedCellStyle.bg || '#0f172a'}
            onChange={event => updateSelectedCellStyle({ bg: event.target.value })}
            disabled={isReadOnly}
            aria-label="Couleur de fond"
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 disabled:opacity-40"
          />
        </label>

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
        <div ref={gridRef} className="flex-1 overflow-auto bg-slate-950 relative" style={{ zoom: `${zoomLevel}%` }} onPaste={handlePaste}>
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
                          data-cell-row={rIdx}
                          data-cell-col={cIdx}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => handleCellClick(rIdx, cIdx)}
                          onDoubleClick={() => handleCellDoubleClick(rIdx, cIdx)}
                          onKeyDown={event => handleCellKeyDown(event, rIdx, cIdx)}
                          className={`px-2.5 py-1.5 border border-slate-800/80 truncate max-w-[250px] cursor-cell transition-all relative font-mono ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 bg-emerald-950/40 text-white font-medium z-10'
                              : isSearching
                              ? 'bg-amber-500/30 text-amber-200 font-bold'
                              : 'text-slate-300'
                          }`}
                          style={{
                            ...(cellStyles[`${activeSheet}!${rIdx}_${cIdx}`]?.bold ? { fontWeight: 700 } : {}),
                            ...(cellStyles[`${activeSheet}!${rIdx}_${cIdx}`]?.italic ? { fontStyle: 'italic' } : {}),
                            ...(cellStyles[`${activeSheet}!${rIdx}_${cIdx}`]?.align ? { textAlign: cellStyles[`${activeSheet}!${rIdx}_${cIdx}`].align } : {}),
                            ...(cellStyles[`${activeSheet}!${rIdx}_${cIdx}`]?.color ? { color: cellStyles[`${activeSheet}!${rIdx}_${cIdx}`].color } : {}),
                            ...(cellStyles[`${activeSheet}!${rIdx}_${cIdx}`]?.bg ? { backgroundColor: cellStyles[`${activeSheet}!${rIdx}_${cIdx}`].bg } : {}),
                            ...(remoteUser ? { outline: `2px solid ${remoteUser.color}`, outlineOffset: '-1px' } : {}),
                          }}
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
                onDoubleClick={() => renameSheet(name)}
                title={isReadOnly ? name : `${name} — double-cliquez pour renommer`}
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
            <>
              <button
                onClick={addNewSheet}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Ajouter une nouvelle feuille"
              >
                <FaPlus className="text-xs" />
              </button>
              <button
                onClick={deleteActiveSheet}
                disabled={sheetNames.length <= 1}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition disabled:opacity-40"
                title="Supprimer la feuille active"
              >
                <FaTrash className="text-[10px]" />
              </button>
            </>
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
