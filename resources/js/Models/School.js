/**
 * Modèle School pour le frontend
 * Miroite le modèle Laravel School.php
 */

// Types d'écoles
const TYPE_PRIMARY = 'primary';
const TYPE_MIDDLE = 'middle';
const TYPE_HIGH = 'high';
const TYPE_UNIVERSITY = 'university';
const TYPE_OTHER = 'other';

// Statuts des écoles
const STATUS_ACTIVE = 'active';
const STATUS_INACTIVE = 'inactive';
const STATUS_PENDING = 'pending';

/**
 * Retourne les options de type d'école formatées pour les sélecteurs
 * @returns {Object} Objet avec les options de type
 */
const getTypeOptions = () => ({
  [TYPE_PRIMARY]: 'École primaire',
  [TYPE_MIDDLE]: 'Collège',
  [TYPE_HIGH]: 'Lycée',
  [TYPE_UNIVERSITY]: 'Université',
  [TYPE_OTHER]: 'Autre',
});

/**
 * Retourne les options de statut formatées pour les sélecteurs
 * @returns {Object} Objet avec les options de statut
 */
const getStatusOptions = () => ({
  [STATUS_ACTIVE]: 'Actif',
  [STATUS_INACTIVE]: 'Inactif',
  [STATUS_PENDING]: 'En attente',
});

/**
 * Vérifie si un type d'école est valide
 * @param {string} type Type à vérifier
 * @returns {boolean} Vrai si le type est valide
 */
const isValidType = (type) => {
  const types = Object.keys(getTypeOptions());
  return types.includes(type);
};

/**
 * Vérifie si un statut est valide
 * @param {string} status Statut à vérifier
 * @returns {boolean} Vrai si le statut est valide
 */
const isValidStatus = (status) => {
  const statuses = Object.keys(getStatusOptions());
  return statuses.includes(status);
};

export default {
  // Constantes
  TYPE_PRIMARY,
  TYPE_MIDDLE,
  TYPE_HIGH,
  TYPE_UNIVERSITY,
  TYPE_OTHER,
  STATUS_ACTIVE,
  STATUS_INACTIVE,
  STATUS_PENDING,
  
  // Méthodes
  getTypeOptions,
  getStatusOptions,
  isValidType,
  isValidStatus,
};
