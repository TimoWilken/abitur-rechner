function startNew() {
    if (getSaveState() == 'unsaved' &&
        !confirm('Diese Datei hat ungespeicherte Änderungen. Trotzdem eine neue Datei anlegen?')) {
        return;
    }

    // deep copy
    subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));

    function newGrade() { return { grade: null, enabled: true }; }
    Object.values(subjects).forEach(function (s) {
        s.termGrades = {};
        TERMS.forEach(term => s.termGrades[term] = newGrade());
        s.examGrades = { written: newGrade(), oral: newGrade() };
    });

    populateTermGradeTable();
    populateExamGradeTable();
    setSaveState('nofile');
}

// document.getElementById('filechooser-open').addEventListener('change',
function openFile(chooser) {
    if (chooser.files && chooser.files[0]) {
        var reader = new FileReader();
        reader.addEventListener('load', function (e) {
            try {
                subjects = JSON.parse(e.target.result);
                populateTermGradeTable();
                populateExamGradeTable();
                setSaveState('saved');
            } catch (e) {
                alert('Diese Datei konnte nicht gelesen werden:\n' + e);
                startNew();
                throw e;
            }
        });
        reader.readAsText(chooser.files[0]);
    }
};

function saveFile() {
    var filename = `Abirechner (${new Date().toUTCString()}).json`;
    var data = JSON.stringify(subjects);
    var file = new Blob([data], { type: 'application/json' });
    if (window.navigator.msSaveOrOpenBlob) { // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    } else { // Others
        var a = document.createElement('a'), url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
    setSaveState('saved');
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
