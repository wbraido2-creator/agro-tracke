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

const CATEGORIAS = ['Sementes', 'Fertilizantes', 'Defensivos', 'Combustível', 'Mão de Obra', 'Manutenção', 'Outro'];
const CULTURAS = ['Soja', 'Milho', 'Trigo', 'Algodão', 'Aveia', 'Outro'];
const TIPOS = ['Fixo', 'Variável'];

export default function AddExpenseModal({ visible, onClose, onSuccess }: Props) {
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Sementes');
  const [cultura, setCultura] = useState('Soja');
  const [tipo, setTipo] = useState('Variável');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!valor) {
      Alert.alert('Erro', 'Preencha o valor da despesa');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/expenses', {
        valor: parseFloat(valor),
        categoria,
        cultura,
        tipo,
        data: new Date().toISOString(),
        descricao: descricao || undefined,
      });
      Alert.alert('Sucesso', 'Despesa adicionada com sucesso!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.log('Error creating expense:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a despesa');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setValor('');
    setCategoria('Sementes');
    setCultura('Soja');
    setTipo('Variável');
    setDescricao('');
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Despesa</Text>
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

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.buttonGroup}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionButton,
                    categoria === cat && styles.optionButtonActive,
                  ]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      categoria === cat && styles.optionTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cultura</Text>
            <View style={styles.buttonGroup}>
              {CULTURAS.map((cult) => (
                <TouchableOpacity
                  key={cult}
                  style={[
                    styles.optionButton,
                    cultura === cult && styles.optionButtonActive,
                  ]}
                  onPress={() => setCultura(cult)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      cultura === cult && styles.optionTextActive,
                    ]}
                  >
                    {cult}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.buttonGroup}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.optionButton,
                    tipo === t && styles.optionButtonActive,
                  ]}
                  onPress={() => setTipo(t)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      tipo === t && styles.optionTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detalhes da despesa..."
              placeholderTextColor="#64748b"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adicionando...' : 'Adicionar Despesa'}
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