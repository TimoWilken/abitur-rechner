function getTotalSubjectExamsPoints(subjectName) {
    var points = Object.values(subjects[subjectName].examGrades)
        .filter(grade => grade.enabled)
        .map(grade => (grade.grade != undefined) ? grade.grade : extrapolateFutureGrades(subjectName))
        .reduce(sum);
    return [subjectName, points];
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
