import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import api from '../utils/api';
import { DashboardSummary, Field } from '../types';
import { Ionicons } from '@expo/vector-icons';
import AddFieldModal from '../components/AddFieldModal';
import AddHarvestModal from '../components/AddHarvestModal';

const screenWidth = Dimensions.get('window').width;

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const response = await api.get('/api/dashboard/summary');
      setSummary(response.data);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const pieData = Object.entries(summary?.receitas_por_cultura || {}).map(
    ([cultura, valor], index) => ({
      name: cultura,
      value: valor,
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
      legendFontColor: '#fff',
      legendFontSize: 12,
    })
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Dashboard Financeiro</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
          <Ionicons name="arrow-up-circle" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={styles.summaryValue}>
            R$ {summary?.total_receitas.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="arrow-down-circle" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={styles.summaryValue}>
            R$ {summary?.total_despesas.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
          <Ionicons name="wallet" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Lucro</Text>
          <Text style={styles.summaryValue}>
            R$ {summary?.lucro.toFixed(2)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text style={styles.summaryLabel}>Dívidas</Text>
          <Text style={styles.summaryValue}>
            R$ {summary?.total_dividas_pendentes.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowFieldModal(true)}
        >
          <Ionicons name="grid" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>{'Adicionar Talhão'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowHarvestModal(true)}
        >
          <Ionicons name="trending-up" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>{'Registrar Safra'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Evolução Financeira</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            backgroundColor: '#1e293b',
            backgroundGradientFrom: '#1e293b',
            backgroundGradientTo: '#1e293b',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#10b981',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {pieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Receitas por Cultura</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 48}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}

      {summary?.dividas_pendentes && summary.dividas_pendentes.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Dívidas Pendentes</Text>
          {summary.dividas_pendentes.map((divida) => (
            <View key={divida.id} style={styles.debtItem}>
              <View style={styles.debtInfo}>
                <Text style={styles.debtCredor}>{divida.credor}</Text>
                <Text style={styles.debtCultura}>{divida.cultura}</Text>
              </View>
              <Text style={styles.debtValor}>R$ {divida.valor.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <AddFieldModal
        visible={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        onSuccess={() => {
          setShowFieldModal(false);
          loadData();
        }}
      />

      <AddHarvestModal
        visible={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
        onSuccess={() => {
          setShowHarvestModal(false);
          loadData();
        }}
      />
    </ScrollView>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1e293b',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  debtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  debtInfo: {
    flex: 1,
  },
  debtCredor: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  debtCultura: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  debtValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
});