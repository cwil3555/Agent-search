export type SearchResult = {
  title: string;
  snippet: string;
  url: string;
  published_date: string | null;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  cached: boolean;
};

export type FetchResponse = {
  url: string;
  title: string;
  content: string;
  word_count: number;
  cached: boolean;
};

export type ResearchResult = {
  title: string;
  url: string;
  snippet: string;
  content: string;
  word_count: number;
};

export type ResearchResponse = {
  query: string;
  results: ResearchResult[];
  cached: boolean;
};
