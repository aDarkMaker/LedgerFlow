export type MigrationJournalEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
  version?: string;
};

export type MigrationJournal = {
  readonly entries: MigrationJournalEntry[];
  readonly version?: string;
  readonly dialect?: string;
};

export type MigrationBundle = {
  journal: MigrationJournal;
  migrations: Record<string, string>;
};
