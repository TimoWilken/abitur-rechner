function sum(terms) {
    return terms.reduce((a, b) => a + b, 0);
}

function addClassName(element, className) {
    element.className += ' ' + className;
}

function removeClassName(element, className) {
    element.className = element.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, 'g'), '');
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
