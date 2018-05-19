import SubjectConfiguration from 'subjectconfig.js';
import { TermGradeTable, ExamGradeTable } from 'table.js';

export default class App {

    static newFile(subjectConfiguration = SubjectConfiguration.createDefault()) {
        if (this.saveState === 'unsaved' && !confirm('Diese Datei hat ungespeicherte Änderungen. Trotzdem eine neue Datei anlegen?')) {
            return;
        }

        this.config = subjectConfiguration;
        let setUnsaved = () => this.saveState = 'unsaved';
        this.config.subscribe(setUnsaved);
        Object.values(this.config.subjects).forEach(s => {
            s.subscribe(setUnsaved);
            s.termGrades.subscribe(setUnsaved);
            s.examGrades.subscribe(setUnsaved);
        });

        this.termsTable = new TermGradeTable(this.config.fields, this.config.requirements.filter(r => r.failSum));
        this.examsTable = new ExamGradeTable();

        Object.defineProperty(this, 'saveState', {
            configurable: true,
            get() { return this._saveState; },
            set(state) {
                switch (state) {
                    case 'unsaved':
                        window.addEventListener('beforeunload', warnUnsaved);
                        break;
                    case 'saved':
                    case 'nofile':
                        window.removeEventListener('beforeunload', warnUnsaved);
                        break;
                    default:
                        throw `Invalid save state: ${state}`;
                }
                this._saveState = state;
            },
        });
        this.saveState = 'saved';
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

    static saveFile() {
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
        this.saveState = 'saved';
    }

}

function warnUnsaved(e) {
    let dialogText = 'Nicht gespeicherte Änderungen gehen verloren!';
    e.returnValue = dialogText;
    return dialogText;
}
