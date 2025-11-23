import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Producao() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Produção</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={64} color="#64748b" />
        <Text style={styles.text}>Funcionalidade em desenvolvimento</Text>
        <Text style={styles.subtext}>Tanhões e Safras em breve!</Text>
      </View>
    </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
});