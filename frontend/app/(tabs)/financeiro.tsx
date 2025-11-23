import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { Expense, Revenue, Debt } from '../types';
import AddExpenseModal from '../components/AddExpenseModal';
import AddRevenueModal from '../components/AddRevenueModal';
import AddDebtModal from '../components/AddDebtModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'despesas' | 'receitas' | 'dividas';

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<Tab>('despesas');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      if (activeTab === 'despesas') {
        const response = await api.get('/api/expenses');
        setExpenses(response.data);
      } else if (activeTab === 'receitas') {
        const response = await api.get('/api/revenues');
        setRevenues(response.data);
      } else {
        const response = await api.get('/api/debts');
        setDebts(response.data);
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  async function handleDelete(id: string, type: 'expense' | 'revenue' | 'debt') {
    const endpoints = {
      expense: `/api/expenses/${id}`,
      revenue: `/api/revenues/${id}`,
      debt: `/api/debts/${id}`,
    };

    try {
      await api.delete(endpoints[type]);
      Alert.alert('Sucesso', 'Item removido com sucesso!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o item');
    }
  }

  function confirmDelete(id: string, type: 'expense' | 'revenue' | 'debt') {
    Alert.alert(
      'Confirmar',
      'Deseja realmente remover este item?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => handleDelete(id, type) },
      ]
    );
  }

  function renderExpense({ item }: { item: Expense }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="arrow-down-circle" size={24} color="#ef4444" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.categoria}</Text>
            <Text style={styles.cardSubtitle}>{item.cultura} - {item.tipo}</Text>
            {item.descricao && (
              <Text style={styles.cardDescription}>{item.descricao}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => confirmDelete(item.id, 'expense')}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardValue}>R$ {item.valor.toFixed(2)}</Text>
          <Text style={styles.cardDate}>
            {format(new Date(item.data), "dd/MM/yyyy")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cash" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Financeiro</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'despesas' && styles.tabActive]}
          onPress={() => setActiveTab('despesas')}
        >
          <Text style={[styles.tabText, activeTab === 'despesas' && styles.tabTextActive]}>
            Despesas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receitas' && styles.tabActive]}
          onPress={() => setActiveTab('receitas')}
        >
          <Text style={[styles.tabText, activeTab === 'receitas' && styles.tabTextActive]}>
            Receitas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dividas' && styles.tabActive]}
          onPress={() => setActiveTab('dividas')}
        >
          <Text style={[styles.tabText, activeTab === 'dividas' && styles.tabTextActive]}>
            Dívidas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'despesas' ? expenses : activeTab === 'receitas' ? revenues : debts}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'despesas') setShowExpenseModal(true);
          else if (activeTab === 'receitas') setShowRevenueModal(true);
          else setShowDebtModal(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={loadData}
      />
      <AddRevenueModal
        visible={showRevenueModal}
        onClose={() => setShowRevenueModal(false)}
        onSuccess={loadData}
      />
      <AddDebtModal
        visible={showDebtModal}
        onClose={() => setShowDebtModal(false)}
        onSuccess={loadData}
      />
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIconContainer: {
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});