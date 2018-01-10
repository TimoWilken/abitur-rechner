// Globals {{{
var MIN_VALID_GRADE = 0,
    MAX_VALID_GRADE = 15;

/* Subject fields
 *
 * The <subject>.field property is an index into this array.
 *
 * U+00AD is a soft hyphen.
 */
var FIELDS = [
    'Sprachlich-literarisch-künstlerisch',
    'Gesellschafts\u00ADwissenschaftlich',
    'Mathematisch-naturwissen\u00ADschaftlich',
    'Andere'
];

// Names of all school terms (Halbjahre)
var TERMS = ['11.1', '11.2', '12.1', '12.2'];

/* Requirement groups
 *
 * If <requirement>.fail == 'sum', this requirement not being met will
 * highlight the field showing the overall sum of enabled terms as invalid.
 */
var REQUIREMENT_GROUPS = {
    Alle:                        { predicate: getTotalChecker(c => c == 36), fail: 'sum', description: 'Es sind insgesamt 36 Halbjahresergebnisse einzubringen.' },
    Fremdsprachen:               { predicate: getAnyChecker(c => c == 4), description: 'Mindestens eine Fremd-/Landessprache muss voll eingebracht werden.' },
    Prüfungsfächer:              { predicate: getAllChecker(c => c == 4), description: 'Prüfungsfächer müssen voll eingebracht werden.' },
    Deutsch:                     { predicate: getAllChecker(c => c == 4), description: 'Deutsch muss voll eingebracht werden.' },
    Mathematik:                  { predicate: getAllChecker(c => c == 4), description: 'Mathematik muss voll eingebracht werden.' },
    Geschichte:                  { predicate: getAllChecker(c => c >= 2), description: 'Mindestens 2 Halbjahre Geschichte müssen eingebracht werden.' },
    Sport:                       { predicate: getAllChecker(c => c <= 3), description: 'Höchstens 3 Halbjahre Sport können eingebracht werden.' },
    Naturwissenschaften:         { predicate: getTotalChecker(c => c >= 4), description: 'Mindestens 4 Halbjahre Naturwissenschaften müssen eingebracht werden.' },
    Gesellschaftswissenschaften: { predicate: getTotalChecker(c => c >= 4), description: 'Mindestens 4 Halbjahre Gesellschaftswissenschaften müssen eingebracht werden.' },
    'Künstlerisches Fach':       { predicate: getTotalChecker(c => c >= 3), description: 'Mindestens 3 Halbjahre eines künstlerischen Faches müssen eingebracht werden.' },
    'Kunst oder Musik':          { predicate: getExclusiveChecker(), description: 'Es kann nur entweder Kunst oder Musik eingebracht werden.' },
    'Fremdsprachen und Naturwissenschaften': { predicate: getAllChecker([0, 2, 3, 4].includes), description: '' }
}

var _saveState, subjects;
// }}}

// Requirement checking {{{
function getTotalChecker(totalPredicate) {
    // the sum of enabled terms in the group must satisfy the requirements
    return function (subjects) {
        var total = subjects.map(countEnabled).reduce((a, b) => a + b);
        return (!totalPredicate(total)) ? subjects : false;
    };
}

function getAllChecker(eachPredicate) {
    // each subject's enabled count must satisfy requirements
    return function (subjects) {
        var failed = subjects.filter(s => !eachPredicate(countEnabled(s)));
        return (failed.length > 0) ? failed : false;
    };
}

function getAnyChecker(eachPredicate) {
    // at least one subject must satisfy requirements
    return subjects => subjects.map(countEnabled).some(eachPredicate) ? false : subjects;
}

function getExclusiveChecker() {
    // only one subject in the group may have enabled terms
    return function (subjects) {
        var numWithEnabled = subjects.map(countEnabled).filter(e => e > 0).length;
        return (numWithEnabled > 1) ? subjects : false;
    };
}

function countEnabled(subject) {
    return Object.values(subject.termGrades).filter(g => g.enabled).length;
}

function unmetRequirements() {
    // returns a list of the form:
    // [{ group: firstFailedGroup, failedSubjects: [...] },
    //  { group: secondFailedGroup, failedSubjects: [...] }, ...]

    return Object.entries(getSubjectsByGroup()).map(function (entry) {
        var groupName = entry[0],
            groupSubjects = entry[1],
            group = REQUIREMENT_GROUPS[groupName],
            failed = group.predicate(groupSubjects);
        if (failed) return { groupName: groupName, group: group, failed: failed };
    }).filter(e => e != undefined);
}

