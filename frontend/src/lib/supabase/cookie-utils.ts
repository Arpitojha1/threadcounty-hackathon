export function applySessionOnlyRule(options: any = {}, isSessionOnly: boolean) {
  if (isSessionOnly && options) {
    if (options.maxAge) delete options.maxAge;
    if (options.expires) delete options.expires;
  }
  return options;
}
