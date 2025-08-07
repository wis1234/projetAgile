import { Extension } from '@tiptap/core';

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

  onUpdate() {
    const { state, storage } = this;
    if (!storage.currentUser) return;

    // Get the current selection
    const { from, to } = state.selection;
    
    // Get the text that was just inserted
    const text = state.doc.textBetween(from, to, '\n');
    
    if (text.trim()) {
      const now = new Date();
      const changeInfo = {
        user: storage.currentUser,
        timestamp: now.toISOString(),
        from,
        to,
      };

      // Store the change information
      if (!storage.users.has(storage.currentUser.id)) {
        const color = this.options.colors[storage.users.size % this.options.colors.length];
        storage.users.set(storage.currentUser.id, { ...storage.currentUser, color });
      }

      // Add a mark to the changed text
      const tr = state.tr.addMark(
        from,
        to,
        state.schema.marks.highlight.create({
          class: storage.users.get(storage.currentUser.id).color,
          'data-user-id': storage.currentUser.id,
          'data-timestamp': now.toISOString(),
        })
      );

      // Add a small indicator at the end of the change
      const changeNode = state.schema.nodes.paragraph.create(
        {},
        state.schema.text(` [${storage.currentUser.name}, ${now.toLocaleTimeString()}]`)
      );
      
      tr.insert(to, [changeNode]);
      this.editor.view.dispatch(tr);
    }
  },

  onCreate() {
    // Initialize with the current user
    if (this.options.user) {
      this.storage.currentUser = this.options.user;
      const color = this.options.colors[this.storage.users.size % this.options.colors.length];
      this.storage.users.set(this.options.user.id, { ...this.options.user, color });
    }
  },
});

export default TrackChanges;
