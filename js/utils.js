export function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

export function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}
