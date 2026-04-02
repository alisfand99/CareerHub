/** Short, non-technical strings for UI (no table names, env keys, or file paths). */

export const workspaceNotReady =
  "This workspace isn’t connected yet. If you manage this app, finish the setup steps in your hosting dashboard. Otherwise, ask your administrator.";

export const dataLoadFailed =
  "We couldn’t load your data. Check your internet connection and try again. If the problem continues, your workspace may still be finishing setup.";

export const firstTimeSetupHint =
  "If you just deployed this app, its first-time setup may still be in progress.";

/** When Bio-Vault queries fail (e.g. workspace schema not yet updated after an app upgrade). */
export const bioVaultPartialLoad =
  "Some of this page couldn’t load. Try refreshing. If it keeps happening, whoever maintains this workspace may need to apply the latest data setup from the project—new sections like education and certifications depend on that.";
