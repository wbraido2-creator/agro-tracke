import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Dados mock para demonstração (sem API key)
const mockWeatherData = {
  location: 'São Paulo, BR',
  temperature: 25,
  condition: 'Parcialmente nublado',
  humidity: 65,
  windSpeed: 12,
  forecast: [
    { day: 'Segunda', temp: 26, condition: 'sunny', rain: 10 },
    { day: 'Terça', temp: 24, condition: 'cloudy', rain: 40 },
    { day: 'Quarta', temp: 23, condition: 'rainy', rain: 80 },
    { day: 'Quinta', temp: 25, condition: 'partly-sunny', rain: 20 },
    { day: 'Sexta', temp: 27, condition: 'sunny', rain: 5 },
  ],
};

export default function Clima() {
  const [weather, setWeather] = useState(mockWeatherData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [city, setCity] = useState('São Paulo');
  const [searchCity, setSearchCity] = useState('São Paulo');

  function getWeatherIcon(condition: string) {
    const icons: Record<string, string> = {
      sunny: 'sunny',
      cloudy: 'cloudy',
      rainy: 'rainy',
      'partly-sunny': 'partly-sunny',
    };
    return icons[condition] || 'cloud';
  }

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      // Simular atualização
      setRefreshing(false);
    }, 1000);
  }

  function handleSearch() {
    if (!searchCity.trim()) {
      return;
    }
    
    // Simular busca com dados mock personalizados
    const newWeather = {
      location: `${searchCity}, BR`,
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      condition: ['Ensolarado', 'Parcialmente nublado', 'Nublado', 'Chuvoso'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      forecast: mockWeatherData.forecast.map(day => ({
        ...day,
        temp: Math.floor(Math.random() * 10) + 20,
        rain: Math.floor(Math.random() * 100),
      })),
    };
    
    setWeather(newWeather);
    setCity(searchCity);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.header}>
        <Ionicons name="cloud" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Previsão do Tempo</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Digite a cidade..."
            placeholderTextColor="#64748b"
            value={searchCity}
            onChangeText={setSearchCity}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.searchButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.currentWeather}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={20} color="#10b981" />
          <Text style={styles.location}>{weather.location}</Text>
        </View>
        
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{weather.temperature}°</Text>
          <Ionicons name="partly-sunny" size={80} color="#f59e0b" />
        </View>
        
        <Text style={styles.condition}>{weather.condition}</Text>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="water" size={20} color="#3b82f6" />
            <Text style={styles.detailText}>{weather.humidity}%</Text>
            <Text style={styles.detailLabel}>Umidade</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={20} color="#10b981" />
            <Text style={styles.detailText}>{weather.windSpeed} km/h</Text>
            <Text style={styles.detailLabel}>Vento</Text>
          </View>
        </View>
      </View>

      <View style={styles.forecastContainer}>
        <Text style={styles.forecastTitle}>Próximos 5 dias</Text>
        
        {weather.forecast.map((day, index) => (
          <View key={index} style={styles.forecastDay}>
            <Text style={styles.forecastDayName}>{day.day}</Text>
            <View style={styles.forecastDetails}>
              <Ionicons name={getWeatherIcon(day.condition)} size={24} color="#f59e0b" />
              <Text style={styles.forecastTemp}>{day.temp}°</Text>
              <View style={styles.rainBadge}>
                <Ionicons name="rainy" size={14} color="#3b82f6" />
                <Text style={styles.rainText}>{day.rain}%</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={24} color="#3b82f6" />
        <Text style={styles.infoText}>
          Dados de previsão do tempo em demonstração. Para dados reais, configure uma chave da API AccuWeather.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  currentWeather: {
    backgroundColor: '#1e293b',
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  location: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
  },
  temperature: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
  },
  condition: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 32,
    width: '100%',
    justifyContent: 'center',
  },
  detailItem: {
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  forecastContainer: {
    backgroundColor: '#1e293b',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 24,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  forecastDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  forecastDayName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  forecastDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  forecastTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    width: 40,
  },
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    minWidth: 60,
  },
  rainText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    lineHeight: 20,
  },
});
