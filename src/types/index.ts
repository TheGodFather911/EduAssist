export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

export interface User {
  id: string;
  name: string;
}