function populateRulesTables(errors) {
    var termsErrorsTable = document.getElementById('tbody-requirements-terms');
    clearTBody(termsErrorsTable);

    if (errors == undefined) errors = unmetRequirements();
    errors.forEach(function (error) {
        var errorRow = termsErrorsTable.insertRow(-1);
        errorRow.insertCell(-1).appendChild(document.createTextNode(error.groupName));
        errorRow.insertCell(-1).appendChild(document.createTextNode(error.group.description));
        errorRow.insertCell(-1).appendChild(document.createTextNode(error.failed.map(getSubjectName).join(', ')));
    });

    if (errors.length > 0) {
        removeClassName(document.getElementById('terms-errors'), 'empty');
    } else {
        addClassName(document.getElementById('terms-errors'), 'empty');
    }
}

function updateRequirementIndicators(errors) {
    if (errors == undefined) errors = unmetRequirements();
}
// }}}

// Validation and helper functions {{{
function getSubjectName(subject) {
    return Object.entries(subjects)
        .map(e => (e[1] == subject) ? e[0] : undefined)
        .filter(e => e != undefined)[0];
}

function getSubjectsByGroup() {
    var subjectsByGroup = {};
    Object.keys(REQUIREMENT_GROUPS).forEach(name => subjectsByGroup[name] = []);
    Object.values(subjects).forEach(s => s.groups.forEach(groupName => subjectsByGroup[groupName].push(s)));
    return subjectsByGroup;
}

function isValidGrade(number) {
    return !isNaN(number) && MIN_VALID_GRADE <= number && number <= MAX_VALID_GRADE;
}

function getGradeId(subjectName, term) { return `${subjectName}-${term}` }
function getGradeEnabledId(subjectName, term) { return `${getGradeId(subjectName, term)}-enabled`; }
function getGradeNumberId(subjectName, term)  { return `${getGradeId(subjectName, term)}-grade`; }
function getTermCountId(subjectName) { return `${subjectName}-totalterms`; }
function getTermCountTextId(subjectName) { return `${subjectName}-totalterms-text`; }
function getPointCountId(subjectName) { return `${subjectName}-totalpoints`; }

function getSaveState() { return _saveState; }

function setSaveState(state) {
    // state is one of 'unsaved', 'saved', 'nofile'
    switch (state) {
        case 'unsaved':
            window.onbeforeunload = function (e) {
                var dialogText = 'Nicht gespeicherte Änderungen gehen verloren!';
                e.returnValue = dialogText;
                return dialogText;
            };
            break;
        case 'saved':
        case 'nofile':
            window.onbeforeunload = undefined;
            break;
        default:
            throw `Invalid save state: ${state}`;
    }
    _saveState = state;
}

function addClassName(element, className) {
    element.className += ' ' + className;
}

function removeClassName(element, className) {
    element.className = element.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, 'g'), '')
}

function extrapolateFutureGrades(subjectName) {
    // Future term and exam grades are estimated as the unweighted average of
    // given term and exam grades, enabled or not (there is one average, so
    // e.g. given term grades influence extrapolated future exam grades).
    var subject = subjects[subjectName];
    var gradeSum = 0, gradeCount = 0;

    function addGradesToSum(e) {
        var term = e[0], grade = e[1].grade, enabled = e[1].enabled;
        if (grade == undefined) return;
        gradeSum += grade;
        gradeCount++;
    }

    Object.entries(subject.termGrades).forEach(addGradesToSum);
    Object.entries(subject.examGrades).forEach(addGradesToSum);

    return (gradeCount == 0) ? 0 : gradeSum / gradeCount;
}
// }}}

// Editing {{{
function recalculateGradePlaceholders(subjectName) {
    var futureGrades = extrapolateFutureGrades(subjectName);
    TERMS.forEach(function (term) {
        var inputbox = document.getElementById(getGradeNumberId(subjectName, term));
        inputbox.placeholder = futureGrades;
    });
}

