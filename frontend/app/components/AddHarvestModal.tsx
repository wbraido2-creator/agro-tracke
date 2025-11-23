import React, { useState, useEffect } from 'react';
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
import { Field } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CULTURAS = ['Soja', 'Milho', 'Trigo', 'Algodão', 'Aveia', 'Café', 'Cana', 'Outro'];

export default function AddHarvestModal({ visible, onClose, onSuccess }: Props) {
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [cultura, setCultura] = useState('Soja');
  const [quantidadeSacas, setQuantidadeSacas] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFields();
    }
  }, [visible]);

  async function loadFields() {
    try {
      const response = await api.get('/api/fields');
      setFields(response.data);
      if (response.data.length > 0) {
        setSelectedField(response.data[0].id);
      }
    } catch (error) {
      console.log('Error loading fields:', error);
    }
  }

  async function handleSubmit() {
    if (!selectedField || !quantidadeSacas) {
      Alert.alert('Erro', 'Selecione um talhão e informe a quantidade de sacas');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/harvests', {
        field_id: selectedField,
        cultura,
        quantidade_sacas: parseFloat(quantidadeSacas),
        data_colheita: new Date().toISOString(),
        observacoes: observacoes || undefined,
      });
      Alert.alert('Sucesso', 'Safra adicionada com sucesso!');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.log('Error creating harvest:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a safra');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setSelectedField('');
    setCultura('Soja');
    setQuantidadeSacas('');
    setObservacoes('');
  }

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nova Safra</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {fields.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle" size={48} color="#f59e0b" />
                <Text style={styles.emptyText}>
                  Você precisa cadastrar um talhão antes de registrar uma safra
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Talhão</Text>
                <View style={styles.fieldSelector}>
                  {fields.map((field) => (
                    <TouchableOpacity
                      key={field.id}
                      style={[
                        styles.fieldOption,
                        selectedField === field.id && styles.fieldOptionActive,
                      ]}
                      onPress={() => setSelectedField(field.id)}
                    >
                      <Text
                        style={[
                          styles.fieldOptionText,
                          selectedField === field.id && styles.fieldOptionTextActive,
                        ]}
                      >
                        {field.nome}
                      </Text>
                      <Text style={styles.fieldOptionSubtext}>
                        {field.area_ha} ha - {field.cultura}
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

                <Text style={styles.label}>Quantidade (sacas)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={quantidadeSacas}
                  onChangeText={setQuantidadeSacas}
                  keyboardType="decimal-pad"
                />

                {selectedFieldData && quantidadeSacas && (
                  <View style={styles.infoBox}>
                    <Ionicons name="calculator" size={20} color="#10b981" />
                    <Text style={styles.infoText}>
                      Produtividade estimada: {' '}
                      {(parseFloat(quantidadeSacas) / selectedFieldData.area_ha).toFixed(2)} sacas/ha
                    </Text>
                  </View>
                )}

                <Text style={styles.label}>Observações (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Detalhes da safra..."
                  placeholderTextColor="#64748b"
                  value={observacoes}
                  onChangeText={setObservacoes}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Adicionando...' : 'Adicionar Safra'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
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
  fieldSelector: {
    gap: 8,
  },
  fieldOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  fieldOptionActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  fieldOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  fieldOptionTextActive: {
    color: '#10b981',
  },
  fieldOptionSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: '#10b981',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 16,
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