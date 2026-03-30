import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link, Image } from '@react-pdf/renderer';
import { ReportData, PDFArticleCluster, PdfConfig, MonitoringSummary } from '../types';

// Use built-in fonts for maximum reliability
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#006837',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006837',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
    padding: 20,
  },
  logo: {
    width: 180,
    marginBottom: 30,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#006837',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006837',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#EEEEEE',
    paddingBottom: 5,
  },
  tocItem: {
    fontSize: 12,
    marginBottom: 8,
    color: '#333333',
    textDecoration: 'none',
  },
  articleCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: '#006837',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  articleMeta: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  articleSummary: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
  },
  badge: {
    fontSize: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  riskHigh: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  riskMedium: { backgroundColor: '#FEF3C7', color: '#92400E' },
  riskLow: { backgroundColor: '#DCFCE7', color: '#166534' },
  controversyBadge: { backgroundColor: '#F97316', color: '#FFFFFF' },
  analysisBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
    borderLeftColor: '#F97316',
    borderRadius: 4,
  },
  analysisTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#9A3412',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  analysisText: {
    fontSize: 8,
    color: '#C2410C',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  sourcePill: {
    fontSize: 7,
    paddingVertical: 2,
    paddingHorizontal: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    borderRadius: 4,
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    textAlign: 'center',
    color: '#999999',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  link: {
    color: '#006837',
    textDecoration: 'underline',
    fontSize: 9,
  }
});

interface MediaIntelligencePDFProps {
  data: ReportData;
  dateRange: string;
  config: PdfConfig;
  summary: MonitoringSummary | null;
}

