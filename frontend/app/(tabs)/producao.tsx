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
import { Field, Harvest } from '../types';
import AddFieldModal from '../components/AddFieldModal';
import AddHarvestModal from '../components/AddHarvestModal';
import { format } from 'date-fns';

type Tab = 'talhoes' | 'safras';

export default function Producao() {
  const [activeTab, setActiveTab] = useState<Tab>('talhoes');
  const [fields, setFields] = useState<Field[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      if (activeTab === 'talhoes') {
        const response = await api.get('/api/fields');
        setFields(response.data);
      } else {
        const response = await api.get('/api/harvests');
        setHarvests(response.data);
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

  async function handleDeleteField(id: string) {
    try {
      await api.delete(`/api/fields/${id}`);
      Alert.alert('Sucesso', 'Talhão removido com sucesso!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover o talhão');
    }
  }

  async function handleDeleteHarvest(id: string) {
    try {
      await api.delete(`/api/harvests/${id}`);
      Alert.alert('Sucesso', 'Safra removida com sucesso!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível remover a safra');
    }
  }

  function confirmDelete(id: string, type: 'field' | 'harvest') {
    Alert.alert(
      'Confirmar',
      `Deseja realmente remover este ${type === 'field' ? 'talhão' : 'safra'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => type === 'field' ? handleDeleteField(id) : handleDeleteHarvest(id),
        },
      ]
    );
  }

  function renderField({ item }: { item: Field }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="grid" size={24} color="#10b981" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.nome}</Text>
            <Text style={styles.cardSubtitle}>
              {item.area_ha} hectares {'\u2022'} {item.cultura}
            </Text>
            {item.localizacao && (
              <Text style={styles.cardDescription}>{item.localizacao}</Text>
            )}
            
            {/* Mostrar produtividade média se houver safras */}
            {item.produtividade_media && item.produtividade_media > 0 && (
              <View style={styles.productivityContainer}>
                <View style={styles.productivityBadge}>
                  <Ionicons name="stats-chart" size={16} color="#10b981" />
                  <Text style={styles.productivityText}>
                    {item.produtividade_media} sacas/ha
                  </Text>
                </View>
                <Text style={styles.productivityInfo}>
                  {item.total_safras} {item.total_safras === 1 ? 'safra' : 'safras'} {'\u2022'} {item.total_sacas} sacas
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => confirmDelete(item.id, 'field')}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderHarvest({ item }: { item: Harvest }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="trending-up" size={24} color="#10b981" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.field_name}</Text>
            <Text style={styles.cardSubtitle}>
              {item.cultura} - {item.quantidade_sacas} sacas
            </Text>
            <View style={styles.productivityBadge}>
              <Ionicons name="stats-chart" size={14} color="#10b981" />
              <Text style={styles.productivityText}>
                {item.produtividade} sacas/ha
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => confirmDelete(item.id, 'harvest')}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            Colheita: {format(new Date(item.data_colheita), 'dd/MM/yyyy')}
          </Text>
          {item.observacoes && (
            <Text style={styles.cardObservation}>{item.observacoes}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Produção</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'talhoes' && styles.tabActive]}
          onPress={() => setActiveTab('talhoes')}
        >
          <Text style={[styles.tabText, activeTab === 'talhoes' && styles.tabTextActive]}>
            Talhões
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'safras' && styles.tabActive]}
          onPress={() => setActiveTab('safras')}
        >
          <Text style={[styles.tabText, activeTab === 'safras' && styles.tabTextActive]}>
            Safras
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'talhoes' ? fields : harvests}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'talhoes' ? renderField : renderHarvest}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>
              {activeTab === 'talhoes' 
                ? 'Nenhum talhão cadastrado'
                : 'Nenhuma safra registrada'}
            </Text>
            <Text style={styles.emptySubtext}>
              Toque no botão + para adicionar
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (activeTab === 'talhoes') setShowFieldModal(true);
          else setShowHarvestModal(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <AddFieldModal
        visible={showFieldModal}
        onClose={() => setShowFieldModal(false)}
        onSuccess={loadData}
      />
      <AddHarvestModal
        visible={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
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
  productivityContainer: {
    marginTop: 8,
    gap: 4,
  },
  productivityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  productivityText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  productivityInfo: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cardDate: {
    fontSize: 12,
    color: '#64748b',
  },
  cardObservation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
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