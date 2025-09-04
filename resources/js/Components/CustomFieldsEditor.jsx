import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripVertical, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const fieldTypes = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'radio', label: 'Bouton radio' },
  { value: 'file', label: 'Fichier' },
];

export default function CustomFieldsEditor({ fields = [], onChange }) {
  const [expandedField, setExpandedField] = useState(null);
  const [localFields, setLocalFields] = useState(fields);

  // Sync local state with parent
  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(localFields);
    }
  }, [localFields, onChange]);

  const addField = () => {
    const newField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      field_name: `champ_${Date.now()}`,
      field_label: 'Nouveau champ',
      field_type: 'text',
      is_required: false,
      options: [],
      order: localFields.length
    };
    
    setLocalFields(prevFields => [...prevFields, newField]);
    setExpandedField(newField.id);
    
    // Forcer un léger délai avant de donner le focus au nouveau champ
    setTimeout(() => {
      const input = document.querySelector(`input[data-field-id="${newField.id}"]`);
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  };

  const removeField = (id) => {
    setLocalFields(localFields.filter(field => field.id !== id));
    if (expandedField === id) {
      setExpandedField(null);
    }
  };

  const updateField = (id, updates) => {
    // Utiliser la forme fonctionnelle pour s'assurer d'avoir le dernier état
    setLocalFields(prevFields => 
      prevFields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const toggleFieldExpand = (id) => {
    setExpandedField(expandedField === id ? null : id);
  };

  const addOption = (fieldId) => {
    const field = localFields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newOptions = [...(field.options || []), ''];
    updateField(fieldId, { options: newOptions });
    
    // Focus sur le nouvel input après le rendu
    setTimeout(() => {
      const inputs = document.querySelectorAll(`[data-field-id="${fieldId}"] input[type="text"]`);
      if (inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1];
        lastInput.focus();
      }
    }, 10);
  };

  const updateOption = (fieldId, optionIndex, value) => {
    // Utiliser la forme fonctionnelle pour s'assurer d'avoir le dernier état
    setLocalFields(prevFields => {
      return prevFields.map(field => {
        if (field.id !== fieldId) return field;
        
        const newOptions = [...(field.options || [])];
        newOptions[optionIndex] = value;
        
        return {
          ...field,
          options: newOptions
        };
      });
    });
  };

  const removeOption = (fieldId, optionIndex, e) => {
    // Empêcher la propagation pour éviter de déclencher d'autres événements
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setLocalFields(prevFields => {
      return prevFields.map(field => {
        if (field.id !== fieldId) return field;
        
        const newOptions = (field.options || []).filter((_, i) => i !== optionIndex);
        
        return {
          ...field,
          options: newOptions
        };
      });
    });
  };

  const onDragEnd = (result) => {
    // Ne rien faire si la destination est la même que la source
    if (!result.destination || result.source.index === result.destination.index) return;
    
    // Créer une copie du tableau des champs
    const newFields = Array.from(localFields);
    // Supprimer l'élément déplacé de son ancienne position
    const [movedField] = newFields.splice(result.source.index, 1);
    // Insérer l'élément à sa nouvelle position
    newFields.splice(result.destination.index, 0, movedField);
    
    // Mettre à jour l'ordre des champs
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    
    setLocalFields(reorderedFields);
  };

  const renderFieldOptions = (field) => {
    if (!['select', 'checkbox', 'radio'].includes(field.field_type)) return null;
    
    return (
      <div className="mt-4 pl-6 border-l-2 border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Options
        </label>
        <div className="space-y-2">
          {(field.options || []).map((option, i) => (
            <div key={`${field.id}-${i}`} className="flex items-center group">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(field.id, i, e.target.value)}
                onFocus={(e) => e.target.select()}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder={`Option ${i + 1}`}
                data-field-id={field.id}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={(e) => removeOption(field.id, i, e)}
                className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                title="Supprimer cette option"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              addOption(field.id);
            }}
            className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          >
            <FaPlus className="mr-1 h-3 w-3" /> Ajouter une option
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Champs personnalisés</h3>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaPlus className="mr-1.5 h-3.5 w-3.5" />
          Ajouter un champ
        </button>
      </div>

      {localFields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500">Aucun champ personnalisé n'a été ajouté.</p>
          <button
            type="button"
            onClick={addField}
            className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-1.5 h-4 w-4" />
            Ajouter votre premier champ
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {localFields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden"
                      >
                        <div 
                          className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between"
                          onClick={() => toggleFieldExpand(field.id)}
                        >
                          <div className="flex items-center">
                            <div 
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-500 mr-2 cursor-grab active:cursor-grabbing"
                              onMouseDown={(e) => {
                                // Empêcher la propagation pour éviter les interférences
                                e.stopPropagation();
                              }}
                            >
                              <FaGripVertical className="h-4 w-4" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-700">
                              {field.field_label || 'Nouveau champ'}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => toggleFieldExpand(field.id)}
                              className="text-gray-400 hover:text-gray-500"
                            >
                              {expandedField === field.id ? (
                                <FaChevronDown className="h-4 w-4" />
                              ) : (
                                <FaChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {expandedField === field.id && (
                          <div className="p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Libellé du champ *
                              </label>
                              <input
                                type="text"
                                value={field.field_label}
                                onChange={(e) => updateField(field.id, { field_label: e.target.value })}
                                onFocus={(e) => e.target.select()}
                                data-field-id={field.id}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Libellé du champ"
                                autoComplete="off"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom technique *
                              </label>
                              <input
                                type="text"
                                value={field.field_name}
                                onChange={(e) => {
                                  // Nettoyer le nom du champ pour qu'il soit valide comme identifiant
                                  const cleaned = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, '_')
                                    .replace(/^[^a-z]/, 'a')
                                    .replace(/_+/g, '_');
                                  updateField(field.id, { field_name: cleaned });
                                }}
                                onFocus={(e) => e.target.select()}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-sm"
                                placeholder="nom_du_champ"
                                autoComplete="off"
                                spellCheck="false"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type de champ *
                              </label>
                              <select
                                value={field.field_type}
                                onChange={(e) => updateField(field.id, { 
                                  field_type: e.target.value,
                                  options: ['select', 'checkbox', 'radio'].includes(e.target.value) 
                                    ? field.options || [''] 
                                    : []
                                })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              >
                                {fieldTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center">
                              <input
                                id={`required-${field.id}`}
                                type="checkbox"
                                checked={field.is_required}
                                onChange={(e) => updateField(field.id, { is_required: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={`required-${field.id}`} className="ml-2 block text-sm text-gray-700">
                                Champ obligatoire
                              </label>
                            </div>
                            
                            {renderFieldOptions(field)}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
