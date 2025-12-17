export type Metric = {
  id: string;
  title: string;
  value: number;
  change?: number;
  changeType?: "increase" | "decrease";
};

export type MetricOption = {
  id: string;
  label: string;
  description?: string;
};

export const METRIC_OPTIONS: MetricOption[] = [
  {
    id: "time-to-hire",
    label: "Time to Hire",
    description: "Average days from application to offer acceptance",
  },
  {
    id: "candidate-pipeline",
    label: "Candidate Pipeline",
    description: "Total active candidates in the pipeline",
  },
  {
    id: "interview-conversion",
    label: "Interview Conversion Rate",
    description: "Percentage of interviews that progress to next stage",
  },
  {
    id: "offer-acceptance",
    label: "Offer Acceptance Rate",
    description: "Percentage of offers accepted by candidates",
  },
  {
    id: "active-candidates",
    label: "Active Candidates",
    description: "Number of candidates currently in active stages",
  },
  {
    id: "positions-filled",
    label: "Positions Filled",
    description: "Total positions successfully filled this period",
  },
  {
    id: "avg-time-in-stage",
    label: "Average Time in Stage",
    description: "Average days candidates spend in each stage",
  },
  {
    id: "source-performance",
    label: "Source Performance",
    description: "Performance metrics by candidate source",
  },
  {
    id: "candidate-quality",
    label: "Candidate Quality Score",
    description: "Overall quality rating of candidates in pipeline",
  },
  {
    id: "hiring-velocity",
    label: "Hiring Velocity",
    description: "Rate of successful hires over time",
  },
];

export function getMetricsData(): Metric[] {
  // Dummy data - in production, this would come from database
  // Currently the dashboard shows placeholder icons, but this structure
  // can be used when metrics are implemented
  return [];
}

