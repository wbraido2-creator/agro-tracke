import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Calculator = 'sementes' | 'defensivos' | 'custo' | 'roi';

export default function Ferramentas() {
  const [activeCalc, setActiveCalc] = useState<Calculator>('sementes');

  // Calculadora de Sementes
  const [areaSementes, setAreaSementes] = useState('');
  const [densidade, setDensidade] = useState('');
  const [resultSementes, setResultSementes] = useState('');

  function calcularSementes() {
    const area = parseFloat(areaSementes);
    const dens = parseFloat(densidade);
    if (area && dens) {
      const total = area * dens;
      setResultSementes(`${total.toFixed(2)} kg de sementes necessárias`);
    }
  }

  // Calculadora de Defensivos
  const [areaDefensivos, setAreaDefensivos] = useState('');
  const [dosePorHa, setDosePorHa] = useState('');
  const [resultDefensivos, setResultDefensivos] = useState('');

  function calcularDefensivos() {
    const area = parseFloat(areaDefensivos);
    const dose = parseFloat(dosePorHa);
    if (area && dose) {
      const total = area * dose;
      setResultDefensivos(`${total.toFixed(2)} litros/kg necessários`);
    }
  }

  // Calculadora de Custo por Hectare
  const [areaCusto, setAreaCusto] = useState('');
  const [custoTotal, setCustoTotal] = useState('');
  const [resultCusto, setResultCusto] = useState('');

  function calcularCustoHa() {
    const area = parseFloat(areaCusto);
    const custo = parseFloat(custoTotal);
    if (area && custo) {
      const custoPorHa = custo / area;
      setResultCusto(`R$ ${custoPorHa.toFixed(2)} por hectare`);
    }
  }

  // Calculadora de ROI
  const [investimento, setInvestimento] = useState('');
  const [receitaTotal, setReceitaTotal] = useState('');
  const [resultROI, setResultROI] = useState('');

  function calcularROI() {
    const invest = parseFloat(investimento);
    const receita = parseFloat(receitaTotal);
    if (invest && receita) {
      const lucro = receita - invest;
      const roi = (lucro / invest) * 100;
      const margem = (lucro / receita) * 100;
      setResultROI(
        `ROI: ${roi.toFixed(2)}%\nLucro: R$ ${lucro.toFixed(2)}\nMargem: ${margem.toFixed(2)}%`
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="calculator" size={28} color="#10b981" />
        <Text style={styles.headerTitle}>Calculadoras</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeCalc === 'sementes' && styles.tabActive]}
          onPress={() => setActiveCalc('sementes')}
        >
          <Ionicons name="leaf" size={20} color={activeCalc === 'sementes' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabText, activeCalc === 'sementes' && styles.tabTextActive]}>
            Sementes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeCalc === 'defensivos' && styles.tabActive]}
          onPress={() => setActiveCalc('defensivos')}
        >
          <Ionicons name="shield" size={20} color={activeCalc === 'defensivos' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabText, activeCalc === 'defensivos' && styles.tabTextActive]}>
            Defensivos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeCalc === 'custo' && styles.tabActive]}
          onPress={() => setActiveCalc('custo')}
        >
          <Ionicons name="cash" size={20} color={activeCalc === 'custo' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabText, activeCalc === 'custo' && styles.tabTextActive]}>
            Custo/ha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeCalc === 'roi' && styles.tabActive]}
          onPress={() => setActiveCalc('roi')}
        >
          <Ionicons name="trending-up" size={20} color={activeCalc === 'roi' ? '#10b981' : '#64748b'} />
          <Text style={[styles.tabText, activeCalc === 'roi' && styles.tabTextActive]}>
            ROI
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeCalc === 'sementes' && (
          <View style={styles.calculator}>
            <Text style={styles.calcTitle}>Calculadora de Sementes</Text>
            <Text style={styles.calcSubtitle}>Calcule a quantidade necessária de sementes</Text>

            <Text style={styles.label}>Área (hectares)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              placeholderTextColor="#64748b"
              value={areaSementes}
              onChangeText={setAreaSementes}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Densidade (kg/ha)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 60"
              placeholderTextColor="#64748b"
              value={densidade}
              onChangeText={setDensidade}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.calcButton} onPress={calcularSementes}>
              <Text style={styles.calcButtonText}>Calcular</Text>
            </TouchableOpacity>

            {resultSementes !== '' && (
              <View style={styles.result}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.resultText}>{resultSementes}</Text>
              </View>
            )}
          </View>
        )}

        {activeCalc === 'defensivos' && (
          <View style={styles.calculator}>
            <Text style={styles.calcTitle}>Calculadora de Defensivos</Text>
            <Text style={styles.calcSubtitle}>Calcule a quantidade de defensivos necessária</Text>

            <Text style={styles.label}>Área (hectares)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              placeholderTextColor="#64748b"
              value={areaDefensivos}
              onChangeText={setAreaDefensivos}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Dose por hectare (L ou kg/ha)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 2.5"
              placeholderTextColor="#64748b"
              value={dosePorHa}
              onChangeText={setDosePorHa}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.calcButton} onPress={calcularDefensivos}>
              <Text style={styles.calcButtonText}>Calcular</Text>
            </TouchableOpacity>

            {resultDefensivos !== '' && (
              <View style={styles.result}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.resultText}>{resultDefensivos}</Text>
              </View>
            )}
          </View>
        )}

        {activeCalc === 'custo' && (
          <View style={styles.calculator}>
            <Text style={styles.calcTitle}>Custo por Hectare</Text>
            <Text style={styles.calcSubtitle}>Calcule o custo médio por hectare</Text>

            <Text style={styles.label}>Área Total (hectares)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 100"
              placeholderTextColor="#64748b"
              value={areaCusto}
              onChangeText={setAreaCusto}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Custo Total (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 250000"
              placeholderTextColor="#64748b"
              value={custoTotal}
              onChangeText={setCustoTotal}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.calcButton} onPress={calcularCustoHa}>
              <Text style={styles.calcButtonText}>Calcular</Text>
            </TouchableOpacity>

            {resultCusto !== '' && (
              <View style={styles.result}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.resultText}>{resultCusto}</Text>
              </View>
            )}
          </View>
        )}

        {activeCalc === 'roi' && (
          <View style={styles.calculator}>
            <Text style={styles.calcTitle}>ROI - Retorno sobre Investimento</Text>
            <Text style={styles.calcSubtitle}>Calcule a rentabilidade da sua safra</Text>

            <Text style={styles.label}>Investimento Total (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 250000"
              placeholderTextColor="#64748b"
              value={investimento}
              onChangeText={setInvestimento}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Receita Total (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 350000"
              placeholderTextColor="#64748b"
              value={receitaTotal}
              onChangeText={setReceitaTotal}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.calcButton} onPress={calcularROI}>
              <Text style={styles.calcButtonText}>Calcular</Text>
            </TouchableOpacity>

            {resultROI !== '' && (
              <View style={styles.result}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={styles.resultText}>{resultROI}</Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                ROI positivo indica lucro. ROI acima de 20% é considerado excelente no agronegócio.
              </Text>
            </View>
          </View>
        )}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10b981',
  },
  content: {
    padding: 24,
  },
  calculator: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  calcTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  calcSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
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
  calcButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  resultText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    lineHeight: 24,
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
    lineHeight: 18,
  },
});