function recalculateTermCount() {
    var totalTerms = 0;

    function recalculateSubjectTermCount(subjectName) {
        var termsEnabled = 0;
        Object.entries(subjects[subjectName].termGrades).forEach(function (e) {
            if (e[1].enabled) {
                termsEnabled++;
            }
        });
        var countCell = document.getElementById(getTermCountTextId(subjectName));
        countCell.textContent = termsEnabled;
        totalTerms += termsEnabled;
    }

    Object.keys(subjects).forEach(recalculateSubjectTermCount);

    var totalTermsCell = document.getElementById('total-terms');
    totalTermsCell.textContent = totalTerms;
}

function recalculatePointCount() {
    var totalPoints = 0;

    function recalculateSubjectPointCount(subjectName) {
        var points = 0;
        Object.entries(subjects[subjectName].termGrades).forEach(function (e) {
            if (e[1].enabled) {
                if (e[1].grade == undefined) {
                    points += extrapolateFutureGrades(subjectName);
                } else {
                    points += e[1].grade;
                }
            }
        });
        var pointsCell = document.getElementById(getPointCountId(subjectName));
        pointsCell.textContent = points;
        totalPoints += points;
    }

    Object.keys(subjects).forEach(recalculateSubjectPointCount);

    var totalPointsCell = document.getElementById('total-points');
    totalPointsCell.textContent = totalPoints;

    var resultCell = document.getElementById('result-1');
    // round half up; formula is E_I = 40 P / 36
    resultCell.textContent = Math.round(totalPoints / 36 * 40);
}

function getGradeNumberChangeHandler(subjectName, term) {
    return function (e) {
        var numString = e.target.value;
        var number = parseFloat(numString);
        if (isValidGrade(number) || numString == '') {
            subjects[subjectName].termGrades[term].grade = numString ? number : null;

            recalculateGradePlaceholders(subjectName);
            recalculatePointCount();

            removeClassName(e.target, 'invalid-input');
            if (numString == '') {
                addClassName(e.target, 'empty');
            } else {
                removeClassName(e.target, 'empty');
            }

            setSaveState('unsaved');
        } else {
            addClassName(e.target, 'invalid-input');
        }
    };
}

function getGradeEnabledChangeHandler(subjectName, term) {
    return function (e) {
        subjects[subjectName].termGrades[term].enabled = e.target.checked;

        recalculateTermCount();
        recalculatePointCount();
        populateRulesTables();

        setSaveState('unsaved');
    };
}
// }}}

// Startup and initialisation {{{
function clearTRow(trow)   { while (trow.cells.length > 0) trow.deleteCell(0); }
function clearTBody(tbody) { while (tbody.rows.length > 0) tbody.deleteRow(0); }

function populateTermHeaders() {
    var termsHeaderRow = document.getElementById('hdrow-terms');
    clearTRow(termsHeaderRow);
    TERMS.forEach(function (term) {
        var termHeader = document.createElement('th');
        termHeader.textContent = term;
        termsHeaderRow.appendChild(termHeader);
    });
    document.getElementById('hdr-terms-grades').colSpan = TERMS.length;

    var overallCol = document.getElementById('col-terms-terms');
    overallCol.span = TERMS.length;
    // width of one column under the <col>
    overallCol.style.width = `${50 / TERMS.length}%`;

    document.getElementById('lbl-terms-sum').colSpan = 2 + TERMS.length;
    document.getElementById('lbl-terms-result').colSpan = 3 + TERMS.length;
}

