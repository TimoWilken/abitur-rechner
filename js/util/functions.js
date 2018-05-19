export function sum(terms) {
    return terms.reduce((a, b) => a + b, 0);
}

export function addClassName(element, className) {
    element.className += ' ' + className;
}

export function removeClassName(element, className) {
    element.className = element.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, 'g'), '');
}
