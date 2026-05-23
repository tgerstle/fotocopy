export interface FotocopyConfig {
  testTargetUrl: string;
  maxSubpages: number;
  ollamaUrl: string;
  ollamaModel: string;
  crawlerConcurrency: number;
  chunkSize: number;
  overlapSize: number;
  intakeCsvPath: string;
  outputDir: string;
}

const defaultConfig: FotocopyConfig = {
  testTargetUrl: "",
  maxSubpages: 0,
  ollamaUrl: "",
  ollamaModel: "",
  crawlerConcurrency: 1,
  chunkSize: 500,
  overlapSize: 50,
  intakeCsvPath: "",
  outputDir: ""
};

let currentConfig: FotocopyConfig = { ...defaultConfig };

export function setConfig(config: Partial<FotocopyConfig>) {
  currentConfig = { ...defaultConfig, ...config };
}

export function getConfig(): FotocopyConfig {
  return currentConfig;
}
