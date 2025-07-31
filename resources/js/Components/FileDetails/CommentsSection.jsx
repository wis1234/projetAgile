import React, { useState, useEffect } from 'react';
import { FaUser, FaEllipsisV, FaPencilAlt, FaTrash, FaPaperPlane } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../Common/ConfirmationModal';

const Comment = ({ 
  comment, 
  onDelete, 
  onEdit, 
  currentUserId,
  editingId,
  editContent,
  onEditChange,
  onUpdate,
  onCancelEdit
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isCurrentUser = comment.user_id === currentUserId;

  // Close actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showActions && !event.target.closest('.comment-actions')) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  return (
    <div className="relative py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
            <FaUser className="h-5 w-5 text-gray-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {comment.user?.name || 'Utilisateur inconnu'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
            
            {isCurrentUser && !editingId && (
              <div className="relative comment-actions">
                <button 
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  aria-label="Actions"
                >
                  <FaEllipsisV className="h-4 w-4" />
                </button>
                
                <AnimatePresence>
                  {showActions && (
                    <motion.div 
                      className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-10 overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button
                        onClick={() => {
                          onEdit(comment);
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <FaPencilAlt className="h-3.5 w-3.5" />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <FaTrash className="h-3.5 w-3.5" />
                        <span>Supprimer</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          
          {editingId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onUpdate}
                  disabled={!editContent.trim()}
                  className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
              {comment.content}
            </p>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(comment.id);
          setShowDeleteModal(false);
        }}
        title="Supprimer le commentaire"
        message="Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible."
        confirmText="Supprimer"
      />
    </div>
  );
};

const CommentsSection = ({ fileId, currentUserId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/files/${fileId}/comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setError('Impossible de charger les commentaires');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [fileId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    setPosting(true);
    setError('');
    try {
      const response = await fetch(`/api/files/${fileId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ content: commentContent })
      });
      
      if (response.ok) {
        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setCommentContent('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erreur lors de l\'envoi du commentaire');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Erreur de connexion');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/files/${fileId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      });
      
      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleEditComment = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editContent.trim() || !editingId) return;
    
    try {
      const response = await fetch(`/api/files/${fileId}/comments/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ content: editContent })
      });
      
      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === updatedComment.id ? updatedComment : c));
        setEditingId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Commentaires
          {comments.length > 0 && (
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </h2>
      </div>
      
      <div className="p-6">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <FaUser className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ajouter un commentaire..."
                rows="3"
                disabled={posting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-red-500">{error}</span>
                <button
                  type="submit"
                  disabled={posting || !commentContent.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {posting ? 'Envoi en cours...' : 'Commenter'}
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {/* Comments List */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  onEdit={handleEditComment}
                  currentUserId={currentUserId}
                  editingId={editingId}
                  editContent={editContent}
                  onEditChange={setEditContent}
                  onUpdate={handleUpdateComment}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsSection;
