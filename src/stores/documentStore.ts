import { create } from 'zustand';
import { Document } from '../types';

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  addDocument: (document: Document) => void;
  updateDocument: (document: Document) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  addDocument: (document) => set((state) => ({ 
    documents: [...state.documents, document] 
  })),
  updateDocument: (document) => set((state) => ({
    documents: state.documents.map((d) => 
      d.id === document.id ? document : d
    ),
  })),
}));