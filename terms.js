function unmetTermRequirements() {
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

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
