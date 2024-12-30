export interface ISearchParams {
  userId: string;
  projectId: string;
  searchQuery: string;
  exact: boolean;
  caseSensitive: boolean;
  inKeys: boolean;
  inValues: boolean;
  inFolders: boolean;
  inComponents: boolean;
}