export const MediaIntelligencePDF: React.FC<MediaIntelligencePDFProps> = ({ data, dateRange, config, summary }) => {
  const categories = Object.keys(data?.clusters || {}).filter(cat => {
    if (cat === 'National') return config.includeNational;
    if (cat === 'Provincial') return config.includeProvincial;
    if (cat === 'Local') return config.includeLocal;
    if (cat === 'Uncategorized') return config.includeUncategorized;
    return true;
  });

  // Filter clusters based on focus sections
  const getFilteredClusters = (cat: string) => {
    return (data?.clusters?.[cat] || []).filter(cluster => {
      const article = cluster?.articles?.[0];
      
      // If no focus sections are selected, show all
      if (!config.sections || (!config.sections.provincialGovernment && !config.sections.localGovernment && !config.sections.figureHeads && !config.sections.serviceDelivery)) return true;

      if (config.sections?.provincialGovernment && article?.sphere_of_government === 'Provincial') return true;
      if (config.sections?.localGovernment && article?.sphere_of_government === 'Local') return true;
      if (config.sections?.figureHeads && ((article?.person_or_officials_mentioned || [])?.length > 0)) return true;
      if (config.sections?.serviceDelivery && ((article?.topic_categories || [])?.includes('Service Delivery') || (article?.topic_categories || [])?.includes('Infrastructure'))) return true;
      
      return false;
    });
  };

  const renderArticleCluster = (cluster: PDFArticleCluster, idx: number) => {
    const tones = Array.from(new Set(cluster.articles.map(a => a.tone_classification)));
    const isControversial = tones.length > 1;

    // Executive layout: minimal detail
    if (config.layoutTemplate === 'executive') {
      return (
        <View key={idx} style={[styles.articleCard, { padding: 10, borderLeftWidth: 2 }]} wrap={false}>
          <Text style={[styles.articleTitle, { fontSize: 12 }]}>{cluster.articles[0]?.article_title || 'Untitled Article'}</Text>
          <View style={styles.articleMeta}>
            <Text>{cluster.articles[0]?.source_name || 'Unknown Source'} | {cluster.articles[0]?.publication_date || 'Unknown Date'}</Text>
            <Text style={{ color: cluster.articles[0]?.reputational_risk === 'Critical' ? '#991B1B' : '#6B7280', fontWeight: 'bold' }}>
              {cluster.articles[0]?.reputational_risk || 'Low'} Risk
            </Text>
          </View>
        </View>
      );
    }

    // Compact layout: smaller fonts
    const fontSizeMultiplier = config.layoutTemplate === 'compact' ? 0.85 : 1;

    return (
      <View key={idx} style={[styles.articleCard, config.layoutTemplate === 'compact' && { marginBottom: 10, padding: 10 }]} wrap={false}>
        <Text style={[styles.articleTitle, { fontSize: 14 * fontSizeMultiplier }]}>{cluster.articles[0]?.article_title || 'Untitled Article'}</Text>
        
        <View style={styles.articleMeta}>
          <Text style={{ fontSize: 9 * fontSizeMultiplier }}>
            {cluster.articles[0]?.sphere_of_government || 'Provincial'} | {cluster.articles[0]?.source_name || 'Unknown Source'} | {cluster.articles[0]?.municipality_or_district || cluster.articles[0]?.department_or_office || 'Eastern Cape'}
          </Text>
          <Text style={{ fontSize: 9 * fontSizeMultiplier }}>Date: {cluster.articles[0]?.publication_date || 'Unknown Date'}</Text>
        </View>

        {(config.includeSectionSummaries || config.depth === 'technical') && (
          <View>
            <Text style={[styles.articleSummary, { fontSize: 10 * fontSizeMultiplier }]}>
              {config.depth === 'technical' 
                ? `${cluster.summary || cluster.articles[0]?.summary_1_paragraph || 'No summary available.'} Strategic Context: This development impacts ${cluster.articles[0]?.primary_entity || 'N/A'} and requires monitoring of ${cluster.articles[0]?.dominant_topic || 'N/A'}.`
                : (cluster.summary || cluster.articles[0]?.summary_1_paragraph || 'No summary available.')
              }
            </Text>
            
            {cluster.articles.length > 1 && (
              <View style={[styles.sourceGrid, { marginTop: 0, marginBottom: 10 }]}>
                <Text style={{ fontSize: 7 * fontSizeMultiplier, color: '#9CA3AF', width: '100%', marginBottom: 2, fontWeight: 'bold' }}>SYNDICATED SOURCES & TONES:</Text>
                {cluster.articles.slice(1).map((art, sIdx) => (
                  <Text key={sIdx} style={[styles.sourcePill, { fontSize: 7 * fontSizeMultiplier }]}>
                    {art.source_name} ({art.tone_classification})
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {isControversial && (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>Controversy Analysis: Tone Divergence Detected</Text>
            <Text style={styles.analysisText}>
              Strategic Intelligence Note: This topic shows significant variation in media tone across {cluster.articles.length} sources. 
              The lead source reports a {(cluster.articles[0]?.tone_classification || 'Neutral').toLowerCase()} tone, while syndicated reports vary, 
              indicating a complex public perception and potential for reputational volatility.
            </Text>
          </View>
        )}

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, 
            (cluster.articles[0]?.reputational_risk === 'High' || cluster.articles[0]?.reputational_risk === 'Critical') ? styles.riskHigh : 
            cluster.articles[0]?.reputational_risk === 'Moderate' ? styles.riskMedium : styles.riskLow
          ]}>
            <Text style={{ fontSize: 8 * fontSizeMultiplier }}>{cluster.articles[0]?.reputational_risk || 'Low'} Risk</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#F3F4F6', color: '#374151' }]}>
            <Text style={{ fontSize: 8 * fontSizeMultiplier }}>Primary Tone: {cluster.articles[0]?.tone_classification || 'Neutral'}</Text>
          </View>
          {isControversial && (
            <View style={[styles.badge, styles.controversyBadge]}>
              <Text style={{ fontSize: 8 * fontSizeMultiplier }}>High Controversy</Text>
            </View>
          )}
        </View>

        {config.includeDataReferences && config.depth === 'technical' && (
          <View style={{ marginTop: 10, padding: 8, borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
            <Text style={{ fontSize: 8 * fontSizeMultiplier, fontWeight: 'bold', color: '#4B5563', marginBottom: 2 }}>DATA REFERENCES:</Text>
            <Text style={{ fontSize: 7 * fontSizeMultiplier, color: '#6B7280' }}>
              Primary Entity: {cluster.articles[0]?.primary_entity || 'N/A'} | 
              Confidence: {cluster.articles[0]?.confidence_score || 0}% | 
              Risk Reason: {cluster.articles[0]?.risk_reason || 'N/A'}
            </Text>
          </View>
        )}

        {config.depth !== 'light' && (
          <View style={{ marginTop: 10 }}>
            <Link src={cluster.articles[0]?.article_url || '#'} style={[styles.link, { fontSize: 9 * fontSizeMultiplier }]}>
              View Original Source Article
            </Link>
          </View>
        )}
      </View>
    );
  };

  return (
    <Document title={`EC News Media Intelligence Report - ${dateRange}`}>
      {/* Cover Page */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Image 
            src="https://ecprov.gov.za/images/logo_big.jpg" 
            style={styles.logo} 
          />
          <Text style={{ fontSize: 12, color: '#666666', fontWeight: 'bold', marginBottom: 5 }}>
            EASTERN CAPE PROVINCIAL GOVERNMENT
          </Text>
          <Text style={{ fontSize: 18, color: '#006837', fontWeight: 'bold', marginBottom: 20 }}>
            EASTERN CAPE OFFICE OF THE PREMIER
          </Text>
          
          <View style={{ width: 40, height: 2, backgroundColor: '#006837', marginBottom: 30 }} />
          
          <Text style={styles.coverTitle}>News Media Intelligence Report</Text>
          
          <Text style={{ fontSize: 10, color: '#006837', fontWeight: 'bold', marginBottom: 40, letterSpacing: 1 }}>
            {config.depth === 'light' ? 'EXECUTIVE OVERVIEW' : config.depth === 'technical' ? 'DEEP STRATEGIC ANALYSIS' : 'STANDARD INTELLIGENCE REPORT'}
          </Text>

          {config.includeDate && (
            <View style={{ paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#374151' }}>{dateRange.toUpperCase()}</Text>
            </View>
          )}

          <View style={{ position: 'absolute', bottom: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: '#999999' }}>
              Generated on {new Date().toLocaleString()}
            </Text>
            <Text style={{ fontSize: 8, color: '#999999', marginTop: 4 }}>
              EC Media Intelligence Engine v2.5
            </Text>
          </View>
        </View>
        <Text style={styles.footer}>Confidential - For Internal Use Only</Text>
      </Page>

      {/* Executive Summary & Strategic Analysis */}
      {(config.includeSummary || config.includeSwot || config.includeStrategicAnalysis) && summary && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Executive Intelligence Overview</Text>
            <Text style={styles.subtitle}>Strategic Analysis & Social Climate</Text>
          </View>

          {config.includeSummary && summary?.social_climate_summary && (
            <View style={{ marginBottom: 25 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#006837', marginBottom: 8 }}>Social Climate Summary</Text>
              <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>{summary?.social_climate_summary || 'No summary available.'}</Text>
            </View>
          )}

          {config.includeStrategicAnalysis && config.depth === 'technical' && summary?.strategic_analysis && (
            <View style={{ marginBottom: 25 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#006837', marginBottom: 10 }}>Deep Strategic Analysis</Text>
              
              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Interpretation & Context</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#374151' }}>{summary?.strategic_analysis?.interpretation || 'N/A'}</Text>
              </View>

              <View style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>Historic Background & Potential Consequences</Text>
                <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#374151' }}>{summary?.strategic_analysis?.potential_consequences_historic || 'N/A'}</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#059669', marginBottom: 4 }}>Low Hanging Fruit Interventions</Text>
                  {(summary?.strategic_analysis?.low_hanging_fruit_interventions || []).map((item, i) => (
                    <Text key={i} style={{ fontSize: 8, color: '#374151', marginBottom: 2 }}>• {item}</Text>
                  ))}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#2563EB', marginBottom: 4 }}>Long-Term Strategic Interventions</Text>
                  {(summary?.strategic_analysis?.long_term_interventions || []).map((item, i) => (
                    <Text key={i} style={{ fontSize: 8, color: '#374151', marginBottom: 2 }}>• {item}</Text>
                  ))}
                </View>
              </View>

              <View style={{ padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#006837' }}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#006837', marginBottom: 6 }}>OTP Orchestration & Coordination Strategy</Text>
                <Text style={{ fontSize: 9, color: '#475569', marginBottom: 8 }}>{summary?.strategic_analysis?.otp_orchestration_plan?.coordination_strategy || 'N/A'}</Text>
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#059669', marginBottom: 3 }}>LIKELY TO WORK:</Text>
                    {(summary?.strategic_analysis?.otp_orchestration_plan?.likely_to_work || []).map((item, i) => (
                      <Text key={i} style={{ fontSize: 7, color: '#334155', marginBottom: 1 }}>• {item}</Text>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#DC2626', marginBottom: 3 }}>UNLIKELY TO WORK:</Text>
                    {(summary?.strategic_analysis?.otp_orchestration_plan?.unlikely_to_work || []).map((item, i) => (
                      <Text key={i} style={{ fontSize: 7, color: '#334155', marginBottom: 1 }}>• {item}</Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {config.includeSentiment && config.includeGraphs && (
            <View style={{ marginBottom: 25 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#006837', marginBottom: 10 }}>Intelligence Metrics & Data Visualization</Text>
              
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                {/* Sentiment Distribution "Graph" */}
                <View style={{ flex: 1, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Sentiment Distribution</Text>
                  <View style={{ height: 60, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 5 }}>
                    {[
                      { label: 'Pos', val: summary?.positive || 0, color: '#10B981' },
                      { label: 'Neu', val: summary?.neutral || 0, color: '#6B7280' },
                      { label: 'Neg', val: summary?.negative || 0, color: '#EF4444' },
                      { label: 'Mix', val: summary?.mixed || 0, color: '#F59E0B' }
                    ].map((bar, i) => {
                      const max = Math.max(summary?.positive || 0, summary?.neutral || 0, summary?.negative || 0, summary?.mixed || 0) || 1;
                      const height = (bar.val / max) * 40;
                      return (
                        <View key={i} style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 6, marginBottom: 2 }}>{bar.val}</Text>
                          <View style={{ width: 15, height: height, backgroundColor: bar.color, borderRadius: 2 }} />
                          <Text style={{ fontSize: 6, marginTop: 2 }}>{bar.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Risk Profile "Graph" */}
                <View style={{ flex: 1, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Risk Profile</Text>
                  <View style={{ height: 60, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 5 }}>
                    {[
                      { label: 'Crit', val: summary?.critical_risk || 0, color: '#7F1D1D' },
                      { label: 'High', val: summary?.high_risk || 0, color: '#B91C1C' },
                      { label: 'Mod', val: (summary?.total_relevant_articles || 0) - (summary?.high_risk || 0) - (summary?.critical_risk || 0), color: '#F59E0B' }
                    ].map((bar, i) => {
                      const max = Math.max(summary?.critical_risk || 0, summary?.high_risk || 0, summary?.total_relevant_articles || 0) || 1;
                      const height = (bar.val / max) * 40;
                      return (
                        <View key={i} style={{ alignItems: 'center' }}>
                          <Text style={{ fontSize: 6, marginBottom: 2 }}>{bar.val}</Text>
                          <View style={{ width: 15, height: height, backgroundColor: bar.color, borderRadius: 2 }} />
                          <Text style={{ fontSize: 6, marginTop: 2 }}>{bar.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#4B5563', marginBottom: 4 }}>TOP TOPICS:</Text>
                  {(summary?.top_topics || []).slice(0, 5).map((topic, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#006837', marginRight: 4 }} />
                      <Text style={{ fontSize: 7, color: '#374151' }}>{topic}</Text>
                    </View>
                  ))}
                </View>
                {config.includeKeyEntities && (
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#4B5563', marginBottom: 4 }}>TOP ENTITIES:</Text>
                    {(summary?.top_entities || []).slice(0, 5).map((entity, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#006837', marginRight: 4 }} />
                        <Text style={{ fontSize: 7, color: '#374151' }}>{entity}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {config.includeSwot && summary?.swot_analysis && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#006837', marginBottom: 12 }}>SWOT Analysis</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { title: 'Strengths', items: summary?.swot_analysis?.strengths || [], color: '#DCFCE7' },
                  { title: 'Weaknesses', items: summary?.swot_analysis?.weaknesses || [], color: '#FEE2E2' },
                  { title: 'Opportunities', items: summary?.swot_analysis?.opportunities || [], color: '#DBEAFE' },
                  { title: 'Threats', items: summary?.swot_analysis?.threats || [], color: '#FEF3C7' }
                ].map((section, idx) => (
                  <View key={idx} style={{ width: '48%', padding: 10, backgroundColor: section.color, borderRadius: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{section.title}</Text>
                    {section.items.map((item, i) => (
                      <Text key={i} style={{ fontSize: 8, marginBottom: 3 }}>• {item}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}
          <Text style={styles.footer}>Executive Summary | EC Media Intelligence Report</Text>
        </Page>
      )}

      {/* Focus Area Sections (Delineated) */}
      {config.sections && (config.sections.provincialGovernment || config.sections.localGovernment || config.sections.figureHeads || config.sections.serviceDelivery) && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.header}>
            <Text style={styles.title}>Focus Area Intelligence</Text>
            <Text style={styles.subtitle}>Delineated Analysis of Selected Spheres</Text>
          </View>

          {config.sections?.provincialGovernment && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>Provincial Government Focus</Text>
              {(Object.values(data?.clusters || {}).flat() as PDFArticleCluster[])
                .filter(c => c?.articles?.[0]?.sphere_of_government === 'Provincial')
                .slice(0, 5)
                .map((cluster, idx) => renderArticleCluster(cluster, idx))}
            </View>
          )}

          {config.sections?.localGovernment && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>Local Government Focus</Text>
              {(Object.values(data?.clusters || {}).flat() as PDFArticleCluster[])
                .filter(c => c?.articles?.[0]?.sphere_of_government === 'Local')
                .slice(0, 5)
                .map((cluster, idx) => renderArticleCluster(cluster, idx))}
            </View>
          )}

          {config.sections?.figureHeads && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>Key Figureheads & Officials</Text>
              {(Object.values(data?.clusters || {}).flat() as PDFArticleCluster[])
                .filter(c => (c?.articles?.[0]?.person_or_officials_mentioned?.length || 0) > 0)
                .slice(0, 5)
                .map((cluster, idx) => renderArticleCluster(cluster, idx))}
            </View>
          )}

          {config.sections?.serviceDelivery && (
            <View style={{ marginBottom: 30 }}>
              <Text style={styles.sectionTitle}>Service Delivery & Infrastructure</Text>
              {(Object.values(data?.clusters || {}).flat() as PDFArticleCluster[])
                .filter(c => (c?.articles?.[0]?.topic_categories?.includes('Service Delivery') || c?.articles?.[0]?.topic_categories?.includes('Infrastructure')))
                .slice(0, 5)
                .map((cluster, idx) => renderArticleCluster(cluster, idx))}
            </View>
          )}
          
          <Text style={styles.footer}>Focus Area Analysis | EC Media Intelligence Report</Text>
        </Page>
      )}

      {/* Table of Contents - Only for Standard/Technical */}
      {config.depth !== 'light' && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>Table of Contents</Text>
            <Text style={styles.subtitle}>Intelligence Summary by Category</Text>
          </View>
          <View style={{ marginTop: 20 }}>
            {categories.map((cat) => (
              <Link key={cat} src={`#${cat}`} style={styles.tocItem}>
                • {cat} ({getFilteredClusters(cat).length} Intelligence Clusters)
              </Link>
            ))}
          </View>
          <Text style={styles.footer}>Table of Contents | EC Media Intelligence Report</Text>
        </Page>
      )}

      {/* Detailed Sections */}
      {categories.map((cat, catIdx) => {
        const filteredClusters = getFilteredClusters(cat);
        if (filteredClusters.length === 0) return null;

        return (
          <Page key={cat} size="A4" style={styles.page} wrap>
            <View id={cat} style={styles.header}>
              <Text style={styles.title}>{cat}</Text>
              <Text style={styles.subtitle}>Section {catIdx + 1} | {config.depth === 'technical' ? 'Strategic Deep-Dive' : 'Detailed Analysis'}</Text>
            </View>

            {filteredClusters.map((cluster, clusterIdx) => renderArticleCluster(cluster, clusterIdx))}
            
            <Text style={styles.footer}>
              {cat} | EC Media Intelligence Report
            </Text>
          </Page>
        );
      })}
    </Document>
  );
};
