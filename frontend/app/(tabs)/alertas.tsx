import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { Debt } from '../types';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Alertas() {
  const [debtAlerts, setDebtAlerts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const response = await api.get('/api/debts');
      const debts = response.data;
      
      // Filtrar dívidas pendentes que vencem em até 30 dias
      const today = new Date();
      const alerts = debts.filter((debt: Debt) => {
        if (debt.status !== 'pendente') return false;
        const vencimento = new Date(debt.vencimento);
        const daysUntil = differenceInDays(vencimento, today);
        return daysUntil <= 30 && daysUntil >= 0;
      }).sort((a: Debt, b: Debt) => 
        new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
      );
      
      setDebtAlerts(alerts);
    } catch (error) {
      console.log('Error loading alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadAlerts();
  }

  function getAlertColor(daysUntil: number) {
    if (daysUntil <= 5) return '#ef4444'; // Vermelho - urgente
    if (daysUntil <= 15) return '#f59e0b'; // Laranja - atenção
    return '#3b82f6'; // Azul - normal
  }

  function getAlertIcon(daysUntil: number) {
    if (daysUntil <= 5) return 'alert-circle';
    if (daysUntil <= 15) return 'warning';
    return 'information-circle';
  }

  function renderDebtAlert(debt: Debt) {
    const vencimento = new Date(debt.vencimento);
    const daysUntil = differenceInDays(vencimento, new Date());
    const color = getAlertColor(daysUntil);
    const icon = getAlertIcon(daysUntil);

    let urgencyText = '';
    if (daysUntil === 0) urgencyText = 'Vence HOJE';
    else if (daysUntil === 1) urgencyText = 'Vence AMANHÃ';
    else if (daysUntil <= 5) urgencyText = `Vence em ${daysUntil} dias - URGENTE`;
    else if (daysUntil <= 15) urgencyText = `Vence em ${daysUntil} dias`;
    else urgencyText = `Vence em ${daysUntil} dias`;

    return (
      <View key={debt.id} style={[styles.alertCard, { borderLeftColor: color }]}>
        <View style={styles.alertHeader}>
          <Ionicons name={icon} size={24} color={color} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{debt.credor}</Text>
            <Text style={[styles.urgencyText, { color }]}>{urgencyText}</Text>
          </View>
          <View style={styles.alertRight}>
            <Text style={styles.alertValue}>R$ {debt.valor.toFixed(2)}</Text>
            <Text style={styles.alertDate}>
              {format(vencimento, 'dd/MM/yyyy')}
            </Text>
          </View>
        </View>
        {debt.descricao && (
          <Text style={styles.alertDescription}>{debt.descricao}</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <View style={styles.header}>
        <Ionicons name="notifications" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Alertas</Text>
      </View>

      <View style={styles.summary}>
        <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="alert-circle" size={24} color="#fff" />
          <Text style={styles.summaryValue}>
            {debtAlerts.filter(d => differenceInDays(new Date(d.vencimento), new Date()) <= 5).length}
          </Text>
          <Text style={styles.summaryLabel}>Urgentes (5 dias)</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#f59e0b' }]}>
          <Ionicons name="warning" size={24} color="#fff" />
          <Text style={styles.summaryValue}>
            {debtAlerts.filter(d => {
              const days = differenceInDays(new Date(d.vencimento), new Date());
              return days > 5 && days <= 15;
            }).length}
          </Text>
          <Text style={styles.summaryLabel}>Atenção (15 dias)</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#3b82f6' }]}>
          <Ionicons name="information-circle" size={24} color="#fff" />
          <Text style={styles.summaryValue}>
            {debtAlerts.filter(d => differenceInDays(new Date(d.vencimento), new Date()) > 15).length}
          </Text>
          <Text style={styles.summaryLabel}>Próximas (30 dias)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dívidas a Vencer</Text>
        
        {debtAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyText}>
              Você não tem dívidas vencendo nos próximos 30 dias.
            </Text>
          </View>
        ) : (
          debtAlerts.map(debt => renderDebtAlert(debt))
        )}
      </View>

      <View style={styles.tipsCard}>
        <Ionicons name="bulb" size={24} color="#10b981" />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Dica Financeira</Text>
          <Text style={styles.tipsText}>
            Mantenha uma reserva de emergência equivalente a 3-6 meses de despesas operacionais. 
            Isso ajuda a evitar atrasos em pagamentos durante períodos de baixa produção.
          </Text>
        </View>
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
  summary: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertRight: {
    alignItems: 'flex-end',
  },
  alertValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  alertDate: {
    fontSize: 12,
    color: '#64748b',
  },
  alertDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
});
