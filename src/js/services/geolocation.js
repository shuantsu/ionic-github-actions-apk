// Geolocation Service - Gerencia localização

import { Geolocation } from '@capacitor/geolocation';

class GeolocationService {
  constructor() {
    this.isAvailable = false;
    this.lastLocation = null;
    this.checkAvailability();
  }

  // Verificar se geolocalização está disponível
  async checkAvailability() {
    try {
      // Verificar no browser
      if ('geolocation' in navigator) {
        this.isAvailable = true;
        return true;
      }
      
      // Verificar no Capacitor (mobile)
      const result = await Geolocation.checkPermissions();
      this.isAvailable = result.location === 'granted' || result.location === 'prompt';
      return this.isAvailable;
    } catch (error) {
      console.log('Geolocalização não disponível:', error);
      this.isAvailable = false;
      return false;
    }
  }

  // Obter localização atual
  async getCurrentLocation() {
    if (!this.isAvailable) {
      return this.getMockLocation();
    }

    try {
      // Tentar Capacitor primeiro (mobile)
      if (window.Capacitor) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });

        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          source: 'capacitor'
        };

        this.lastLocation = location;
        return location;
      }
      
      // Fallback para browser
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              source: 'browser'
            };

            this.lastLocation = location;
            resolve(location);
          },
          (error) => {
            console.warn('Erro ao obter localização:', error);
            resolve(this.getMockLocation());
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

    } catch (error) {
      console.warn('Erro ao obter localização:', error);
      return this.getMockLocation();
    }
  }

  // Mock location para desenvolvimento/testes
  getMockLocation() {
    const mockLocations = [
      { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo' },
      { latitude: -22.9068, longitude: -43.1729, city: 'Rio de Janeiro' },
      { latitude: -15.8267, longitude: -47.9218, city: 'Brasília' },
      { latitude: -19.9167, longitude: -43.9345, city: 'Belo Horizonte' },
      { latitude: -30.0346, longitude: -51.2177, city: 'Porto Alegre' }
    ];

    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    
    return {
      ...randomLocation,
      accuracy: 10,
      timestamp: Date.now(),
      source: 'mock',
      note: 'Localização simulada para desenvolvimento'
    };
  }

  // Solicitar permissões (mobile)
  async requestPermissions() {
    try {
      if (window.Capacitor) {
        const result = await Geolocation.requestPermissions();
        this.isAvailable = result.location === 'granted';
        return this.isAvailable;
      }
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }

  // Formatar localização para exibição
  formatLocation(location) {
    if (!location) return 'Localização desconhecida';

    const { latitude, longitude, city, source } = location;
    
    if (city) {
      return `📍 ${city}`;
    }

    return `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  // Obter endereço reverso (mock)
  async reverseGeocode(location) {
    // Em um app real, você usaria uma API como Google Maps ou OpenStreetMap
    const mockAddresses = {
      '-23.5505': 'São Paulo, SP',
      '-22.9068': 'Rio de Janeiro, RJ', 
      '-15.8267': 'Brasília, DF',
      '-19.9167': 'Belo Horizonte, MG',
      '-30.0346': 'Porto Alegre, RS'
    };

    const latKey = location.latitude.toFixed(4);
    return mockAddresses[latKey] || 'Localização desconhecida';
  }

  // Calcular distância entre dois pontos (em km)
  calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2) return 0;

    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) * 
      Math.cos(this.toRadians(loc2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Obter última localização cacheada
  getLastLocation() {
    return this.lastLocation;
  }
}

// Exportar singleton
export const geolocation = new GeolocationService();
