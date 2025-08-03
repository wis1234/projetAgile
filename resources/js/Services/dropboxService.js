import { Dropbox } from 'dropbox';
import axios from 'axios';

class DropboxService {
  constructor() {
    // Utilisation de import.meta.env pour Vite
    this.appKey = import.meta.env.VITE_DROPBOX_APP_KEY || '';
    this.appSecret = import.meta.env.VITE_DROPBOX_APP_SECRET || '';
    this.accessToken = import.meta.env.VITE_DROPBOX_ACCESS_TOKEN || '';
    this.refreshToken = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN || '';
    
    this.isRefreshing = false;
    this.refreshSubscribers = [];
    this.isBrowser = typeof window !== 'undefined';
    
    // Initialisation avec le token du localStorage si disponible
    if (this.isBrowser) {
      const storedToken = localStorage.getItem('dropbox_access_token');
      const storedRefreshToken = localStorage.getItem('dropbox_refresh_token');
      
      if (storedToken) {
        this.accessToken = storedToken;
      }
      if (storedRefreshToken) {
        this.refreshToken = storedRefreshToken;
      }
    }
    
    this.initializeDropbox();
  }
  
  initializeDropbox() {
    if (!this.accessToken) {
      console.error('Aucun token d\'accès Dropbox trouvé.');
      return;
    }
    
    this.dbx = new Dropbox({
      accessToken: this.accessToken,
      fetch: this.fetchWithTokenRefresh.bind(this)
    });
  }

  async refreshAccessToken() {
    if (this.isRefreshing) {
      return new Promise(resolve => {
        this.onRefreshed(() => resolve());
      });
    }

    this.isRefreshing = true;
    
    try {
      console.log('Tentative de rafraîchissement du token...');
      const response = await axios.post(
        'https://api.dropbox.com/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.appKey,
          client_secret: this.appSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      
      // Mettre à jour l'instance Dropbox avec le nouveau token
      this.initializeDropbox();
      
      // Stocker les tokens
      if (this.isBrowser) {
        localStorage.setItem('dropbox_access_token', this.accessToken);
        if (response.data.refresh_token) {
          this.refreshToken = response.data.refresh_token;
          localStorage.setItem('dropbox_refresh_token', this.refreshToken);
        }
      }
      
      console.log('Token rafraîchi avec succès');
      
      // Notifier tous les abonnés
      this.refreshSubscribers.forEach(callback => callback(this.accessToken));
      this.refreshSubscribers = [];
      
      return this.accessToken;
      
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token Dropbox:', error);
      if (this.isBrowser) {
        localStorage.removeItem('dropbox_access_token');
        localStorage.removeItem('dropbox_refresh_token');
      }
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async fetchWithTokenRefresh(input, init = {}) {
    // Vérifier si on a un token
    if (!this.accessToken) {
      throw new Error('Aucun token d\'accès Dropbox disponible');
    }

    // Préparer les en-têtes
    const headers = {
      ...init.headers,
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };

    try {
      // Première tentative
      let response = await fetch(input, {
        ...init,
        headers
      });

      // Si le token a expiré, on le rafraîchit
      if (response.status === 401) {
        console.log('Token expiré, tentative de rafraîchissement...');
        
        try {
          // Rafraîchir le token
          await this.refreshAccessToken();
          
          // Mettre à jour l'en-tête d'autorisation
          headers.Authorization = `Bearer ${this.accessToken}`;
          
          // Réessayer la requête
          response = await fetch(input, {
            ...init,
            headers
          });
          
          // Si toujours une erreur après rafraîchissement
          if (response.status === 401) {
            throw new Error('Échec de l\'authentification après rafraîchissement du token');
          }
          
          return response;
          
        } catch (refreshError) {
          console.error('Échec du rafraîchissement du token:', refreshError);
          throw refreshError;
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('Erreur lors de la requête Dropbox:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour s'abonner au rafraîchissement du token
  onRefreshed(callback) {
    if (this.isRefreshing) {
      this.refreshSubscribers.push(callback);
    } else {
      callback(this.accessToken);
    }
  }

  // Méthodes de l'API Dropbox
  async listFolders(path = '') {
    try {
      const response = await this.dbx.filesListFolder({ path });
      return response.result.entries;
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers:', error);
      throw error;
    }
  }

  async getFileMetadata(path) {
    try {
      const response = await this.dbx.filesGetMetadata({
        path,
        include_media_info: true,
        include_has_explicit_shared_members: true
      });
      return response.result;
    } catch (error) {
      console.error('Erreur lors de la récupération des métadonnées:', error);
      throw error;
    }
  }
}

export default new DropboxService();
