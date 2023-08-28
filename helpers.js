export function queryElements(selector) {
  if (typeof selector === 'string') {
    return [...document.querySelectorAll(selector)];
  } else if (selector instanceof HTMLElement) {
    return [selector];
  } else if (selector instanceof NodeList) {
    return [...selector];
  } else {
    return [];
  }
}

export function loadScriptAsync(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);

    document.body.append(script);
  });
}