function populateTermGradeTable() {
    populateTermHeaders();

    var tbody = document.getElementById('tbody-grades-terms');
    clearTBody(tbody);

    function populateGradeCell(cell, subject, term, grade) {
        function createGradeCheckbox(subject, term, grade) {
            var checkbox = document.createElement('input');
            checkbox.title = `${subject}note im Halbjahr ${term} einbringen?`;
            checkbox.type = 'checkbox';
            checkbox.checked = grade.enabled;
            checkbox.className = 'grade-checkbox';
            checkbox.id = getGradeEnabledId(subject, term);
            checkbox.addEventListener('input', getGradeEnabledChangeHandler(subject, term));
            return checkbox;
        }

        function createGradeNumberBox(subject, term, grade) {
            var textbox = document.createElement('input');
            textbox.title = `${subject}note im Halbjahr ${term} in Punkten (0-15). Falls leer, automatisch bestimmt als Durchschnitt anderer gegebenen Noten.`;
            textbox.type = 'number';
            textbox.min = MIN_VALID_GRADE;
            textbox.max = MAX_VALID_GRADE;
            textbox.step = 1;
            textbox.value = (grade.grade == null) ? '' : grade.grade;
            textbox.className = 'grade-value empty';
            textbox.id = getGradeNumberId(subject, term);
            textbox.addEventListener('input', getGradeNumberChangeHandler(subject, term));
            return textbox;
        }

        var id = getGradeId(subject, term);
        cell.className = 'grade-cell';
        cell.appendChild(createGradeCheckbox(subject, term, grade));
        cell.appendChild(createGradeNumberBox(subject, term, grade));
    }

    var lastField = -1, lastFieldCell;

    Object.entries(subjects).forEach(function (s) {
        var name = s[0], val = s[1];
        var row = tbody.insertRow(-1);

        if (val.field != lastField) {
            lastFieldCell = row.insertCell(0);
            var fieldText = document.createTextNode(FIELDS[val.field]);
            lastFieldCell.appendChild(fieldText);
            lastField = val.field;
        } else {
            lastFieldCell.rowSpan++;
        }

        var nameCell = row.insertCell(-1);
        var nameText = document.createTextNode(name);
        nameCell.appendChild(nameText);

        TERMS.forEach(function (term) {
            var cell = row.insertCell(-1);
            populateGradeCell(cell, name, term, val.termGrades[term]);
        });

        var totalTermsCell = row.insertCell(-1);
        totalTermsCell.className = 'total-terms invalid';
        totalTermsCell.id = getTermCountId(name);
        var totalTermsText = document.createElement('span');
        totalTermsText.className = 'total-terms-text invalid';
        totalTermsText.id = getTermCountTextId(name);
        totalTermsCell.appendChild(totalTermsText);
        var invalidIcon = document.createElement('div');
        invalidIcon.className = 'icon-invalid';
        totalTermsCell.appendChild(invalidIcon);

        var totalPointsCell = row.insertCell(-1);
        totalPointsCell.className = 'total-points';
        totalPointsCell.id = getPointCountId(name);

        recalculateGradePlaceholders(name);
    });

    recalculateTermCount();
    recalculatePointCount();
    populateRulesTables();
}

function startNew() {
    if (getSaveState() == 'unsaved' &&
        !confirm('Diese Datei hat ungespeicherte Änderungen. Trotzdem eine neue Datei anlegen?')) {
        return;
    }

    subjects = {
        // format:
        // FachName: {
        //      field: (see FIELDS above),
        //      min: (minimum number of term grades countable),
        //      max: (maximum number of term grades countable),
        // }

        // linguistic-literary-artistic
        Deutsch:        { field: 0, groups: ['Alle', 'Deutsch'] },
        Englisch:       { field: 0, groups: ['Alle', 'Fremdsprachen'] },
        Französisch:    { field: 0, groups: ['Alle', 'Fremdsprachen'] },
        Spanisch:       { field: 0, groups: ['Alle', 'Fremdsprachen'] },
        Kunst:          { field: 0, groups: ['Alle', 'Künstlerisches Fach', 'Kunst oder Musik'] },
        Musik:          { field: 0, groups: ['Alle', 'Künstlerisches Fach', 'Kunst oder Musik'] },

        // social sciences
        Geschichte:     { field: 1, groups: ['Alle', 'Gesellschaftswissenschaften', 'Geschichte'] },
        Erdkunde:       { field: 1, groups: ['Alle', 'Gesellschaftswissenschaften'] },
        Ethik:          { field: 1, groups: ['Alle', 'Gesellschaftswissenschaften'] },

        // mathematical-scentific-technical
        Mathematik:     { field: 2, groups: ['Alle', 'Mathematik'] },
        Physik:         { field: 2, groups: ['Alle', 'Naturwissenschaften'] },
        Chemie:         { field: 2, groups: ['Alle', 'Naturwissenschaften'] },
        Biologie:       { field: 2, groups: ['Alle', 'Naturwissenschaften'] },

        // other
        Sport:          { field: 3, groups: ['Alle', 'Sport'] }
    };

    function newGrade() { return { grade: null, enabled: true }; }
    Object.values(subjects).forEach(function (s) {
        s.termGrades = {};
        TERMS.forEach(term => s.termGrades[term] = newGrade());
        s.examGrades = { written: newGrade(), oral: newGrade() };
    });

    populateTermGradeTable();
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
// }}}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
