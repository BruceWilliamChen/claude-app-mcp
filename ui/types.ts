// Shared types between server and UI
// This is the contract — both sides import from here.

// What the server returns when open-configurator is called
export interface ConfiguratorToolOutput {
  message: string;
}

// What the UI pushes to Claude via updateModelContext()
export interface ConfiguratorAppState {
  message: string;
}
