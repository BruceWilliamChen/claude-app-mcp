// Shared types between server and UI

export type FilterType = "butterworth" | "chebyshev1" | "chebyshev2" | "elliptic" | "fir";
export type ResponseType = "lowpass" | "highpass" | "bandpass" | "bandstop";

export interface DisplayOptions {
  magnitude: boolean;
  phase: boolean;
  group_delay: boolean;
  pole_zero: boolean;
}

export interface FilterConfig {
  filter_type: FilterType;
  response_type: ResponseType;
  order: number;
  cutoff_freq: number;
  cutoff_freq_high?: number;
  sample_rate: number;
  passband_ripple?: number;
  stopband_atten?: number;
  display: DisplayOptions;
}

export interface FilterResultData {
  b: number[];
  a: number[];
  freq: number[];
  magnitude: number[];
  phase: number[];
  group_delay?: number[];
  freq_gd?: number[];
  zeros_real?: number[];
  zeros_imag?: number[];
  poles_real?: number[];
  poles_imag?: number[];
}

export interface FilterResult {
  data: FilterResultData;
  matlab_code: string;
  elapsed: number;
}

export interface FilterError {
  error: string;
  matlab_code?: string;
}

// What configure-filter tool returns
export interface ConfigureFilterOutput {
  config: Omit<FilterConfig, "display">;
  matlab_code: string;
  matlab_status: { connected: boolean; version?: string; pid?: number };
}
