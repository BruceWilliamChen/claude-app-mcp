import { useState, useCallback } from "react";
import type { FilterConfig, FilterResult, FilterType, ResponseType, DisplayOptions } from "../types";

const DEFAULT_CONFIG: FilterConfig = {
  filter_type: "butterworth",
  response_type: "lowpass",
  order: 4,
  cutoff_freq: 1000,
  sample_rate: 8000,
  display: {
    magnitude: true,
    phase: true,
    group_delay: false,
    pole_zero: false,
  },
};

export function useFilterDesign() {
  const [config, setConfig] = useState<FilterConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<FilterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autorun, setAutorun] = useState(false);

  const updateConfig = useCallback((partial: Partial<FilterConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateDisplay = useCallback((partial: Partial<DisplayOptions>) => {
    setConfig((prev) => ({
      ...prev,
      display: { ...prev.display, ...partial },
    }));
  }, []);

  const setFilterType = useCallback((filter_type: FilterType) => {
    updateConfig({ filter_type });
  }, [updateConfig]);

  const setResponseType = useCallback((response_type: ResponseType) => {
    updateConfig({ response_type });
  }, [updateConfig]);

  // Conditional field visibility
  const showCutoffHigh =
    config.response_type === "bandpass" || config.response_type === "bandstop";
  const showRipple =
    config.filter_type === "chebyshev1" || config.filter_type === "elliptic";
  const showAtten =
    config.filter_type === "chebyshev2" || config.filter_type === "elliptic";
  const showRippleSection = showRipple || showAtten;

  return {
    config,
    result,
    error,
    isRunning,
    autorun,
    setConfig,
    updateConfig,
    updateDisplay,
    setFilterType,
    setResponseType,
    setResult,
    setError,
    setIsRunning,
    setAutorun,
    showCutoffHigh,
    showRipple,
    showAtten,
    showRippleSection,
  };
}
