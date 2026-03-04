// src/types/csv.ts

// Helper: we still allow extra columns without breaking parsing
export type CsvRowBase = Record<string, string | undefined>;

/** Persons.csv */
export type PersonRow = CsvRowBase & {
  'Case Number'?: string;
  'Full Name'?: string;
  'Date of Birth'?: string;
  'Current Age'?: string;
  'Gender'?: string;
  'Active Referral?'?: string;
  'Post Code'?: string;
  'Latest Allocated Worker'?: string;
  'Allocated Worker Department'?: string;

  // spelling error carried over from original Liquid Logic data
  'Nationanlity Description'?: string;
  'Ethnicity Description'?: string;

  'Missing Episodes (3M)'?: string;
  'Missing Episodes (12M)'?: string;

  'Count of Hazards'?: string;

  'MatchKey'?: string;
};

/** Hazards.csv */
export type HazardRow = CsvRowBase & {
  'Case Number'?: string;

  'Date Hazard Started'?: string;
  'Date Hazard Ended'?: string;

  'Hazard Type'?: string;
  'Hazard Type (groups)'?: string;
  'Hazard Status'?: string;
  'Review Date'?: string;

  'Hazard Details'?: string;
  'Hazard'?: string;
};

/** Missing Episodes.csv */
export type MissingEpisodeRow = CsvRowBase & {
  'Case Number'?: string;

  'Missing Person Start Date'?: string;
  'Missing Person End Date'?: string;

  'CLA Start Date'?: string;
  'CLA End Date'?: string;

  'Completed within 72 hours?'?: string;
  'Date/Time Found'?: string;
  'Date/Time of Return Interview'?: string;

  'Day of Week'?: string;
  'Duration of Time Missing'?: string;
  'REASON'?: string;

};

export type AssetPlusRow = CsvRowBase & {
  'Case Number'?: string;
  'Start Date'?: string;

  'Rosh judgement'?: string;
  'Signed Date'?: string;
  'Likelihood of reoffending'?: string;
  'YOGRs'?: string;
  'MAPPA Category'?: string;
  'MAPPA Level'?: string;
  'Indicative Scaled Approach intervention level'?: string;
  'Scaled Approach intervention level'?: string;

  'Risk to Children?'?: string;
  'Overall Safety and Wellbeing Concerns'?: string;
  'County lines risk'?: string;
  'Vulnerable to criminal exploitation'?: string;
  'Sexual exploitation risk'?: string;
};

/** Interventions.csv */
export type InterventionRow = CsvRowBase & {
  'Case Number'?: string;

  'Start Date'?: string;
  'End Date'?: string;

  'Intervention ID'?: string;
  'Supervisor'?: string;
  'Intervention Type'?: string;
  'First further offence ro'?: string;
  'Key Process'?: string;
  'Last Asset ROSH level'?: string;
  'Frequency'?: string;
  'YOGRS'?: string;
  'Last Asset Score'?: string;
  'Likelihood of reoffending'?: string;
  'Linked Assessment'?: string;
  'Linked Offence'?: string;
  'Main Outcome'?: string;
  'Indicative lor'?: string;
  'Indic sa intv level'?: string;
  'Most serious offence ro'?: string;
  'Num offence 12m ro'?: string;
  'Original offence ro'?: string;
  'Outcome ro'?: string;
  'Re-offended?'?: string;
};