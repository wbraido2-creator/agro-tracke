import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDebtModal({ visible, onClose, onSuccess }: Props) {
  const [valor, setValor] = useState('');
  const [credor, setCredor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [diasVencimento, setDiasVencimento] = useState('30');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!valor || !credor) {
      Alert.alert('Erro', 'Preencha o valor e o credor');
      return;
    }

    if (!diasVencimento || parseInt(diasVencimento) < 1) {
      Alert.alert('Erro', 'Informe um prazo válido para o vencimento');
      return;
    }

    setLoading(true);
    try {
      // Calcular vencimento baseado nos dias informados
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + parseInt(diasVencimento));

      await api.post('/api/debts', {
        valor: parseFloat(valor),
        credor,
        vencimento: vencimento.toISOString(),
        cultura: 'Geral',
        status: 'pendente',
        descricao: descricao || undefined,
      });
      Alert.alert('Sucesso', 'Dívida adicionada com sucesso!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.log('Error creating debt:', error);
      const errorMsg = error.response?.data?.detail || 'Não foi possível adicionar a dívida';
      Alert.alert('Erro', errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setValor('');
    setCredor('');
    setDescricao('');
    setDiasVencimento('30');
  }

  // Calcular data de vencimento
  const calcularDataVencimento = () => {
    if (!diasVencimento || parseInt(diasVencimento) < 1) return '';
    const data = new Date();
    data.setDate(data.getDate() + parseInt(diasVencimento));
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Dívida</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={valor}
              onChangeText={setValor}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Credor</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do credor ou banco"
              placeholderTextColor="#64748b"
              value={credor}
              onChangeText={setCredor}
            />

            <Text style={styles.label}>Prazo de Vencimento (dias)</Text>
            <View style={styles.prazoContainer}>
              <TextInput
                style={[styles.input, styles.prazoInput]}
                placeholder="30"
                placeholderTextColor="#64748b"
                value={diasVencimento}
                onChangeText={setDiasVencimento}
                keyboardType="number-pad"
              />
              {diasVencimento && parseInt(diasVencimento) > 0 && (
                <View style={styles.dataPreview}>
                  <Ionicons name="calendar" size={16} color="#10b981" />
                  <Text style={styles.dataPreviewText}>
                    Vence em: {calcularDataVencimento()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.label}>Descrição da Dívida</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descreva a dívida (ex: Empréstimo safra 2025, Financiamento trator, etc)"
              placeholderTextColor="#64748b"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                Informe o prazo em dias. Exemplos: 30 (1 mês), 90 (3 meses), 180 (6 meses), 365 (1 ano)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adicionando...' : 'Adicionar Dívida'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  optionButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  optionText: {
    color: '#64748b',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  prazoContainer: {
    gap: 12,
  },
  prazoInput: {
    flex: 0,
  },
  dataPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  dataPreviewText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#3b82f6',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});