import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { CategoryChip } from '../components/CategoryChip';
import { EmptyState } from '../components/EmptyState';
import { RecommendationCard } from '../components/RecommendationCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { SkeletonBlock, SkeletonPill } from '../components/Skeleton';
import { serviceSpecialtiesForPicker } from '../constants/categories';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useApp } from '../services/AppContext';
import { searchRecommendations } from '../services/api';
import { openWhatsApp } from '../services/whatsapp';
import { Recommendation } from '../types';
import { commonStyles } from './styles';

export function SearchScreen({ navigation, route }: any) {
  const { user } = useApp();
  const [query, setQuery] = useState(route?.params?.query ?? '');
  const [serviceSpecialtyId, setServiceSpecialtyId] = useState<string | undefined>(route?.params?.serviceSpecialtyId);
  const [minRating, setMinRating] = useState<number | undefined>();
  const [results, setResults] = useState<Recommendation[]>([]);
  const [mostRecommended, setMostRecommended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    setQuery(route?.params?.query ?? '');
    setServiceSpecialtyId(route?.params?.serviceSpecialtyId);
  }, [route?.params?.query, route?.params?.serviceSpecialtyId]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    searchRecommendations(user.condominiumId, query, serviceSpecialtyId, minRating)
      .then((data) => {
        if (!active) return;
        setResults(mostRecommended ? [...data].sort((a, b) => b.recommendedByCount - a.recommendedByCount) : data);
        setHasLoadedOnce(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, query, serviceSpecialtyId, minRating, mostRecommended]);

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.lg }}>
        <Text style={commonStyles.title}>Buscar recomendações</Text>
        <View style={styles.searchBar}>
          <Search color={colors.secondaryText} size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Busque por eletricista, diarista, ar-condicionado..."
            placeholderTextColor={colors.secondaryText}
            style={styles.input}
            autoFocus
            blurOnSubmit
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          <CategoryChip label="Todas" selected={!serviceSpecialtyId} onPress={() => setServiceSpecialtyId(undefined)} />
          {serviceSpecialtiesForPicker
            .filter((specialty) => specialty.id !== 'outros')
            .map((specialty) => (
              <CategoryChip key={specialty.id} label={specialty.name} selected={serviceSpecialtyId === specialty.id} onPress={() => setServiceSpecialtyId(specialty.id)} />
            ))}
        </ScrollView>
        <View style={commonStyles.row}>
          <CategoryChip label="4.5+ estrelas" selected={minRating === 4.5} onPress={() => setMinRating(minRating ? undefined : 4.5)} />
          <CategoryChip label="Mais recomendados" selected={mostRecommended} onPress={() => setMostRecommended((value) => !value)} />
        </View>
        {loading && !hasLoadedOnce ? (
          <SearchResultsSkeleton />
        ) : results.length === 0 ? (
          <EmptyState title="Ainda não temos recomendações para essa busca no seu condomínio.">
            <AppButton title="Cadastrar uma recomendação" onPress={() => navigation.navigate('AddRecommendation')} />
            <AppButton title="Limpar busca" variant="secondary" onPress={() => { setQuery(''); setServiceSpecialtyId(undefined); setMinRating(undefined); }} />
          </EmptyState>
        ) : (
          results.map((item) => (
            <RecommendationCard key={item.id} item={item} onDetails={() => navigation.getParent()?.navigate('RecommendationDetail', { id: item.id })} onWhatsApp={() => openWhatsApp(item.whatsapp)} />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

function SearchResultsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((entry) => (
        <View key={entry} style={styles.skeletonCard}>
          <View style={styles.skeletonTop}>
            <View style={styles.skeletonTitleWrap}>
              <SkeletonBlock width="62%" height={18} />
              <SkeletonBlock width="38%" height={14} />
            </View>
            <SkeletonPill width={72} />
          </View>
          <SkeletonBlock width="100%" height={16} />
          <SkeletonBlock width="82%" height={16} />
          <SkeletonBlock width="42%" height={14} />
          <View style={styles.skeletonActions}>
            <SkeletonBlock width="76%" height={48} radius={12} />
            <SkeletonBlock width={48} height={48} radius={10} />
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  input: { flex: 1, color: colors.text, fontSize: typography.body, fontFamily: typography.fontFamily },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: spacing.md
  },
  skeletonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  skeletonTitleWrap: {
    flex: 1,
    gap: spacing.sm
  },
  skeletonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  }
});
