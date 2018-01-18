class App {

    constructor(subjectConfiguration = SubjectConfiguration.createDefault()) {
        this.config = subjectConfiguration;

        this.termsTable = new TermGradeTable(this.config.fields, this.config.requirements.filter(r => r.failSum));
        this.examsTable = new ExamGradeTable();

        Object.defineProperty(this, '_saveState', { writable: true, value: 'saved' });
    }

    _warnUnsaved(e) {
        let dialogText = 'Nicht gespeicherte Änderungen gehen verloren!';
        e.returnValue = dialogText;
        return dialogText;
    }

    get saveState() {
        return this._saveState;
    }

    setSaveState(state) {
        switch (state) {
            case 'unsaved':
                window.addEventListener(window, this._warnUnsaved.bind(this));
                break;
            case 'saved':
            case 'nofile':
                window.removeEventListener(window, this._warnUnsaved.bind(this));
                break;
            default:
                throw `Invalid save state: ${state}`;
        }
        this._saveState = state;
    }

    static openFile(chooser) {
        if (chooser.files && chooser.files[0]) {
            let reader = new FileReader();
            reader.addEventListener('load', function (e) {
                try {
                    return new App(SubjectConfiguration.fromJSON(JSON.parse(e.target.result)));
                } catch (err) {
                    alert('Diese Datei konnte nicht gelesen werden:\n' + err);
                    throw err;
                }
            });
            reader.readAsText(chooser.files[0]);
        }
    }

    saveFile() {
        let filename = `Abirechner (${new Date().toUTCString()}).json`;
        let data = JSON.stringify(this.config.toJSON());
        let file = new Blob([data], { type: 'application/json' });
        if (window.navigator.msSaveOrOpenBlob) { // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        } else { // Others
            let url = URL.createObjectURL(file);
            let a = document.body.appendChild(Object.assign(document.createElement('a'), { href: url, download: filename }));
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
        this.setSaveState('saved');
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
