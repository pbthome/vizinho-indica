import { useFocusEffect } from '@react-navigation/native';
import { Activity, Eye, Search, Star, Store, TrendingUp, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { isAdmin } from '../navigation/guards';
import { AdminDashboardMetrics, AdminMetricsRange, getAdminDashboardMetrics } from '../services/api';
import { useApp } from '../services/AppContext';
import { getBackendMode } from '../services/supabase/config';

const rangeLabels: Record<AdminMetricsRange, string> = {
  day: 'Dia',
  week: 'Semana',
  month: 'Mês'
};

export function AdminDashboardScreen({ navigation }: any) {
  const { user } = useApp();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [range, setRange] = useState<AdminMetricsRange>('week');

  useFocusEffect(
    useCallback(() => {
      if (!user || !isAdmin(user)) {
        navigation.navigate('Home');
        return;
      }

      getAdminDashboardMetrics(user.condominiumId).then(setMetrics);
    }, [navigation, user])
  );

  if (!metrics) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Carregando métricas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedTrends = metrics.trends[range];
  const backendMode = getBackendMode();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.mockBadge}>
            <Text style={styles.mockBadgeText}>{backendMode === 'supabase' ? 'Conectado ao Supabase real' : 'MVP com dados simulados'}</Text>
          </View>
          <Text style={styles.eyebrow}>Painel de adoção</Text>
          <Text style={styles.title}>{user?.condominiumName}</Text>
          <Text style={styles.subtitle}>Crescimento, engajamento e uso da comunidade em uma leitura rápida.</Text>
        </View>

        <View style={styles.heroMetricGrid}>
          <HeroMetricCard icon={<Users color={colors.primary} size={20} />} label="Moradores cadastrados" value={metrics.totals.residents} accent="#EAF5F0" />
          <HeroMetricCard icon={<Store color="#966A16" size={20} />} label="Fornecedores cadastrados" value={metrics.totals.suppliers} accent="#FFF4D8" />
          <HeroMetricCard icon={<Star color="#A66420" size={20} />} label="Total de avaliações" value={metrics.totals.reviews} accent="#FFF0E6" />
          <HeroMetricCard icon={<Activity color="#316D86" size={20} />} label="Usuários ativos no mês" value={metrics.totals.monthlyActiveUsers} accent="#E8F5FA" />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Evolução de uso</Text>
            <Text style={styles.sectionSubtitle}>Filtro temporal para acompanhar tendência sem excesso de tabela.</Text>
          </View>
        </View>

        <View style={styles.rangeSelector}>
          {(Object.keys(rangeLabels) as AdminMetricsRange[]).map((item) => (
            <Pressable key={item} onPress={() => setRange(item)} style={[styles.rangeButton, range === item && styles.rangeButtonActive]}>
              <Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{rangeLabels[item]}</Text>
            </Pressable>
          ))}
        </View>

        <LineChartCard title="Avaliações criadas" subtitle="Novas avaliações no período" data={selectedTrends.reviews} color={colors.primary} />
        <LineChartCard title="Usuários ativos" subtitle={backendMode === 'supabase' ? 'Uso registrado no período' : 'Acessos simulados no período'} data={selectedTrends.activeUsers} color="#316D86" />

        <View style={styles.derivedGrid}>
          <DerivedMetricCard label="% de moradores ativos" value={`${metrics.derived.activeResidentsPercentage}%`} detail="Moradores ativos no mês sobre cadastrados" />
          <DerivedMetricCard label="Média de avaliações por fornecedor" value={metrics.derived.reviewsPerSupplier.toFixed(1)} detail="Total de avaliações dividido por fornecedores" />
        </View>

        <View style={styles.insightSection}>
          <InsightList
            icon={<Search color={colors.primary} size={18} />}
            title="Categorias mais buscadas"
            items={metrics.rankings.searchedCategories.map((item) => ({ title: item.name, meta: `${item.count} ${backendMode === 'supabase' ? 'buscas registradas' : 'buscas simuladas'}` }))}
          />

          <InsightList
            icon={<Eye color={colors.primary} size={18} />}
            title="Prestadores mais visualizados"
            items={metrics.rankings.viewedProviders.map((item) => ({ title: item.name, meta: `${item.service} · ${item.views} visualizações` }))}
          />

          <View style={styles.listCard}>
            <View style={styles.listTitleRow}>
              <View style={styles.listIcon}>
                <Star color={colors.primary} size={18} />
              </View>
              <Text style={styles.listTitle}>Últimas avaliações criadas</Text>
            </View>
            <View style={styles.reviewList}>
              {metrics.rankings.latestReviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewProvider}>{review.provider}</Text>
                    <Text style={styles.reviewRating}>{review.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.reviewComment} numberOfLines={2}>
                    “{review.comment}”
                  </Text>
                  <Text style={styles.reviewMeta}>
                    {review.reviewer} · {formatDate(review.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <TrendingUp color={colors.primary} size={19} />
          <Text style={styles.noteText}>
            {backendMode === 'supabase'
              ? 'Esta tela esta usando o backend real. Parte das metricas ja vem do banco, e o fluxo esta pronto para evoluir conforme novas capturas de uso forem adicionadas.'
              : 'Hoje estes numeros sao calculados com dados locais do prototipo. A tela ja esta organizada para receber metricas reais de acessos, buscas e visualizacoes quando o backend for conectado.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroMetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <View style={styles.heroMetricCard}>
      <View style={[styles.metricIcon, { backgroundColor: accent }]}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function DerivedMetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.derivedCard}>
      <Text style={styles.derivedValue}>{value}</Text>
      <Text style={styles.derivedLabel}>{label}</Text>
      <Text style={styles.derivedDetail}>{detail}</Text>
    </View>
  );
}

function LineChartCard({ title, subtitle, data, color }: { title: string; subtitle: string; data: Array<{ label: string; value: number }>; color: string }) {
  const [width, setWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  const chartHeight = 142;
  const horizontalPadding = 16;
  const verticalPadding = 18;
  const chartWidth = Math.max(width - horizontalPadding * 2, 0);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? chartWidth / 2 : (chartWidth / (data.length - 1)) * index;
    const y = chartHeight - verticalPadding - (item.value / maxValue) * (chartHeight - verticalPadding * 2);
    return { x: x + horizontalPadding, y, ...item };
  });
  const path = buildSmoothPath(points);

  return (
    <View style={styles.chartCard} onLayout={handleLayout}>
      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chartTotal}>{data.reduce((sum, item) => sum + item.value, 0)}</Text>
      </View>

      {width > 0 ? (
        <View style={styles.chartCanvas}>
          <Svg width={width} height={chartHeight}>
            <Path d={path} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <Circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r={4.5} fill={colors.surface} stroke={color} strokeWidth={2.5} />
            ))}
          </Svg>
          <View style={styles.chartLabels}>
            {data.map((item) => (
              <Text key={item.label} style={styles.chartLabel}>
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function InsightList({ icon, title, items }: { icon: React.ReactNode; title: string; items: Array<{ title: string; meta: string }> }) {
  return (
    <View style={styles.listCard}>
      <View style={styles.listTitleRow}>
        <View style={styles.listIcon}>{icon}</View>
        <Text style={styles.listTitle}>{title}</Text>
      </View>
      <View style={styles.rankList}>
        {items.map((item, index) => (
          <View key={item.title} style={styles.rankItem}>
            <Text style={styles.rankNumber}>{index + 1}</Text>
            <View style={styles.rankTextWrap}>
              <Text style={styles.rankTitle}>{item.title}</Text>
              <Text style={styles.rankMeta}>{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlDistance = (point.x - previous.x) / 2;
    return `${path} C ${previous.x + controlDistance} ${previous.y}, ${point.x - controlDistance} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 112
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  loadingText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    fontFamily: typography.fontFamily
  },
  hero: {
    backgroundColor: colors.darkGreen,
    borderRadius: 24,
    padding: spacing.lg,
    gap: 7,
    overflow: 'hidden',
    shadowColor: colors.darkGreen,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3
  },
  heroGlow: {
    position: 'absolute',
    right: -58,
    top: -62,
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: '#65D1AA',
    opacity: 0.16
  },
  mockBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 3
  },
  mockBadgeText: {
    color: '#DDF2EA',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  eyebrow: {
    color: '#BFE5D8',
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: typography.fontFamily
  },
  title: {
    color: colors.surface,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  subtitle: {
    color: '#D5EEE5',
    fontSize: typography.small,
    lineHeight: 20,
    maxWidth: 340,
    fontFamily: typography.fontFamily
  },
  heroMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  heroMetricCard: {
    width: '48.8%',
    minHeight: 132,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4ECE8',
    padding: spacing.md,
    gap: 7,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricValue: {
    color: colors.text,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  metricLabel: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  sectionHeader: {
    marginTop: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  sectionSubtitle: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 17,
    marginTop: 2,
    fontFamily: typography.fontFamily
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#EBF1EE',
    borderRadius: 17,
    padding: 5
  },
  rangeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rangeButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1
  },
  rangeText: {
    color: colors.secondaryText,
    fontSize: typography.small,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  rangeTextActive: {
    color: colors.darkGreen
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4ECE8',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 14,
    elevation: 2
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md
  },
  chartTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  chartSubtitle: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 16,
    marginTop: 2,
    fontFamily: typography.fontFamily
  },
  chartTotal: {
    color: colors.darkGreen,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  chartCanvas: {
    marginTop: spacing.sm
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: -6
  },
  chartLabel: {
    color: '#83918C',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    fontFamily: typography.fontFamily
  },
  derivedGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  derivedCard: {
    flex: 1,
    backgroundColor: '#FDFEFD',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E3ECE7',
    padding: spacing.md,
    gap: 4
  },
  derivedValue: {
    color: colors.darkGreen,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  derivedLabel: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  derivedDetail: {
    color: colors.secondaryText,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: typography.fontFamily
  },
  insightSection: {
    gap: spacing.sm
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4ECE8',
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#0E2E25',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 1
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  listIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EEF7F3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listTitle: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  rankList: {
    gap: 9
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 42
  },
  rankNumber: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F1F6F3',
    color: colors.darkGreen,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: typography.tiny,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  rankTextWrap: {
    flex: 1,
    gap: 2
  },
  rankTitle: {
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '800',
    fontFamily: typography.fontFamily
  },
  rankMeta: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontFamily: typography.fontFamily
  },
  reviewList: {
    gap: 10
  },
  reviewItem: {
    borderRadius: 15,
    backgroundColor: '#FAFCFB',
    borderWidth: 1,
    borderColor: '#EDF3EF',
    padding: spacing.sm,
    gap: 5
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm
  },
  reviewProvider: {
    flex: 1,
    color: colors.text,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  reviewRating: {
    color: '#9A650B',
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: '900',
    fontFamily: typography.fontFamily
  },
  reviewComment: {
    color: '#374741',
    fontSize: typography.small,
    lineHeight: 19,
    fontFamily: typography.fontFamily
  },
  reviewMeta: {
    color: colors.secondaryText,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontFamily: typography.fontFamily
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: 18,
    backgroundColor: '#EDF7F2',
    borderWidth: 1,
    borderColor: '#D7EAE1',
    padding: spacing.md
  },
  noteText: {
    flex: 1,
    color: '#42675C',
    fontSize: typography.tiny,
    lineHeight: 17,
    fontWeight: '600',
    fontFamily: typography.fontFamily
  }
});
