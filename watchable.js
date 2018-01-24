const Watchable = (superclass = Object) => class Watchable extends superclass {

    constructor(...args) {
        super(...args);
        Object.defineProperty(this, '_subscribers', { writable: true, value: [] });
    }

    subscribe(callback) {
        this._subscribers.push(callback);
    }

    _update(...args) {
        this._subscribers.forEach(f => f(this, ...args));
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
