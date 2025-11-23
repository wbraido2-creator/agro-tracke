import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import api from '../utils/api';
import { Quotation } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function Cotacoes() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuotations();
  }, []);

  async function loadQuotations() {
    try {
      const response = await api.get('/api/quotations/b3');
      setQuotations(response.data);
    } catch (error) {
      console.log('Error loading quotations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadQuotations();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Cotações B3</Text>
      </View>

      <FlatList
        data={quotations}
        keyExtractor={(item) => item.produto}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
          />
        }
        renderItem={({ item }) => {
          const isDolar = item.produto.includes('Dólar');
          return (
            <View style={[
              styles.quotationCard,
              isDolar && styles.quotationCardDolar
            ]}>
              <View style={styles.quotationHeader}>
                <View style={styles.produtoContainer}>
                  {isDolar && (
                    <Ionicons name="cash" size={20} color="#f59e0b" style={styles.produtoIcon} />
                  )}
                  <Text style={[styles.produto, isDolar && styles.produtoDolar]}>
                    {item.produto}
                  </Text>
                </View>
                <View
                  style={[
                    styles.variationBadge,
                    {
                      backgroundColor:
                        item.variacao >= 0
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(239, 68, 68, 0.2)',
                    },
                  ]}
                >
                  <Ionicons
                    name={item.variacao >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={item.variacao >= 0 ? '#10b981' : '#ef4444'}
                  />
                  <Text
                    style={[
                      styles.variacao,
                      { color: item.variacao >= 0 ? '#10b981' : '#ef4444' },
                    ]}
                  >
                    {item.variacao.toFixed(2)}%
                  </Text>
                </View>
              </View>
              <View style={styles.quotationBody}>
                <Text style={[styles.preco, isDolar && styles.precoDolar]}>
                  R$ {isDolar ? item.preco.toFixed(4) : item.preco.toFixed(2)}
                </Text>
                <Text style={styles.unidade}>{item.unidade}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
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
  list: {
    padding: 12,
  },
  quotationCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quotationCardDolar: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 2,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  produtoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  produtoIcon: {
    marginRight: 4,
  },
  produto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  produtoDolar: {
    color: '#f59e0b',
  },
  variationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  variacao: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quotationBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preco: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
  },
  precoDolar: {
    color: '#f59e0b',
  },
  unidade: {
    fontSize: 14,
    color: '#64748b',
  },
});