import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
  FaFileExcel, FaSave, FaDownload, FaUsers, FaArrowLeft,
  FaBold, FaItalic, FaStrikethrough, FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaPlus, FaTrash, FaSearch, FaSpinner, FaTable,
  FaUndo, FaRedo, FaHistory, FaUpload, FaTimes
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

const formatCellDisplay = (value, style = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;
  switch (style.numberFormat) {
    case '0.00': return numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case '0%': return `${(numericValue * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
    case '$#,##0.00': return numericValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
    case 'yyyy-mm-dd': {
      const excelDate = new Date(Date.UTC(1899, 11, 30) + numericValue * 86400000);
      return Number.isNaN(excelDate.getTime()) ? value : excelDate.toISOString().slice(0, 10);
    }
    default: return value;
  }
};

const shiftCellStyles = (styles, sheetName, axis, index, delta) => Object.fromEntries(
  Object.entries(styles).flatMap(([key, style]) => {
    if (!key.startsWith(`${sheetName}!`)) return [[key, style]];
    const coordinates = key.slice(sheetName.length + 1).split('_').map(Number);
    const target = coordinates[axis];
    if (delta < 0 && target === index) return [];
    if ((delta > 0 && target >= index) || (delta < 0 && target > index)) {
      coordinates[axis] += delta;
    }
    return [[`${sheetName}!${coordinates[0]}_${coordinates[1]}`, style]];
  })
);

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
  const [sidePanel, setSidePanel] = useState(null); // 'access' | 'history' | null
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [historyVersions, setHistoryVersions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyPreview, setHistoryPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  // Collaborateurs en ligne et curseurs distants
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [remoteSelections, setRemoteSelections] = useState({}); // { userId: { row, col, name, color } }

  const channelRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const formulaInputRef = useRef(null);
  const gridRef = useRef(null);
  const importInputRef = useRef(null);
  const workbookRef = useRef({
    sheets: initialData.sheets,
    sheetNames: initialData.sheetNames,
    cellStyles: initialData.cellStyles || {},
  });
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  useEffect(() => {
    workbookRef.current = { sheets, sheetNames, cellStyles };
  }, [sheets, sheetNames, cellStyles]);

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
      await axios.post(`/files/${file.id}/autosave`, {
        content: payload,
      }, {
        headers: { 'X-CSRF-TOKEN': csrf },
      });

      setSaveStatus('Modifications enregistrées');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du tableur:', error);
      setSaveStatus('Erreur de sauvegarde');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [file.id, isReadOnly, cellStyles]);

  const commitWorkbook = useCallback((updates, { record = true, save = true } = {}) => {
    const previous = workbookRef.current;
    const next = { ...previous, ...updates };
    if (record) {
      undoStackRef.current = [...undoStackRef.current, previous].slice(-50);
      redoStackRef.current = [];
    }
    workbookRef.current = next;
    setSheets(next.sheets);
    setSheetNames(next.sheetNames);
    setCellStyles(next.cellStyles);

    if (save) {
      clearTimeout(autoSaveTimerRef.current);
      setSaveStatus('Modifications en attente…');
      autoSaveTimerRef.current = setTimeout(
        () => saveSpreadsheetData(next.sheets, next.sheetNames, next.cellStyles),
        500
      );
    }
    return next;
  }, [saveSpreadsheetData]);

  const applyWorkbookHistory = useCallback((from, to) => {
    const target = from.current.pop();
    if (!target) return;
    to.current = [...to.current, workbookRef.current].slice(-50);
    workbookRef.current = target;
    setSheets(target.sheets);
    setSheetNames(target.sheetNames);
    setCellStyles(target.cellStyles);
    saveSpreadsheetData(target.sheets, target.sheetNames, target.cellStyles);
  }, [saveSpreadsheetData]);

  const undo = useCallback(() => applyWorkbookHistory(undoStackRef, redoStackRef), [applyWorkbookHistory]);
  const redo = useCallback(() => applyWorkbookHistory(redoStackRef, undoStackRef), [applyWorkbookHistory]);

  const loadVersionHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const { data } = await axios.get(`/files/${file.id}/versions`);
      setHistoryVersions(data.data ?? data);
    } catch (error) {
      console.error('Erreur lors du chargement de l’historique:', error);
      setHistoryError('Impossible de charger l’historique des versions.');
    } finally {
      setHistoryLoading(false);
    }
  }, [file.id]);

  useEffect(() => {
    if (sidePanel === 'history') loadVersionHistory();
  }, [sidePanel, loadVersionHistory]);

  const createVersionSnapshot = useCallback(async (content, label, summary) => {
    await axios.post(`/files/${file.id}/versions`, { content, label, summary });
    await loadVersionHistory();
  }, [file.id, loadVersionHistory]);

  const saveVersion = async () => {
    const content = JSON.stringify({ sheets, sheetNames, cellStyles });
    try {
      const saved = await saveSpreadsheetData(sheets, sheetNames, cellStyles);
      if (!saved) throw new Error('La sauvegarde du classeur a échoué.');
      await createVersionSnapshot(content, 'Version manuelle', 'Enregistrement demandé par l’utilisateur');
      setSaveStatus('Version enregistrée');
    } catch (error) {
      console.error('Erreur lors de la création de la version:', error);
      setSaveStatus('Erreur de sauvegarde');
      window.alert('Impossible de créer cette version. Réessayez.');
    }
  };

  const previewVersion = async (versionId) => {
    setHistoryError('');
    try {
      const { data } = await axios.get(`/files/${file.id}/versions/${versionId}`);
      setHistoryPreview(data.version);
    } catch (error) {
      console.error('Erreur lors du chargement de la version:', error);
      setHistoryError('Impossible de charger cette version.');
    }
  };

  const restoreVersion = async (version) => {
    if (!window.confirm(`Restaurer la version ${version.version_number} ? L’état actuel sera conservé dans l’historique.`)) return;
    try {
      await axios.post(`/files/${file.id}/versions/${version.id}/restore`);
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la restauration de la version:', error);
      window.alert('Impossible de restaurer cette version.');
    }
  };

  const importSpreadsheet = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('spreadsheet', selectedFile);
      const { data: response } = await axios.post(`/files/${file.id}/import`, formData);
      const importedData = JSON.parse(response.content);
      if (!importedData.sheets || !importedData.sheetNames?.length) {
        throw new Error('Le fichier ne contient aucune feuille exploitable.');
      }

      const priorContent = JSON.stringify({ sheets, sheetNames, cellStyles });
      await createVersionSnapshot(priorContent, 'Avant importation', `Avant l’import de ${selectedFile.name}`);
      commitWorkbook({
        sheets: importedData.sheets,
        sheetNames: importedData.sheetNames,
        cellStyles: importedData.cellStyles || {},
      }, { save: false });
      setActiveSheet(importedData.sheetNames[0]);
      setSelectedCell({ row: 0, col: 0 });
      const saved = await saveSpreadsheetData(
        importedData.sheets,
        importedData.sheetNames,
        importedData.cellStyles || {}
      );
      if (!saved) throw new Error('La sauvegarde du fichier importé a échoué.');
      setSaveStatus(`Importé : ${selectedFile.name}`);
    } catch (error) {
      console.error('Erreur lors de l’import du tableur:', error);
      setSaveStatus('Erreur d’importation');
      window.alert(`Impossible d’importer ce fichier : ${error.message || 'format non pris en charge'}`);
    } finally {
      setImporting(false);
    }
  };

  const updateSelectedCellStyle = useCallback((updates) => {
    if (isReadOnly) return;
    const key = `${activeSheet}!${selectedCell.row}_${selectedCell.col}`;
    const nextStyles = {
      ...workbookRef.current.cellStyles,
      [key]: { ...(workbookRef.current.cellStyles[key] || {}), ...updates },
    };
    commitWorkbook({ cellStyles: nextStyles });
    channelRef.current?.whisper('cell-style', {
      sheet: activeSheet,
      row: selectedCell.row,
      col: selectedCell.col,
      style: nextStyles[key],
    });
  }, [activeSheet, commitWorkbook, isReadOnly, selectedCell]);

  // Mise à jour de la cellule active
  const updateCellValue = useCallback((row, col, value) => {
    if (isReadOnly) return;

    const matrix = workbookRef.current.sheets[activeSheet]
      ? workbookRef.current.sheets[activeSheet].map(r => [...r])
      : [];
    while (matrix.length <= row) matrix.push(Array.from({ length: currentCols }, () => ''));
    matrix[row][col] = value;
    commitWorkbook({ sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix } });

    broadcastCellChange(row, col, value);
  }, [activeSheet, currentCols, isReadOnly, commitWorkbook, broadcastCellChange]);

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

    const handleSpreadsheetShortcuts = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        document.getElementById('spreadsheet-search')?.focus();
      }
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
    const matrix = workbookRef.current.sheets[activeSheet]
      ? workbookRef.current.sheets[activeSheet].map(row => [...row])
      : [];
    values.forEach((rowValues, rowOffset) => {
      const rowIndex = start.row + rowOffset;
      while (matrix.length <= rowIndex) matrix.push([]);
      rowValues.forEach((value, colOffset) => {
        matrix[rowIndex][start.col + colOffset] = value;
      });
    });
    commitWorkbook({ sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix } });

    values.forEach((rowValues, rowOffset) => {
      rowValues.forEach((value, colOffset) => {
        broadcastCellChange(start.row + rowOffset, start.col + colOffset, value);
      });
    });
  };

  // Ajout / Suppression de lignes et colonnes
  const addRow = () => {
    if (isReadOnly) return;
    const matrix = (workbookRef.current.sheets[activeSheet] || []).map(row => [...row]);
    matrix.splice(selectedCell.row + 1, 0, Array.from({ length: currentCols }, () => ''));
    commitWorkbook({
      sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix },
      cellStyles: shiftCellStyles(workbookRef.current.cellStyles, activeSheet, 0, selectedCell.row + 1, 1),
    });
  };

  const deleteRow = () => {
    if (isReadOnly || currentMatrix.length <= 1) return;
    const matrix = (workbookRef.current.sheets[activeSheet] || []).map(row => [...row]);
    matrix.splice(selectedCell.row, 1);
    commitWorkbook({
      sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix },
      cellStyles: shiftCellStyles(workbookRef.current.cellStyles, activeSheet, 0, selectedCell.row, -1),
    });
  };

  const addColumn = () => {
    if (isReadOnly) return;
    const matrix = (workbookRef.current.sheets[activeSheet] || []).map(row => {
      const nextRow = [...row];
      nextRow.splice(selectedCell.col + 1, 0, '');
      return nextRow;
    });
    commitWorkbook({
      sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix },
      cellStyles: shiftCellStyles(workbookRef.current.cellStyles, activeSheet, 1, selectedCell.col + 1, 1),
    });
  };

  const deleteColumn = () => {
    if (isReadOnly || currentCols <= 1) return;
    const matrix = (workbookRef.current.sheets[activeSheet] || []).map(row => {
      const nextRow = [...row];
      nextRow.splice(selectedCell.col, 1);
      return nextRow;
    });
    commitWorkbook({
      sheets: { ...workbookRef.current.sheets, [activeSheet]: matrix },
      cellStyles: shiftCellStyles(workbookRef.current.cellStyles, activeSheet, 1, selectedCell.col, -1),
    });
  };

  // Ajout de nouvelle feuille
  const addNewSheet = () => {
    if (isReadOnly) return;
    let number = sheetNames.length + 1;
    while (sheetNames.includes(`Feuille ${number}`)) number += 1;
    const newName = `Feuille ${number}`;
    const newRows = Array.from({ length: 35 }, () => Array.from({ length: 15 }, () => ''));
    const nextSheets = { ...workbookRef.current.sheets, [newName]: newRows };
    const nextNames = [...workbookRef.current.sheetNames, newName];

    commitWorkbook({ sheets: nextSheets, sheetNames: nextNames });
    setActiveSheet(newName);

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

    const current = workbookRef.current;
    const nextSheets = { ...current.sheets };
    nextSheets[newName] = nextSheets[oldName];
    delete nextSheets[oldName];
    const nextNames = current.sheetNames.map(name => name === oldName ? newName : name);
    const nextStyles = Object.fromEntries(Object.entries(current.cellStyles).map(([key, style]) => [
      key.startsWith(`${oldName}!`) ? `${newName}!${key.slice(oldName.length + 1)}` : key,
      style,
    ]));
    commitWorkbook({ sheets: nextSheets, sheetNames: nextNames, cellStyles: nextStyles });
    setActiveSheet(newName);
    channelRef.current?.whisper('sheet-rename', { oldName, newName });
  };

  const deleteActiveSheet = () => {
    if (isReadOnly || sheetNames.length <= 1) return;
    if (!window.confirm(`Supprimer la feuille « ${activeSheet} » ?`)) return;
    const current = workbookRef.current;
    const nextNames = current.sheetNames.filter(name => name !== activeSheet);
    const nextSheets = { ...current.sheets };
    delete nextSheets[activeSheet];
    const nextStyles = Object.fromEntries(
      Object.entries(current.cellStyles).filter(([key]) => !key.startsWith(`${activeSheet}!`))
    );
    commitWorkbook({ sheetNames: nextNames, sheets: nextSheets, cellStyles: nextStyles });
    setActiveSheet(nextNames[0]);
    channelRef.current?.whisper('sheet-delete', { sheetName: activeSheet });
  };

  // Exporter depuis le serveur pour conserver les styles du classeur.
  const exportToExcel = async () => {
    try {
      if (!isReadOnly) {
        const saved = await saveSpreadsheetData(sheets, sheetNames, cellStyles);
        if (!saved) throw new Error('La sauvegarde du classeur a échoué.');
      }

      window.location.assign(`/files/${file.id}/export-spreadsheet`);
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
  const previewData = useMemo(() => {
    if (!historyPreview) return null;
    try {
      return JSON.parse(historyPreview.content);
    } catch {
      return null;
    }
  }, [historyPreview]);

  return (
    <div onKeyDown={handleSpreadsheetShortcuts} className="flex flex-col h-screen bg-white text-slate-800 select-none overflow-hidden font-sans">
      <Head title={`${file.name} - Tableur collaboratif ProJA`} />

      {/* ─── 1. TOP BAR GOOGLE SHEETS STYLE ─── */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Retour"
          >
            <FaArrowLeft className="text-sm" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg shadow-md shrink-0">
            <FaFileExcel />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 truncate max-w-xs">{file.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tableur collaboratif
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
            id="spreadsheet-search"
            type="text"
            placeholder="Rechercher dans les cellules…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Right: Collaborators & Actions */}
        <div className="flex items-center gap-2.5">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.ods,.csv,.tsv"
            className="hidden"
            onChange={importSpreadsheet}
          />
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition disabled:opacity-50"
              title="Importer un classeur Excel, ODS ou CSV"
            >
              {importing ? <FaSpinner className="animate-spin text-xs" /> : <FaUpload className="text-xs text-emerald-700" />}
              <span>Importer</span>
            </button>
          )}
          {/* Active Collaborators Online */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {onlineUsers.map(u => (
              <div
                key={u.id}
                title={`En ligne : ${u.name}`}
                className="w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm cursor-default"
                style={{ backgroundColor: u.color || '#10b981' }}
              >
                {(u.name || '?')[0].toUpperCase()}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={exportToExcel}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Télécharger au format .xlsx pour Microsoft Excel"
          >
            <FaDownload className="text-[11px] text-emerald-700" />
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

          <button
            type="button"
            onClick={() => {
              setHistoryPreview(null);
              setSidePanel(sidePanel === 'history' ? null : 'history');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Afficher l’historique des versions"
          >
            <FaHistory className="text-xs text-emerald-700" />
            <span className="hidden lg:inline">Historique</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={saveVersion}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isSaving ? <FaSpinner className="animate-spin text-xs" /> : <FaSave className="text-xs" />}
              <span className="hidden sm:inline">Créer une version</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. TOOLBAR (Formatting & Row/Col Actions) ─── */}
      <div className="bg-slate-100 bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex flex-wrap items-center gap-1 text-xs shrink-0">
        <button
          onClick={addRow}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Ajouter une ligne"
        >
          <FaPlus className="text-[10px] text-emerald-700" /> Ligne
        </button>

        <button
          onClick={addColumn}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Ajouter une colonne"
        >
          <FaPlus className="text-[10px] text-blue-400" /> Colonne
        </button>

        <button
          type="button"
          onClick={undo}
          disabled={isReadOnly || undoStackRef.current.length === 0}
          title="Annuler (Ctrl+Z)"
          aria-label="Annuler"
          className="p-1.5 rounded text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <FaUndo />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={isReadOnly || redoStackRef.current.length === 0}
          title="Rétablir (Ctrl+Y)"
          aria-label="Rétablir"
          className="p-1.5 rounded text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <FaRedo />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1.5" />

        <button
          onClick={deleteRow}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-400 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Supprimer la ligne sélectionnée"
        >
          <FaTrash className="text-[9px]" /> Ligne
        </button>

        <button
          onClick={deleteColumn}
          disabled={isReadOnly}
          className="px-2 py-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-400 flex items-center gap-1 text-xs transition disabled:opacity-40"
          title="Supprimer la colonne sélectionnée"
        >
          <FaTrash className="text-[9px]" /> Colonne
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1.5" />

        <button
          type="button"
          onClick={() => updateSelectedCellStyle({ bold: !selectedCellStyle.bold })}
          disabled={isReadOnly}
          aria-label="Mettre en gras"
          title="Gras"
          className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.bold ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          <FaBold />
        </button>
        <button
          type="button"
          onClick={() => updateSelectedCellStyle({ italic: !selectedCellStyle.italic })}
          disabled={isReadOnly}
          aria-label="Mettre en italique"
          title="Italique"
          className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.italic ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          <FaItalic />
        </button>
        <button
          type="button"
          onClick={() => updateSelectedCellStyle({ strike: !selectedCellStyle.strike })}
          disabled={isReadOnly}
          aria-label="Barré"
          title="Barré"
          className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.strike ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-200'}`}
        >
          <FaStrikethrough />
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
            className={`p-1.5 rounded transition disabled:opacity-40 ${selectedCellStyle.align === alignment ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <Icon />
          </button>
        ))}
        <label className="flex items-center gap-1 px-1 text-[10px] text-slate-400" title="Couleur du texte">
          A
          <input
            type="color"
            value={selectedCellStyle.color || '#1f2937'}
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
            value={selectedCellStyle.bg || '#ffffff'}
            onChange={event => updateSelectedCellStyle({ bg: event.target.value })}
            disabled={isReadOnly}
            aria-label="Couleur de fond"
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0 disabled:opacity-40"
          />
        </label>

        <div className="h-4 w-px bg-slate-200 mx-1.5" />

        <select
          value={selectedCellStyle.fontSize || 11}
          onChange={event => updateSelectedCellStyle({ fontSize: Number(event.target.value) })}
          disabled={isReadOnly}
          aria-label="Taille de la police"
          title="Taille de la police"
          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
        >
          {[10, 11, 12, 14, 16, 18, 24, 36].map(size => <option key={size} value={size}>{size}</option>)}
        </select>

        <select
          value={selectedCellStyle.numberFormat || 'General'}
          onChange={event => updateSelectedCellStyle({ numberFormat: event.target.value })}
          disabled={isReadOnly}
          aria-label="Format numérique"
          title="Format numérique"
          className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
        >
          <option value="General">Automatique</option>
          <option value="0.00">Nombre (2 décimales)</option>
          <option value="0%">Pourcentage</option>
          <option value="$#,##0.00">Devise (USD)</option>
          <option value="yyyy-mm-dd">Date</option>
        </select>

        <div className="h-4 w-px bg-slate-200 mx-1.5" />

        <select
          value={zoomLevel}
          onChange={e => setZoomLevel(Number(e.target.value))}
          className="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
        >
          <option value={80}>80%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
        </select>
      </div>

      {/* ─── 3. FORMULA BAR ─── */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 flex items-center gap-2 font-mono text-xs shrink-0">
        <div className="w-14 py-1 px-2 bg-white border border-slate-200 rounded text-center text-emerald-700 font-bold shrink-0">
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
          className="flex-1 py-1 px-3 bg-white border border-slate-200 rounded text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* ─── 4. MAIN CONTENT AREA WITH SIDEBAR IF OPEN ─── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Grid Table */}
        <div ref={gridRef} className="flex-1 overflow-auto bg-white relative" style={{ zoom: `${zoomLevel}%` }} onPaste={handlePaste}>
          <table className="w-full border-collapse text-xs select-text">
            <thead>
              <tr className="sticky top-0 z-20 shadow bg-slate-50">
                <th className="w-12 h-7 min-w-12 bg-slate-100 border border-slate-200 text-slate-400 font-mono text-[10px] text-center sticky left-0 z-30">
                  #
                </th>
                {Array.from({ length: currentCols }).map((_, cIdx) => (
                  <th
                    key={cIdx}
                    className={`h-7 px-3 border border-slate-200 font-semibold text-slate-700 min-w-[110px] text-center bg-emerald-50 hover:bg-emerald-100 transition ${
                      selectedCell.col === cIdx ? 'bg-emerald-100/70 text-emerald-800 border-b-2 border-b-emerald-500' : ''
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
                    className={`hover:bg-slate-50/60 transition ${
                      isRowSelected ? 'bg-slate-50/80' : rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    {/* Row header 1, 2, 3... */}
                    <td className={`w-12 h-6 min-w-12 border border-slate-200 text-center font-mono text-[10px] sticky left-0 z-10 ${
                      isRowSelected ? 'bg-emerald-100/60 text-emerald-700 font-bold border-r-2 border-r-emerald-500' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {rIdx + 1}
                    </td>

                    {/* Cells */}
                    {Array.from({ length: currentCols }).map((_, cIdx) => {
                      const rawVal = row[cIdx] ?? '';
                      const isSelected = selectedCell.row === rIdx && selectedCell.col === cIdx;
                      const cellStyle = cellStyles[`${activeSheet}!${rIdx}_${cIdx}`] || {};
                      const displayVal = formatCellDisplay(evaluateFormula(rawVal, currentMatrix), cellStyle);
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
                          className={`px-2.5 py-1.5 border border-slate-200/80 truncate max-w-[250px] cursor-cell transition-all relative font-mono ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 bg-emerald-50 text-slate-900 font-medium z-10'
                              : isSearching
                              ? 'bg-amber-500/30 text-amber-200 font-bold'
                              : 'text-slate-700'
                          }`}
                          style={{
                            ...(cellStyle.bold ? { fontWeight: 700 } : {}),
                            ...(cellStyle.italic ? { fontStyle: 'italic' } : {}),
                            ...(cellStyle.strike ? { textDecoration: 'line-through' } : {}),
                            ...(cellStyle.fontSize ? { fontSize: `${cellStyle.fontSize}px` } : {}),
                            ...(cellStyle.align ? { textAlign: cellStyle.align } : {}),
                            ...(cellStyle.color ? { color: cellStyle.color } : {}),
                            ...(cellStyle.bg ? { backgroundColor: cellStyle.bg } : {}),
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
                              className="w-full bg-white text-slate-900 outline-none px-1 py-0.5 rounded"
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

        {sidePanel === 'history' && (
          <aside className="w-full max-w-sm border-l border-slate-200 bg-white flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  {historyPreview ? `Version ${historyPreview.version_number}` : 'Historique des versions'}
                </h2>
                <p className="text-[11px] text-slate-500">Versions automatiques et enregistrées</p>
              </div>
              <button
                type="button"
                onClick={() => historyPreview ? setHistoryPreview(null) : setSidePanel(null)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label={historyPreview ? 'Retour à l’historique' : 'Fermer l’historique'}
              >
                {historyPreview ? <FaArrowLeft /> : <FaTimes />}
              </button>
            </div>
            {historyError && <p role="alert" className="m-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{historyError}</p>}
            {historyLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-slate-500">
                <FaSpinner className="animate-spin" /> Chargement de l’historique…
              </div>
            ) : historyPreview ? (
              <div className="flex-1 overflow-auto p-4">
                <p className="mb-3 text-xs text-slate-600">
                  {historyPreview.user?.name || 'Utilisateur'} · {new Date(historyPreview.created_at).toLocaleString()}
                </p>
                {previewData?.sheets && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {(previewData.sheetNames || Object.keys(previewData.sheets)).map(name => (
                      <span key={name} className="rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-800">{name}</span>
                    ))}
                  </div>
                )}
                {previewData?.sheets ? (
                  <div className="overflow-auto rounded border border-slate-200">
                    <table className="min-w-full border-collapse text-[10px]">
                      <tbody>
                        {(previewData.sheets[previewData.sheetNames?.[0]] || []).slice(0, 30).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.slice(0, 8).map((value, colIndex) => (
                              <td key={colIndex} className="max-w-32 truncate border border-slate-200 px-2 py-1 text-slate-700">{String(value ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Aperçu indisponible pour cette ancienne version.</p>
                )}
                {canManageAccess && (
                  <button
                    type="button"
                    onClick={() => restoreVersion(historyPreview)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <FaUndo /> Restaurer cette version
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {historyVersions.length === 0 && !historyError ? (
                  <p className="p-6 text-center text-sm text-slate-500">Aucune version enregistrée pour le moment.</p>
                ) : historyVersions.map((version, index) => (
                  <div key={version.id} className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">
                          {version.label || `Version ${version.version_number}`}
                          {index === 0 && <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] text-emerald-700">Récente</span>}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">{version.user?.name || 'Utilisateur'} · {new Date(version.created_at).toLocaleString()}</p>
                        {version.summary && <p className="mt-1 text-[11px] text-slate-600">{version.summary}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => previewVersion(version.id)}
                        className="shrink-0 rounded px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Aperçu
                      </button>
                    </div>
                    {canManageAccess && (
                      <button
                        type="button"
                        onClick={() => restoreVersion(version)}
                        className="mt-2 text-[11px] font-medium text-slate-600 hover:text-emerald-700"
                      >
                        Restaurer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ─── 5. BOTTOM BAR (Tabs & Summary Statistics) ─── */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
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
                    ? 'bg-slate-100 text-emerald-700 border-emerald-500 shadow'
                    : 'bg-slate-50 text-slate-400 hover:text-slate-900 border-transparent'
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
                className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                title="Ajouter une nouvelle feuille"
              >
                <FaPlus className="text-xs" />
              </button>
              <button
                onClick={deleteActiveSheet}
                disabled={sheetNames.length <= 1}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-100 transition disabled:opacity-40"
                title="Supprimer la feuille active"
              >
                <FaTrash className="text-[10px]" />
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          <span>Valeurs : <strong className="text-slate-700">{stats.count}</strong></span>
          {stats.sum !== null && (
            <>
              <span className="border-l border-slate-200 pl-3">Somme : <strong className="text-emerald-700">{stats.sum}</strong></span>
              <span className="border-l border-slate-200 pl-3">Moyenne : <strong className="text-cyan-700">{stats.avg}</strong></span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
