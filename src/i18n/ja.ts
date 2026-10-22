import type { Dictionary } from './en';

// TODO(yasa): review every string below. These are interface labels only; page
// copy for Japanese comes from ja/ content files you write yourself.
export const ja: Dictionary = {
  skipToContent: '本文へスキップ',
  nav: {
    label: 'メイン',
    home: 'ホーム',
    projects: 'プロジェクト',
    homelab: 'ホームラボ',
    writing: '記事',
    cv: '職務経歴書',
  },
  langSwitch: { label: 'English', hreflang: 'en' },
  home: {
    credentials: '資格',
    featured: '注目のケーススタディ',
    projects: 'プロジェクト',
    allProjects: 'すべてのプロジェクト',
    writing: '最新の記事',
    allWriting: 'すべての記事',
    contact: 'リンク',
  },
  links: { cv: '職務経歴書 (PDF)', github: 'GitHub', linkedin: 'LinkedIn', email: 'メール' },
  project: {
    readCaseStudy: 'ケーススタディを読む',
    stack: '技術スタック',
    requiredSections: ['背景', 'アーキテクチャ', '設計判断とトレードオフ', '障害と対応', '成果'],
  },
  projectsIndex: {
    title: 'プロジェクト',
    description: '構築・運用してきたインフラとデータ基盤のケーススタディ。',
  },
  writingIndex: {
    title: '記事',
    description: 'プラットフォームエンジニアリング、Kubernetes、データ基盤についてのメモ。',
  },
  post: { published: '公開', updated: '更新', draft: '下書き' },
  cv: { download: '職務経歴書をダウンロード (PDF)', embedTitle: '職務経歴書' },
  notFound: {
    title: 'ページが見つかりません',
    description: 'このページは存在しません。',
    back: 'ホームへ戻る',
  },
  footer: { source: 'ソース' },
};
