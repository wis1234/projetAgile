import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Styles pour les liens et mentions
document.head.insertAdjacentHTML('beforeend', `
  <style>
    /* Style des liens dans l'éditeur */
    .ProseMirror a {
      color: #3b82f6;
      text-decoration: none;
      border-bottom: 1px solid #93c5fd;
      transition: all 0.2s ease;
    }
    
    .ProseMirror a:hover, .ProseMirror a:focus {
      color: #1d4ed8;
      border-bottom-color: #3b82f6;
      background-color: #eff6ff;
      border-radius: 3px;
      outline: none;
      box-shadow: 0 0 0 2px #bfdbfe;
    }
    
    /* Style des mentions d'auteur */
    .mention {
      color: #8b5cf6;
      background-color: #f5f3ff;
      padding: 0.1em 0.3em;
      border-radius: 3px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .mention:hover {
      background-color: #ede9fe;
      box-shadow: 0 0 0 2px #ddd6fe;
    }
  </style>
`);

export const TrackChanges = Extension.create({
  name: 'trackChanges',

  addOptions() {
    return {
      user: null,
      colors: [
        'bg-blue-100',
        'bg-green-100',
        'bg-yellow-100',
        'bg-pink-100',
        'bg-purple-100',
      ],
    };
  },

  addStorage() {
    return {
      users: new Map(),
      currentUser: null,
    };
  },

  onUpdate({ transaction }) {
    const { state, storage } = this;
    console.log('TrackChanges - onUpdate triggered');
    console.log('Current user:', storage.currentUser);
    
    if (!storage.currentUser) {
      console.error('No current user set in TrackChanges');
      return;
    }

    // Vérifier s'il y a eu une insertion de texte
    if (!transaction.docChanged) {
      console.log('No document changes detected');
      return;
    }
    
    // Obtenir toutes les étapes de la transaction
    transaction.steps.forEach((step, index) => {
      if (step.slice) {
        // Vérifier si c'est une insertion de texte
        if (step.slice.content && step.slice.content.size > 0) {
          const from = step.from;
          const to = step.to;
          const text = state.doc.textBetween(from, to, '\n');
          
          if (text.trim()) {
            const now = new Date();
            
            console.log('TrackChanges - Change detected:', {
              text,
              from,
              to,
              user: storage.currentUser,
              timestamp: now.toISOString()
            });

            // Store the change information
            if (!storage.users.has(storage.currentUser.id)) {
              const color = this.options.colors[storage.users.size % this.options.colors.length];
              storage.users.set(storage.currentUser.id, { ...storage.currentUser, color });
            }

            // Add a mark to the changed text
            const userColor = storage.users.get(storage.currentUser.id).color;
            const markAttrs = {
              class: userColor,
              'data-user-id': storage.currentUser.id,
              'data-timestamp': now.toISOString(),
            };
            
            console.log('TrackChanges - Creating highlight mark with attributes:', markAttrs);
            
            const highlightMark = state.schema.marks.highlight.create(markAttrs);
            console.log('TrackChanges - Created highlight mark:', highlightMark);
            
            const tr = state.tr.addMark(from, to, highlightMark);
            console.log('TrackChanges - Transaction created:', tr);

            // Add a small indicator at the end of the change
            const changeNode = state.schema.nodes.paragraph.create(
              {},
              state.schema.text(` [${storage.currentUser.name}, ${now.toLocaleTimeString()}]`)
            );
            
            tr.insert(to, [changeNode]);
            this.editor.view.dispatch(tr);
          }
        }
      }
    });
  },

  onCreate() {
    // Initialize with the current user
    if (this.options.user) {
      this.storage.currentUser = this.options.user;
      const color = this.options.colors[this.storage.users.size % this.options.colors.length];
      this.storage.users.set(this.options.user.id, { ...this.options.user, color });
      console.log('TrackChanges - Initialized with user:', this.options.user);
    } else {
      console.error('TrackChanges - No user provided in options');
    }
  },
});

export default TrackChanges;
